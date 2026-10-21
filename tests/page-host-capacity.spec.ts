import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { PAGE_HOST_RESIDENT_LIMIT, usePageHostPilotStore, type PageHostPilotRoute } from '@/runtime/page-host/pilot-store';
import type { PageDescriptor } from '@/runtime/page-host/types';

vi.mock('@/router/routes', () => ({
  getGlobalConfig: () => ({ InternalCode: 'test', UseWindowOrigin: true, Parameters: {} }),
}));

function page(index: number): PageDescriptor {
  return { tabKey: `page-${index}`, path: `/page-${index}`, kvid: `kvid-${index}`, type: ['webview', 'vue', 'umd'][index % 3] as PageDescriptor['type'], url: `/content-${index}` };
}
function route(index: number): PageHostPilotRoute {
  const descriptor = page(index);
  return { path: descriptor.path, name: descriptor.tabKey, kvid: descriptor.kvid, handlerResolved: true, handler: descriptor.url };
}
function fill(count = PAGE_HOST_RESIDENT_LIMIT) {
  const store = usePageHostPilotStore();
  for (let i = 0; i < count; i++) store.hostResolvedPage(page(i), page(i).url);
  return store;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.stubGlobal('window', { location: { origin: 'https://dashboard.test' } });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('PageHost resident limit', () => {
  it('allows 15 mixed pages and rejects the sixteenth without evicting or hiding the active page', () => {
    const store = fill();
    expect(store.pages.size).toBe(15);
    const activeBefore = store.activeInstanceKey;
    expect(store.canHostRoute(route(15))).toBe(false);
    expect(store.prepareRoute(route(15), true)).toBe(false);
    expect(store.capacityWarning).toBe(true);
    expect(store.activeInstanceKey).toBe(activeBefore);
    expect(() => store.hostResolvedPage(page(15), page(15).url)).toThrow('limit');
    expect(store.pages.size).toBe(15);
  });

  it('switches to an existing instance at capacity but rejects another query-specific instance', () => {
    const store = fill();
    const firstKey = store.allPages[0].instanceKey;
    expect(store.canHostRoute(route(0))).toBe(true);
    expect(store.prepareRoute(route(0), true)).toBe(true);
    expect(store.activeInstanceKey).toBe(firstKey);
    expect(store.canHostRoute({ ...route(0), query: { recordId: 'new' } })).toBe(false);
    expect(store.pages.size).toBe(15);
  });

  it('counts the current loading reservation so another new route cannot take the last slot', async () => {
    const store = fill(14);
    expect(store.prepareRoute(route(14), true)).toBe(true);
    expect(store.canHostRoute(route(14))).toBe(true);
    expect(store.canHostRoute(route(15))).toBe(false);
    expect(await store.resolveRoute(route(14))).toBe(true);
    expect(store.pages.size).toBe(15);
  });

  it('releases capacity after a tab closes and clears the warning', async () => {
    const store = fill();
    store.showCapacityWarning();
    store.removeByPath(page(0).path);
    expect(store.capacityWarning).toBe(false);
    expect(store.canHostRoute(route(15))).toBe(true);
    expect(store.prepareRoute(route(15), true)).toBe(true);
    expect(await store.resolveRoute(route(15))).toBe(true);
    expect(store.pages.size).toBe(15);
  });

  it('allows replacing a refreshed page at capacity', async () => {
    const store = fill();
    store.prepareRoute({ path: '/blank' }, false);
    store.removeByPath(page(0).path, 'refresh');
    expect(store.prepareRoute(route(0), true)).toBe(true);
    expect(await store.resolveRoute(route(0))).toBe(true);
    expect(store.pages.size).toBe(15);
  });

  it('blocks over-capacity resolution before loading UMD and keeps the old-renderer reservation', async () => {
    const store = fill();
    const register = vi.fn().mockResolvedValue(true);
    store.setUmdRegistrationBridge(register);
    expect(await store.resolveRoute({ ...route(15), handler: '<NewWidget />', scriptPath: '/widget.js' })).toBe(false);
    expect(register).not.toHaveBeenCalled();
    expect(store.isReservedPath(page(15).path)).toBe(true);
    expect(store.pages.size).toBe(15);
  });

  it('checks capacity again when an async UMD load finishes', async () => {
    const store = fill(14);
    let release!: (value: boolean) => void;
    let started!: () => void;
    const entered = new Promise<void>(resolve => { started = resolve; });
    store.setUmdRegistrationBridge(() => new Promise<boolean>(resolve => { release = resolve; started(); }));
    const pendingRoute = { ...route(14), handler: '<PendingWidget />', scriptPath: '/pending.js' };
    store.prepareRoute(pendingRoute, true);
    const pending = store.resolveRoute(pendingRoute);
    await entered;
    store.hostResolvedPage(page(15), page(15).url);
    release(true);
    expect(await pending).toBe(false);
    expect(store.pages.size).toBe(15);
    expect(store.capacityWarning).toBe(true);
    expect(store.isReservedPath(page(14).path)).toBe(true);
  });

  it('does not strand a loading reservation when another tab closes', async () => {
    const store = fill(14);
    let release!: (value: boolean) => void;
    let started!: () => void;
    const entered = new Promise<void>(resolve => { started = resolve; });
    store.setUmdRegistrationBridge(() => new Promise<boolean>(resolve => { release = resolve; started(); }));
    const pendingRoute = { ...route(14), handler: '<PendingWidget />', scriptPath: '/pending.js' };
    store.prepareRoute(pendingRoute, true);
    const pending = store.resolveRoute(pendingRoute);
    await entered;
    store.removeByPath(page(0).path);
    release(true);
    expect(await pending).toBe(true);
    expect(store.pages.size).toBe(14);
    expect(store.resolvingInstanceKey).toBeNull();
    expect(store.canHostRoute(route(15))).toBe(true);
  });

  it('clears all resident slots and notices on session teardown', () => {
    const store = fill();
    store.showCapacityWarning();
    store.clear('logout');
    expect(store.pages.size).toBe(0);
    expect(store.capacityWarning).toBe(false);
    expect(store.canHostRoute(route(15))).toBe(true);
  });
});
