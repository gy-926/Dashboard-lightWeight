import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('dynamic route cache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
    vi.stubGlobal('window', {
      location: { pathname: '/', origin: 'https://example.com' },
      uiGlobalConfig: {},
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function seeded() {
    const config = await import('../src/router/routes/config');
    const cache = await import('../src/router/routes/cache');
    config.setGlobalConfig({ UserCode: 'alice', InternalCode: 'workspace' });
    cache.cacheDynamicRoutes([
      {
        path: '/root',
        name: 'root',
        component: 'layout.base',
        children: [
          {
            path: '/root/page',
            name: 'page',
            component: 'view.iframe-page',
            props: { kvid: 'page-id', handler: '/page.vue', handlerResolved: true },
            meta: { kvid: 'page-id' },
          },
        ],
      },
    ]);
    return { ...config, ...cache };
  }
  it('restores page identity and resolved handler metadata', async () => {
    const cache = await seeded();
    expect(cache.restoreDynamicRoutesFromCache()?.[0].children?.[0]).toMatchObject({
      meta: { kvid: 'page-id' },
      props: { kvid: 'page-id', handler: '/page.vue', handlerResolved: true },
    });
  });
  it('rejects other users, workspaces and expired routes', async () => {
    const cache = await seeded();
    cache.setGlobalConfig({ UserCode: 'bob' });
    expect(cache.restoreDynamicRoutesFromCache()).toBeNull();
    cache.setGlobalConfig({ UserCode: 'alice', InternalCode: 'other' });
    expect(cache.restoreDynamicRoutesFromCache()).toBeNull();
    cache.setGlobalConfig({ InternalCode: 'workspace' });
    vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);
    expect(cache.restoreDynamicRoutesFromCache()).toBeNull();
  });
  it('rejects cache entries written using an obsolete schema', async () => {
    const cache = await seeded();
    const data = JSON.parse(localStorage.getItem('DYNAMIC_ROUTES_CACHE')!);
    localStorage.setItem('DYNAMIC_ROUTES_CACHE', JSON.stringify({ ...data, version: 'old' }));
    expect(cache.restoreDynamicRoutesFromCache()).toBeNull();
  });
});
