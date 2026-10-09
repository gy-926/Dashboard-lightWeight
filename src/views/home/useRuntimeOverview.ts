import { computed } from 'vue';
import { remoteLibraries } from '@/utils/umd/state';
import { summarizeRuntime } from './runtime-summary';

export function useRuntimeOverview() {
  const summary = computed(() => summarizeRuntime(remoteLibraries.value));
  const successfulLibraries = computed(() => summary.value.successful);
  const registeredComponentCount = computed(() => summary.value.registeredComponentCount);
  const statusLabel = computed(() => summary.value.statusLabel);
  const progressPercent = computed(() => summary.value.progressPercent);
  const hasError = computed(() => summary.value.hasError);
  const runtimeMetrics = computed(() => [
    {
      value: String(remoteLibraries.value.length),
      label: '远程组件库',
      detail: `${successfulLibraries.value.length} 个加载成功`,
    },
    {
      value: String(registeredComponentCount.value),
      label: '已注册组件',
      detail: '来自实时运行状态',
    },
    { value: '3', label: '运行形态', detail: 'UMD · Vue SFC · WebView' },
    { value: '3', label: '布局模式', detail: '侧边 · 顶部 · 混合' },
  ]);
  return {
    remoteLibraries,
    successfulLibraries,
    registeredComponentCount,
    statusLabel,
    progressPercent,
    hasError,
    runtimeMetrics,
  };
}
