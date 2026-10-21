import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createOpenTabService } from '@/services/open-tab';
import type { MenuItem } from '@/layouts/modules/global-menu/types';

async function setup() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      ...['home', 'orders', 'settings', 'legacy', 'blocked', 'broken'].map(path => ({
        path: `/${path}`, component: {}, meta: { custom: 'preserved' },
      })),
      { path: '/alias', redirect: '/orders' },
    ],
  });
  router.onError(() => {});
  await router.push('/home');
  const store = {
    menuList: [{ key: 'group', path: '/group', title: '菜单', children: [
      { key: 'orders', path: '/orders', title: '订单', kvid: 'orders-kvid', meta: { url: '/remote/orders.vue' } },
      { key: 'settings', path: '/settings', title: '设置', meta: { kvid: 'settings-kvid' } },
      { key: 'legacy', path: '/legacy', title: '', Kvid: 'legacy-kvid', Title: '旧菜单', FunctionKvid: 'ExtJS.Form' } as MenuItem,
    ] }],
    tabsList: [] as MenuItem[],
    addTab: vi.fn((item: MenuItem) => {
      const index = store.tabsList.findIndex(tab => tab.path === item.path);
      if (index === -1) store.tabsList.push(item);
      else store.tabsList[index] = item;
    }),
  };
  vi.stubGlobal('window', { open: vi.fn(), location: { assign: vi.fn(), replace: vi.fn() } });
  return { router, store, service: createOpenTabService(router, store) };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('shared OpenTab service', () => {
  it('preserves query and fragment while reusing one path-based tab', async () => {
    const { router, store, service } = await setup();
    expect(await service.openPath('orders?id=123#details')).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe('/orders?id=123#details');
    expect(store.tabsList[0]).toMatchObject({
      path: '/orders', title: '订单', kvid: 'orders-kvid',
      meta: { type: 'vue', custom: 'preserved' },
    });
    expect(await service.openPath('/orders?id=456#summary')).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe('/orders?id=456#summary');
    expect(store.tabsList).toHaveLength(1);
  });

  it('waits for a navigation guard before reporting success and adding a tab', async () => {
    const { router, store, service } = await setup();
    let release!: (value: boolean) => void;
    let entered!: () => void;
    const guardEntered = new Promise<void>(resolve => { entered = resolve; });
    router.beforeEach(() => new Promise<boolean>(resolve => { release = resolve; entered(); }));
    let completed = false;
    const result = service.openPath('/orders').then(value => { completed = true; return value; });
    await guardEntered;
    expect(completed).toBe(false);
    expect(store.addTab).not.toHaveBeenCalled();
    release(true);
    expect(await result).toBe(true);
  });

  it('returns false for an aborted navigation without adding a tab', async () => {
    const { router, store, service } = await setup();
    router.beforeEach(() => false);
    expect(await service.openPath('/orders')).toBe(false);
    expect(router.currentRoute.value.path).toBe('/home');
    expect(store.addTab).not.toHaveBeenCalled();
  });

  it('returns false for a thrown navigation error', async () => {
    const { router, store, service } = await setup();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    router.beforeEach(() => { throw new Error('failed guard'); });
    expect(await service.openPath('/orders')).toBe(false);
    expect(store.addTab).not.toHaveBeenCalled();
  });

  it('treats duplicate navigation as success', async () => {
    const { store, service } = await setup();
    expect(await service.openPath('/orders')).toBe(true);
    expect(await service.openPath('/orders')).toBe(true);
    expect(store.tabsList).toHaveLength(1);
  });

  it('uses the final menu after a redirect', async () => {
    const { router, store, service } = await setup();
    expect(await service.openPath('/alias')).toBe(true);
    expect(router.currentRoute.value.path).toBe('/orders');
    expect(store.tabsList.map(tab => tab.path)).toEqual(['/orders']);
  });

  it.each(['orders-kvid', 'settings-kvid', 'legacy-kvid', 'orders'])(
    'finds nested menus by current, metadata or legacy identity: %s', async kvid => {
      const { router, store, service } = await setup();
      expect(await service.openByKvid(kvid)).toBe(true);
      expect(store.tabsList).toHaveLength(1);
      expect(router.currentRoute.value.path).toBe(store.tabsList[0].path);
    }
  );

  it('does not navigate for empty paths or unknown KVIDs', async () => {
    const { router, store, service } = await setup();
    expect(await service.openPath('   ')).toBe(false);
    expect(await service.openByKvid('missing-kvid')).toBe(false);
    expect(router.currentRoute.value.path).toBe('/home');
    expect(store.addTab).not.toHaveBeenCalled();
  });

  it('leaves the current page active when activateExisting is false', async () => {
    const { router, store, service } = await setup();
    store.tabsList.push({ key: 'orders', path: '/orders', title: '订单' });
    expect(await service.openPath('/orders?id=123', { activateExisting: false })).toBe(true);
    expect(router.currentRoute.value.path).toBe('/home');
    expect(store.addTab).not.toHaveBeenCalled();
  });

  it('uses router.replace when requested', async () => {
    const { router, service } = await setup();
    const replace = vi.spyOn(router, 'replace');
    expect(await service.openPath('/orders?id=123#details', { replace: true })).toBe(true);
    expect(replace).toHaveBeenCalledWith('/orders?id=123#details');
  });

  it('defaults external URLs to a new window and honors current-window options', async () => {
    const { service, store } = await setup();
    const url = 'https://example.test/orders?id=123#details';
    expect(await service.openTab(url)).toBe(true);
    expect(window.open).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
    expect(await service.openMenuItem({ key: 'external', path: url, title: '外链' }, { newTab: false })).toBe(true);
    expect(window.location.assign).toHaveBeenCalledWith(url);
    expect(await service.openTab(url, { newTab: false, replace: true })).toBe(true);
    expect(window.location.replace).toHaveBeenCalledWith(url);
    expect(store.addTab).not.toHaveBeenCalled();
  });
});
