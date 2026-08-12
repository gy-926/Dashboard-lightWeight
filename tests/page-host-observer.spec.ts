import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { usePageHostObserver } from '@/runtime/page-host/observer';
import type { PageDescriptor } from '@/runtime/page-host/types';

const firstPage: PageDescriptor = {
  tabKey: 'first-page',
  path: '/root/first',
  type: 'webview',
  url: '/legacy/first',
  kvid: 'first-kvid',
};

const secondPage: PageDescriptor = {
  tabKey: 'second-page',
  path: '/root/second',
  type: 'vue',
  url: '/remote/second.vue',
  kvid: 'second-kvid',
};

describe('PageHost observer registry', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('observes records without storing component instances', () => {
    const observer = usePageHostObserver();
    const observed = observer.observe(firstPage, 'active', 100);
    const record = observer.records.get(observed.instanceKey);

    expect(record).toMatchObject({
      descriptor: firstPage,
      status: 'active',
      createdAt: 100,
      activatedAt: 100,
    });
    expect(record).not.toHaveProperty('instance');
    expect(record).not.toHaveProperty('adapter');
  });

  it('marks the previous page inactive when another page becomes active', () => {
    const observer = usePageHostObserver();
    const first = observer.observe(firstPage, 'active', 100);
    const second = observer.observe(secondPage, 'active', 200);

    expect(observer.records.get(first.instanceKey)?.status).toBe('inactive');
    expect(observer.records.get(second.instanceKey)?.status).toBe('active');
    expect(observer.activeInstanceKey).toBe(second.instanceKey);
  });

  it('removes every observed parameter instance for a closed tab path', () => {
    const observer = usePageHostObserver();
    observer.observe({ ...firstPage, query: { order: '1' } });
    observer.observe({ ...firstPage, query: { order: '2' } });
    const second = observer.observe(secondPage);

    observer.removeByPath(firstPage.path);

    expect(observer.records.size).toBe(1);
    expect(observer.records.has(second.instanceKey)).toBe(true);
  });

  it('does not let an old unmount remove a newly observed record', () => {
    const observer = usePageHostObserver();
    const oldObservation = observer.observe(firstPage);

    observer.remove(oldObservation.instanceKey, oldObservation.observationId);
    const newObservation = observer.observe(firstPage);
    observer.remove(oldObservation.instanceKey, oldObservation.observationId);

    expect(observer.records.has(newObservation.instanceKey)).toBe(true);
    expect(observer.records.get(newObservation.instanceKey)?.observationId).toBe(
      newObservation.observationId
    );
  });

  it('clears the diagnostic registry without lifecycle side effects', () => {
    const observer = usePageHostObserver();
    observer.observe(firstPage);
    observer.observe(secondPage);

    observer.clear();

    expect(observer.records.size).toBe(0);
    expect(observer.activeInstanceKey).toBeNull();
  });
});
