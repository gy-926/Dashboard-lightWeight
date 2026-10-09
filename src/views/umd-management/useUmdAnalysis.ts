import { onUnmounted, ref, type Ref } from 'vue';
import { importUmdPackage } from '@/api/dashboard-functions';
import { loadUMDComponent } from '@/utils/umd/loader';
import { clearDynamicRoutesCache } from '@/router/routes';
import type { AnalyzedLibrary } from './types';

export function useUmdAnalysis(isModalOpen: Ref<boolean>, onImported: () => Promise<void>) {
  let analysisGeneration = 0;
  onUnmounted(() => {
    analysisGeneration++;
  });
  const analyzedLibraries = ref<AnalyzedLibrary[]>([]);

  const remoteUrl = ref('');
  const fileInput = ref<HTMLInputElement | null>(null);
  const isProcessing = ref(false);

  // 已勾选的组件名称集合（默认全选）
  const selectedComponents = ref<Set<string>>(new Set());

  function initSelectedComponents(lib: AnalyzedLibrary) {
    const keys =
      lib.componentsDetailed?.map((c: any) => c.name as string) ?? lib.componentKeys ?? [];
    selectedComponents.value = new Set(keys);
  }

  function toggleComponent(compName: string) {
    const s = selectedComponents.value;
    if (s.has(compName)) {
      s.delete(compName);
    } else {
      s.add(compName);
    }
    // 触发响应式更新
    selectedComponents.value = new Set(s);
  }

  const openModal = () => {
    isModalOpen.value = true;
  };

  const closeModal = () => {
    analysisGeneration++;
    isProcessing.value = false;
    selectedComponents.value = new Set();
    isModalOpen.value = false;
    remoteUrl.value = '';
    analyzedLibraries.value = []; // 关闭弹窗时清空当前的分析结果
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInput.value?.click();
  };

  // 工具方法：动态加载并分析 UMD 文件
  const analyzeUmdScript = async (url: string, name: string): Promise<AnalyzedLibrary> => {
    const component = await loadUMDComponent(url);
    if (!component || typeof component !== 'object') {
      throw new Error('无法读取 UMD 导出对象，请确认文件符合 UMD 接入规范。');
    }
    const manifest = component.manifest ?? {};
    return {
      name: manifest.zhName || manifest.libName || manifest.name || name,
      url: url.startsWith('blob:') ? '本地文件' : url,
      status: 'success',
      manifest,
      componentsDetailed: component.componentsDetailed ?? manifest.componentsDetailed,
      componentsMap: component.componentsMap ?? manifest.componentsMap,
      componentKeys: Object.keys(component),
      versionOverride: String(manifest.version || ''),
    };
  };

  const addAnalyzingCard = (name: string, url: string, file?: File) => {
    const lib: AnalyzedLibrary = {
      name,
      url,
      status: 'loading',
      rawFile: file,
      isUploading: false,
    };
    // 每次分析清空历史，只保留当前最新的一条记录
    analyzedLibraries.value = [lib];
    // 返回插入到响应式数组中的代理对象，以确保后续的 Object.assign 能够触发视图更新
    return analyzedLibraries.value[0];
  };

  const updateAnalyzingCard = (lib: AnalyzedLibrary, updates: Partial<AnalyzedLibrary>) => {
    Object.assign(lib, updates);
  };

  const handleReadRemoteUrl = async () => {
    if (!remoteUrl.value.trim()) {
      alert('请输入有效的远程 URL');
      return;
    }

    const url = remoteUrl.value.trim();
    const name =
      url
        .split('/')
        .pop()
        ?.replace(/(\.umd)?(\.min)?\.jsw?$/i, '') || 'Unknown';

    const generation = ++analysisGeneration;
    isProcessing.value = true;
    const card = addAnalyzingCard(name, url);

    try {
      const result = await analyzeUmdScript(url, name);
      if (generation !== analysisGeneration) return;
      updateAnalyzingCard(card, result);
      initSelectedComponents(analyzedLibraries.value[0]);
    } catch (error: any) {
      if (generation !== analysisGeneration) return;
      updateAnalyzingCard(card, {
        status: 'error',
        error: error.message || '分析失败',
      });
    } finally {
      if (generation === analysisGeneration) isProcessing.value = false;
    }
  };

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const name = file.name.replace(/(\.umd)?(\.min)?\.jsw?$/i, '');

    // 创建本地 URL
    const url = URL.createObjectURL(file);

    const generation = ++analysisGeneration;
    isProcessing.value = true;
    const card = addAnalyzingCard(name, '本地文件: ' + file.name, file);

    try {
      const result = await analyzeUmdScript(url, name);
      if (generation !== analysisGeneration) return;
      // 更新本地文件标识
      result.url = '本地文件: ' + file.name;
      updateAnalyzingCard(card, result);
      initSelectedComponents(analyzedLibraries.value[0]);
    } catch (error: any) {
      if (generation !== analysisGeneration) return;
      updateAnalyzingCard(card, {
        status: 'error',
        error: error.message || '分析失败',
      });
    } finally {
      URL.revokeObjectURL(url);
      if (generation === analysisGeneration) isProcessing.value = false;
      // 重置 input
      if (fileInput.value) fileInput.value.value = '';
    }
  };

  const uploadAnalyzedFile = async (lib: AnalyzedLibrary) => {
    if (lib.isUploading) return;
    const generation = analysisGeneration;
    const selected = selectedComponents.value;
    if (selected.size === 0) {
      alert('请至少勾选一个组件');
      return;
    }

    const components = (lib.componentsDetailed ?? []).filter((comp: any) =>
      selected.has(comp.name as string)
    );
    const version = String(lib.versionOverride || lib.manifest?.version || '').trim();
    if (!version) {
      alert('请输入版本号');
      return;
    }
    const sourceModule = String(lib.manifest?.libName || lib.manifest?.name || lib.name)
      .trim()
      .replace(/[^A-Za-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    updateAnalyzingCard(lib, { isUploading: true });

    try {
      let file = lib.rawFile;
      if (!file) {
        const response = await fetch(lib.url);
        if (!response.ok) throw new Error(`下载远程文件失败（HTTP ${response.status}）`);
        file = new File([await response.blob()], `${sourceModule}-${version}.umd.js`, {
          type: 'text/javascript',
        });
      }
      const result = await importUmdPackage({
        file,
        manifest: { ...(lib.manifest ?? {}), version },
        components,
        moduleKey: sourceModule,
        name: String(lib.manifest?.zhName || lib.name),
        version,
      });
      clearDynamicRoutesCache();
      await onImported();
      if (generation !== analysisGeneration) return;
      alert(
        `已保存 ${file.name}，并将 ${result.imported} 个组件导入功能列表。当前版本：${result.version}`
      );
      closeModal();
    } catch (error: any) {
      if (generation !== analysisGeneration) return;
      updateAnalyzingCard(lib, { isUploading: false });
      alert('导入失败：' + (error?.message ?? '未知错误'));
      return;
    }
    updateAnalyzingCard(lib, { isUploading: false });
  };

  return {
    analyzedLibraries,
    remoteUrl,
    fileInput,
    isProcessing,
    selectedComponents,
    openModal,
    closeModal,
    triggerFileInput,
    analyzeUmdScript,
    addAnalyzingCard,
    updateAnalyzingCard,
    handleReadRemoteUrl,
    handleFileUpload,
    uploadAnalyzedFile,
    initSelectedComponents,
    toggleComponent,
    isModalOpen,
  };
}
