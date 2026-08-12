import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const { destroyHostedPageLifecycle } = vi.hoisted(() => ({
  destroyHostedPageLifecycle: vi.fn(),
}));

vi.mock('@/runtime/page-host/lifecycle', () => ({
  destroyHostedPageLifecycle,
  setHostedPageLifecycleActive: vi.fn(),
}));

import { usePageHostPilotStore } from '@/runtime/page-host/pilot-store';
import type { PageDescriptor } from '@/runtime/page-host/types';

const page: PageDescriptor = {
  tabKey: 'form',
  path: '/root/form',
  type: 'vue',
  url: '/remote/form.vue',
  kvid: 'form-kvid',
};

describe('PageHost pilot destroy reasons', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    destroyHostedPageLifecycle.mockClear();
  });

  it('uses close when a tab is removed normally', () => {
    const store = usePageHostPilotStore();
    const instanceKey = store.hostResolvedPage(page, page.url);

    store.removeByPath(page.path);

    expect(destroyHostedPageLifecycle).toHaveBeenCalledWith(instanceKey, 'close');
  });

  it('forwards refresh when the current tab is rebuilt', () => {
    const store = usePageHostPilotStore();
    const instanceKey = store.hostResolvedPage(page, page.url);

    store.removeByPath(page.path, 'refresh');

    expect(destroyHostedPageLifecycle).toHaveBeenCalledWith(instanceKey, 'refresh');
  });

  it('destroys every hosted page with logout during session teardown', () => {
    const store = usePageHostPilotStore();
    const firstKey = store.hostResolvedPage(page, page.url);
    const secondKey = store.hostResolvedPage(
      { ...page, tabKey: 'second', path: '/root/second' },
      page.url
    );

    store.clear('logout');

    expect(destroyHostedPageLifecycle).toHaveBeenCalledWith(firstKey, 'logout');
    expect(destroyHostedPageLifecycle).toHaveBeenCalledWith(secondKey, 'logout');
    expect(destroyHostedPageLifecycle).toHaveBeenCalledTimes(2);
  });
});
