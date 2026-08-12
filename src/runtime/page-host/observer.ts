import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { createPageInstanceKey } from './identity';
import type { HostedPageRecord, HostedPageStatus, PageDescriptor } from './types';

export interface ObservedHostedPageRecord extends HostedPageRecord {
  /** 区分同一稳定键先后出现的真实挂载，避免旧组件卸载时删除新记录。 */
  observationId: number;
}

/**
 * PageHost 阶段 1 的旁路注册表。
 *
 * 它只观察当前旧渲染链路，不保存组件实例，也不调用 mount/destroy。
 */
export const usePageHostObserver = defineStore('page-host-observer', () => {
  const records = ref<Map<string, ObservedHostedPageRecord>>(new Map());
  const activeInstanceKey = ref<string | null>(null);
  let nextObservationId = 1;

  const snapshot = computed(() =>
    Array.from(records.value.values()).map(record => ({
      ...record,
      descriptor: { ...record.descriptor },
    }))
  );

  function markOtherPagesInactive(instanceKey: string): void {
    records.value.forEach((record, key) => {
      if (key !== instanceKey && record.status === 'active') {
        record.status = 'inactive';
      }
    });
  }

  function observe(
    descriptor: PageDescriptor,
    status: Extract<HostedPageStatus, 'active' | 'inactive'> = 'active',
    now = Date.now()
  ): { instanceKey: string; observationId: number } {
    const instanceKey = createPageInstanceKey(descriptor);
    const existing = records.value.get(instanceKey);
    const observationId = nextObservationId++;

    if (status === 'active') {
      markOtherPagesInactive(instanceKey);
      activeInstanceKey.value = instanceKey;
    }

    records.value.set(instanceKey, {
      instanceKey,
      observationId,
      descriptor: { ...descriptor },
      status,
      createdAt: existing?.createdAt ?? now,
      activatedAt: status === 'active' ? now : existing?.activatedAt,
    });

    return { instanceKey, observationId };
  }

  function activate(instanceKey: string, now = Date.now()): void {
    const record = records.value.get(instanceKey);
    if (!record) return;

    markOtherPagesInactive(instanceKey);
    record.status = 'active';
    record.activatedAt = now;
    activeInstanceKey.value = instanceKey;
  }

  function deactivate(instanceKey: string): void {
    const record = records.value.get(instanceKey);
    if (!record) return;

    record.status = 'inactive';
    if (activeInstanceKey.value === instanceKey) {
      activeInstanceKey.value = null;
    }
  }

  function remove(instanceKey: string, observationId?: number): void {
    const record = records.value.get(instanceKey);
    if (!record) return;
    if (observationId !== undefined && record.observationId !== observationId) return;

    records.value.delete(instanceKey);
    if (activeInstanceKey.value === instanceKey) {
      activeInstanceKey.value = null;
    }
  }

  function removeByPath(path: string): void {
    const keys = Array.from(records.value.entries())
      .filter(([, record]) => record.descriptor.path === path)
      .map(([key]) => key);
    keys.forEach(key => remove(key));
  }

  function clear(): void {
    records.value.clear();
    activeInstanceKey.value = null;
  }

  return {
    records,
    snapshot,
    activeInstanceKey,
    observe,
    activate,
    deactivate,
    remove,
    removeByPath,
    clear,
  };
});
