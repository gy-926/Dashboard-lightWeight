import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  generateComponentCacheKey,
  useTeleportManager,
} from '@/store/modules/teleport-manager';

describe('TeleportManager remote Vue cache lifecycle', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('removes cached components by exact kvid without relying on route URL', () => {
    const store = useTeleportManager();
    const firstKey = generateComponentCacheKey('/remote/first.vue', 'first-kvid', 'https://api');
    const secondKey = generateComponentCacheKey('/remote/second.vue', 'second-kvid', 'https://api');
    const firstStyle = { remove: vi.fn() } as unknown as HTMLStyleElement;
    const secondStyle = { remove: vi.fn() } as unknown as HTMLStyleElement;

    store.setVueComponent(firstKey, { component: {}, styles: [firstStyle] });
    store.setVueComponent(secondKey, { component: {}, styles: [secondStyle] });

    store.removeComponentCacheByPath('/menu/path-does-not-contain-remote-url', 'first-kvid');

    expect(store.hasVueComponent(firstKey)).toBe(false);
    expect(store.hasVueComponent(secondKey)).toBe(true);
    expect(firstStyle.remove).toHaveBeenCalledOnce();
    expect(secondStyle.remove).not.toHaveBeenCalled();
  });

  it('invalidates an in-flight load so its old generation cannot write back', () => {
    const store = useTeleportManager();
    const key = generateComponentCacheKey('/remote/loading.vue', 'loading-kvid');
    const generation = store.getVueComponentGeneration(key);
    const loadingPromise = Promise.resolve({});

    store.setVueComponentLoading(key, loadingPromise);
    store.removeComponentCacheByPath('/unrelated', 'loading-kvid');

    expect(store.getVueComponentLoading(key)).toBeUndefined();
    expect(store.isVueComponentGenerationCurrent(key, generation)).toBe(false);
    expect(store.setVueComponent(key, { component: {} }, generation)).toBe(false);
    expect(store.hasVueComponent(key)).toBe(false);
  });

  it('does not let an old task delete a newer loading promise', () => {
    const store = useTeleportManager();
    const key = generateComponentCacheKey('/remote/reopened.vue', 'reopened-kvid');
    const oldPromise = Promise.resolve('old');
    const newPromise = Promise.resolve('new');

    store.setVueComponentLoading(key, newPromise);
    store.deleteVueComponentLoading(key, oldPromise);

    expect(store.getVueComponentLoading(key)).toBeDefined();

    store.deleteVueComponentLoading(key, newPromise);
    expect(store.getVueComponentLoading(key)).toBeUndefined();
  });

  it('clears user-scoped pages, cache, loading records and styles together', () => {
    const store = useTeleportManager();
    const key = generateComponentCacheKey('/remote/session.vue', 'session-kvid');
    const style = { remove: vi.fn() } as unknown as HTMLStyleElement;
    const loadingPromise = Promise.resolve({});

    store.registerPage('page-1', 'vue', '/remote/session.vue', 'session-kvid');
    store.setVueComponent(key, { component: {}, styles: [style] });
    store.setVueComponentLoading(key, loadingPromise);

    store.clearUserRuntime();

    expect(store.pages.size).toBe(0);
    expect(store.vueComponentCache.size).toBe(0);
    expect(store.vueComponentLoading.size).toBe(0);
    expect(style.remove).toHaveBeenCalledOnce();
  });
});
