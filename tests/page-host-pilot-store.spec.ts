import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePageHostPilotStore } from '@/runtime/page-host/pilot-store';
import type { PageDescriptor } from '@/runtime/page-host/types';

const firstPage: PageDescriptor = {
  tabKey: 'first',
  path: '/root/first',
  type: 'webview',
  url: 'https://example.test/first',
  kvid: 'first-kvid',
};

const secondPage: PageDescriptor = {
  tabKey: 'second',
  path: '/root/second',
  type: 'vue',
  url: 'https://example.test/second.vue',
  kvid: 'second-kvid',
};

const umdPage: PageDescriptor = {
  tabKey: 'form',
  path: '/root/form',
  type: 'umd',
  url: 'SmartForm',
  kvid: 'form-kvid',
  query: { recordId: '42' },
};

describe('PageHost iframe pilot store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('keeps inactive iframe records instead of removing them on tab switch', () => {
    const store = usePageHostPilotStore();
    const firstKey = store.hostResolvedPage(firstPage, firstPage.url, 100);
    const secondKey = store.hostResolvedPage(secondPage, secondPage.url, 200);

    expect(store.pages.get(firstKey)?.active).toBe(false);
    expect(store.pages.get(secondKey)?.active).toBe(true);
    expect(store.pages.size).toBe(2);
  });

  it('reserves an eligible route before async resolution to suppress the old renderer', () => {
    const store = usePageHostPilotStore();

    store.prepareRoute({ path: '/root/first', name: 'first', kvid: 'first-kvid' }, true);

    expect(store.resolvingPath).toBe('/root/first');
    expect(store.isReservedPath('/root/first')).toBe(true);
    expect(store.isReservedPath('/root/second')).toBe(false);
  });

  it('does not reserve a route that is outside the exact pilot configuration', () => {
    const store = usePageHostPilotStore();
    store.prepareRoute({ path: '/root/first', name: 'first', kvid: 'first-kvid' }, true);

    store.prepareRoute({ path: '/root/second', name: 'second', kvid: 'second-kvid' }, false);

    expect(store.resolvingPath).toBeNull();
    expect(store.isReservedPath('/root/second')).toBe(false);
  });

  it('isolates hosted instances for the same path with different query values', () => {
    const store = usePageHostPilotStore();
    const queryOne = { ...firstPage, query: { recordId: '1' } };
    const queryTwo = { ...firstPage, query: { recordId: '2' } };
    const firstKey = store.hostResolvedPage(queryOne, queryOne.url, 100);

    store.prepareRoute({
      path: queryTwo.path,
      name: queryTwo.tabKey,
      kvid: queryTwo.kvid,
      query: queryTwo.query,
    }, true);

    expect(store.pages.get(firstKey)?.active).toBe(false);
    expect(store.resolvingInstanceKey).not.toBe(firstKey);

    const secondKey = store.hostResolvedPage(queryTwo, queryTwo.url, 200);
    expect(secondKey).not.toBe(firstKey);
    expect(store.pages.size).toBe(2);
    expect(store.pages.get(secondKey)?.active).toBe(true);
  });

  it('invalidates a loading reservation on close and creates a fresh reservation on reopen', () => {
    const store = usePageHostPilotStore();
    const route = { path: '/root/first', name: 'first', kvid: 'first-kvid' };
    store.prepareRoute(route, true);
    const firstReservation = store.resolvingInstanceKey;

    store.removeByPath(route.path);

    expect(store.resolvingPath).toBeNull();
    expect(store.resolvingInstanceKey).toBeNull();

    store.prepareRoute(route, true);
    expect(store.resolvingInstanceKey).toBe(firstReservation);
    expect(store.isReservedPath(route.path)).toBe(true);
  });

  it('removes every query-specific instance when their shared tab path closes', () => {
    const store = usePageHostPilotStore();
    store.hostResolvedPage({ ...firstPage, query: { recordId: '1' } }, firstPage.url);
    store.hostResolvedPage({ ...firstPage, query: { recordId: '2' } }, firstPage.url);

    store.removeByPath(firstPage.path);

    expect(store.pages.size).toBe(0);
  });

  it('reactivates the original record without changing its creation time', () => {
    const store = usePageHostPilotStore();
    const firstKey = store.hostResolvedPage(firstPage, firstPage.url, 100);
    store.hostResolvedPage(secondPage, secondPage.url, 200);

    const reopenedKey = store.hostResolvedPage(firstPage, firstPage.url, 300);

    expect(reopenedKey).toBe(firstKey);
    expect(store.pages.get(firstKey)).toMatchObject({
      active: true,
      createdAt: 100,
      activatedAt: 300,
    });
  });

  it('preserves the remote Vue page type in the hosted record', () => {
    const store = usePageHostPilotStore();
    const key = store.hostResolvedPage(secondPage, secondPage.url);

    expect(store.pages.get(key)?.descriptor.type).toBe('vue');
    expect(store.pages.get(key)?.src).toBe(secondPage.url);
  });

  it('preserves UMD instance metadata separately from the application library', () => {
    const store = usePageHostPilotStore();
    const key = store.hostResolvedPage(umdPage, umdPage.url, 100, {
      componentTag: '<SmartForm :readonly="false">',
      scriptPath: '/Umd/File/smart-form.umd.js',
    });

    expect(store.pages.get(key)).toMatchObject({
      src: 'SmartForm',
      componentTag: '<SmartForm :readonly="false">',
      scriptPath: '/Umd/File/smart-form.umd.js',
      descriptor: {
        type: 'umd',
        query: { recordId: '42' },
      },
    });
  });

  it('uses an application bridge to ensure a UMD component is registered', async () => {
    const store = usePageHostPilotStore();
    const calls: Array<[string, string | undefined]> = [];
    store.setUmdRegistrationBridge(async (componentName, scriptPath) => {
      calls.push([componentName, scriptPath]);
      return componentName === 'SmartForm';
    });

    await expect(
      store.ensureUmdRegistered('SmartForm', '/Umd/File/smart-form.umd.js')
    ).resolves.toBe(true);
    expect(calls).toEqual([['SmartForm', '/Umd/File/smart-form.umd.js']]);
  });

  it('removes only the hosted UMD instance and does not invoke the library bridge', () => {
    const store = usePageHostPilotStore();
    let bridgeCalls = 0;
    store.setUmdRegistrationBridge(async () => {
      bridgeCalls++;
      return true;
    });
    store.hostResolvedPage(umdPage, umdPage.url);

    store.removeByPath(umdPage.path);

    expect(store.pages.size).toBe(0);
    expect(bridgeCalls).toBe(0);
  });

  it('removes a hosted page only when its tab path is closed', () => {
    const store = usePageHostPilotStore();
    store.hostResolvedPage(firstPage, firstPage.url);
    store.hostResolvedPage(secondPage, secondPage.url);

    store.removeByPath(firstPage.path);

    expect(store.pages.size).toBe(1);
    expect(store.allPages[0].descriptor.path).toBe(secondPage.path);
  });

  it('clears all hosted page records for session teardown', () => {
    const store = usePageHostPilotStore();
    store.hostResolvedPage(firstPage, firstPage.url);
    store.hostResolvedPage(secondPage, secondPage.url);

    store.clear();

    expect(store.pages.size).toBe(0);
    expect(store.activeInstanceKey).toBeNull();
    expect(store.claimedPath).toBeNull();
  });

  it('tracks viewport bounds separately from hosted page instances', () => {
    const store = usePageHostPilotStore();
    store.hostResolvedPage(firstPage, firstPage.url);
    store.setBounds({ top: 40, left: 220, width: 800, height: 600 });

    expect(store.bounds).toEqual({ top: 40, left: 220, width: 800, height: 600 });
    expect(store.pages.size).toBe(1);

    store.clearBounds();

    expect(store.bounds).toEqual({ top: 0, left: 0, width: 0, height: 0 });
    expect(store.pages.size).toBe(1);
  });
});
