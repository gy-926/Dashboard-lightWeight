import type { RemoteLibraryInfo } from '@/utils/umd/types';

export function summarizeRuntime(libraries: RemoteLibraryInfo[]) {
  const successful = libraries.filter(item => item.status === 'success');
  const hasError = libraries.some(item => item.status === 'error');
  const loading = libraries.some(item => item.status === 'loading' || item.status === 'pending');
  const registeredComponentCount = successful.reduce(
    (total, item) =>
      total +
      (item.registeredCount ??
        item.componentsDetailed?.length ??
        item.componentKeys?.filter(
          key =>
            ![
              'default',
              'install',
              'manifest',
              'componentsMap',
              'componentsDetailed',
              'version',
              '__esModule',
            ].includes(key)
        ).length ??
        0),
    0
  );
  return {
    successful,
    registeredComponentCount,
    hasError,
    statusLabel: loading ? '加载中' : hasError ? '加载失败' : libraries.length ? '就绪' : '未加载',
    progressPercent: libraries.length ? (successful.length / libraries.length) * 100 : 0,
  };
}
