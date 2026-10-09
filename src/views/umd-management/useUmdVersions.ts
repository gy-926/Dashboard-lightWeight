import { getCurrentInstance, onMounted, ref } from 'vue';
import {
  activateUmdVersion,
  listUmdVersions,
  type UmdVersionRecord,
} from '@/api/dashboard-functions';
import { loadUmdOnDemand } from '@/utils/remoteComponentLoader';
import { clearDynamicRoutesCache } from '@/router/routes';

export function useUmdVersions() {
  const versions = ref<UmdVersionRecord[]>([]);
  const versionsLoading = ref(false);
  const switchingVersionId = ref<string | null>(null);
  const instance = getCurrentInstance();
  let loadGeneration = 0;
  async function loadVersions() {
    const generation = ++loadGeneration;
    versionsLoading.value = true;
    try {
      const result = await listUmdVersions();
      if (generation === loadGeneration) versions.value = result;
    } catch (error: any) {
      console.error('加载 UMD 版本失败:', error);
    } finally {
      if (generation === loadGeneration) versionsLoading.value = false;
    }
  }

  async function switchVersion(item: UmdVersionRecord) {
    if (item.is_current || !item.file_available || switchingVersionId.value) return;
    switchingVersionId.value = item.id;
    try {
      const result = await activateUmdVersion(item.id);
      clearDynamicRoutesCache();
      await loadVersions();
      try {
        if (instance?.appContext.app)
          await loadUmdOnDemand(instance.appContext.app, result.sourceUrl);
      } catch (error: any) {
        alert('版本已启用，但组件加载失败，请刷新页面重试：' + (error?.message ?? '未知错误'));
      }
    } catch (error: any) {
      alert('切换版本失败：' + (error?.message ?? '未知错误'));
    } finally {
      switchingVersionId.value = null;
    }
  }

  onMounted(loadVersions);
  return { versions, versionsLoading, switchingVersionId, loadVersions, switchVersion };
}
