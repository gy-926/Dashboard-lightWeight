<script setup lang="ts">
  import { ref } from 'vue';
  import {
    importDashboardFunctions,
    type DashboardFunctionRecord,
  } from '@/api/dashboard-functions';
  import { remoteLibraries } from '@/utils/remoteComponentLoader';

  // 定义分析结果的数据结构，与原页面类似
  export interface AnalyzedLibrary {
    name: string;
    url: string;
    status: 'pending' | 'loading' | 'success' | 'error';
    error?: string;
    manifest?: any;
    componentsMap?: Record<string, any>;
    componentsDetailed?: any[];
    componentKeys?: string[];
    registeredCount?: number;
    rawFile?: File; // 用于保存原始文件以便上传
    isUploading?: boolean; // 上传状态
  }

  const analyzedLibraries = ref<AnalyzedLibrary[]>([]);
  const isModalOpen = ref(false);
  const remoteUrl = ref('');
  const fileInput = ref<HTMLInputElement | null>(null);
  const isProcessing = ref(false);

  function generateId(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

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
  const analyzeUmdScript = (url: string, name: string) => {
    return new Promise<AnalyzedLibrary>((resolve, reject) => {
      // 记录加载前的全局变量
      const keysBefore = new Set(Object.keys(window));

      const script = document.createElement('script');
      script.src = url;
      script.onload = () => {
        // 找出新增的全局变量
        const keysAfter = Object.keys(window);
        const newKeys = keysAfter.filter(k => !keysBefore.has(k) && k !== 'Vue' && k !== '__VUE__');

        let globalName = newKeys.length > 0 ? newKeys[0] : 'VueComponent';
        let component = (window as any)[globalName];

        if (!component) {
          // 尝试兜底策略
          const possibleNames = ['VueComponent', name, name.replace(/[^a-zA-Z0-9]/g, '')];
          for (const pName of possibleNames) {
            if ((window as any)[pName]) {
              component = (window as any)[pName];
              globalName = pName;
              break;
            }
          }
        }

        if (component) {
          const lib: AnalyzedLibrary = {
            name: globalName || name,
            url: url.startsWith('blob:') ? '本地文件' : url,
            status: 'success',
            componentKeys: Object.keys(component),
          };

          if (component.manifest) {
            lib.manifest = component.manifest;
            if (!component.componentsDetailed && component.manifest.componentsDetailed) {
              lib.componentsDetailed = component.manifest.componentsDetailed;
            }
          }
          if (component.componentsDetailed) {
            lib.componentsDetailed = component.componentsDetailed;
          }

          resolve(lib);
        } else {
          reject(new Error(`无法在全局对象中找到导出的模块，可能不是标准的 UMD 格式。`));
        }
      };
      script.onerror = () => {
        reject(new Error(`脚本加载失败: ${url}`));
      };
      document.head.appendChild(script);
    });
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

    isProcessing.value = true;
    const card = addAnalyzingCard(name, url);

    try {
      const result = await analyzeUmdScript(url, name);
      updateAnalyzingCard(card, result);
      initSelectedComponents(analyzedLibraries.value[0]);
    } catch (error: any) {
      updateAnalyzingCard(card, {
        status: 'error',
        error: error.message || '分析失败',
      });
    } finally {
      isProcessing.value = false;
    }
  };

  const handleFileUpload = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    const name = file.name.replace(/(\.umd)?(\.min)?\.jsw?$/i, '');

    // 创建本地 URL
    const url = URL.createObjectURL(file);

    isProcessing.value = true;
    const card = addAnalyzingCard(name, '本地文件: ' + file.name, file);

    try {
      const result = await analyzeUmdScript(url, name);
      // 更新本地文件标识
      result.url = '本地文件: ' + file.name;
      updateAnalyzingCard(card, result);
      initSelectedComponents(analyzedLibraries.value[0]);
    } catch (error: any) {
      updateAnalyzingCard(card, {
        status: 'error',
        error: error.message || '分析失败',
      });
    } finally {
      isProcessing.value = false;
      // 重置 input
      if (fileInput.value) fileInput.value.value = '';
    }
  };

  const uploadAnalyzedFile = async (lib: AnalyzedLibrary) => {
    const selected = selectedComponents.value;
    if (selected.size === 0) {
      alert('请至少勾选一个组件');
      return;
    }

    // 本地文件当前仅支持分析；若要按需加载，后续需补充可访问的 source_url
    const sourceUrl = lib.rawFile ? null : lib.url;
    const sourceModule = lib.manifest?.name || lib.name;

    // 构造候选功能记录
    const candidates: DashboardFunctionRecord[] = (lib.componentsDetailed ?? [])
      .filter((comp: any) => selected.has(comp.name as string))
      .map((comp: any, idx: number) => ({
        kvid: generateId(),
        title: (comp.zhName || comp.displayName || comp.name) as string,
        handler: `<${comp.name as string}>`,
        render_type: 'umd',
        source_type: 'umd',
        source_module: sourceModule,
        source_url: sourceUrl,
        source_component: comp.name as string,
        icon: (comp.icon as string | undefined) || null,
        sort_order: idx,
        is_active: true,
        remark: sourceUrl,
        parameters: {},
      }));

    updateAnalyzingCard(lib, { isUploading: true });

    let result: { inserted: number; skipped: number };
    try {
      result = await importDashboardFunctions(candidates);
    } catch (error: any) {
      updateAnalyzingCard(lib, { isUploading: false });
      alert('导入失败：' + (error?.message ?? '未知错误'));
      return;
    }
    updateAnalyzingCard(lib, { isUploading: false });

    if (result.inserted === 0) {
      alert(`所选的 ${candidates.length} 个组件均已存在，无需重复导入。`);
      return;
    }

    const suffix = sourceUrl
      ? ''
      : ' 当前为本地分析导入，请在功能列表中补充可访问的来源地址后再用于运行时按需加载。';
    const msg =
      result.skipped > 0
        ? `成功注册 ${result.inserted} 个功能，跳过 ${result.skipped} 个已存在的组件。${suffix}`
        : `已成功将 ${result.inserted} 个组件注册到功能列表！${suffix}`;
    alert(msg);
  };
</script>

<template>
  <div class="space-y-6 relative">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">UMD模块管理</h1>
      <div class="flex items-center gap-3">
        <!-- Module Management Button -->
        <button
          @click="openModal"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <i class="fas fa-cloud-upload-alt"></i>
          文件上传
        </button>

        <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          已加载 {{ remoteLibraries.length }} 个组件库
        </span>
      </div>
    </div>

    <!-- Modal (Dialog) Overlay using pure Tailwind CSS and Teleport -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl overflow-hidden animate-fade-in-up m-4 flex flex-col max-h-[90vh]"
        >
          <!-- Modal Header -->
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i class="fas fa-cloud-upload-alt text-blue-600"></i> 文件上传
            </h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <!-- Modal Body (Scrollable) -->
          <div
            class="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar"
          >
            <div class="flex items-center gap-3">
              <!-- Remote URL Input Section -->
              <div class="flex-1">
                <div class="flex gap-2">
                  <input
                    v-model="remoteUrl"
                    type="text"
                    placeholder="请输入远程 UMD 文件的 URL，例如: https://example.com/component.umd.js"
                    class="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    @keyup.enter="handleReadRemoteUrl"
                  />
                  <button
                    @click="handleReadRemoteUrl"
                    :disabled="isProcessing || !remoteUrl"
                    class="px-5 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    读取远程文件
                  </button>
                </div>
              </div>

              <div class="text-gray-400 text-sm px-2 shrink-0">或</div>

              <!-- Local File Upload Section -->
              <div class="shrink-0">
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden"
                  accept=".js,.jsw"
                  @change="handleFileUpload"
                />
                <button
                  @click="triggerFileInput"
                  :disabled="isProcessing"
                  class="flex justify-center items-center gap-2 px-5 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium rounded-lg transition-all whitespace-nowrap"
                >
                  <i class="fas fa-cloud-upload-alt text-base"></i>
                  选择本地文件
                </button>
              </div>
            </div>

            <!-- Analyzed Cards List (Inside Modal, Scrollable) -->
            <div class="px-6 pb-6 mt-2 flex-1 overflow-y-auto custom-scrollbar">
              <!-- Empty State -->
              <div
                v-if="analyzedLibraries.length === 0"
                class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border border-dashed border-gray-200 dark:border-gray-700 text-center text-gray-500"
              >
                <i class="fas fa-microscope text-3xl mb-3 text-gray-300"></i>
                <p class="text-sm">暂无分析记录，请在上方输入URL或上传文件</p>
              </div>

              <div class="space-y-4">
                <div
                  v-for="lib in analyzedLibraries"
                  :key="lib.name + lib.url"
                  class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <!-- Header & Manifest (Merged into one line) -->
                  <div
                    class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-5 border-b border-gray-100 dark:border-gray-700 pb-4"
                  >
                    <!-- Left: Title & Status -->
                    <div class="flex items-center gap-4">
                      <div
                        class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
                      >
                        <i class="fas fa-cube text-blue-600 dark:text-blue-400 text-lg"></i>
                      </div>
                      <div>
                        <div class="flex items-center gap-3 mb-1">
                          <h2 class="text-lg font-bold text-gray-800 dark:text-white leading-none">
                            {{ lib.name }}
                          </h2>
                          <div class="flex items-center gap-2">
                            <span
                              class="px-2 py-0.5 rounded text-[10px] font-medium border"
                              :class="{
                                'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800':
                                  lib.status === 'success',
                                'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800':
                                  lib.status === 'loading',
                                'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800':
                                  lib.status === 'error',
                                'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700':
                                  lib.status === 'pending',
                              }"
                            >
                              <i class="fas fa-circle text-[6px] mr-1 opacity-60"></i>
                              {{
                                lib.status === 'loading' ? 'ANALYZING' : lib.status.toUpperCase()
                              }}
                            </span>
                            <span
                              v-if="lib.componentsDetailed?.length || lib.componentKeys?.length"
                              class="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                            >
                              <i class="fas fa-check-circle mr-1 opacity-60"></i>包含
                              {{ lib.componentsDetailed?.length || lib.componentKeys?.length }}
                              个组件
                            </span>
                          </div>
                        </div>
                        <p class="text-[11px] text-gray-400 font-mono">
                          {{ lib.rawFile ? `本地文件: ${lib.rawFile.name}` : lib.url }}
                        </p>
                      </div>
                    </div>

                    <!-- Right: Manifest Info -->
                    <div
                      class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] bg-gray-50 dark:bg-gray-700/30 px-4 py-2.5 rounded-lg border border-gray-100 dark:border-gray-700 flex-1 min-w-0 max-w-2xl overflow-hidden"
                    >
                      <div class="flex items-center whitespace-nowrap">
                        <span class="text-gray-500 dark:text-gray-400 mr-1.5">版本:</span>
                        <span class="font-bold text-gray-800 dark:text-gray-200">{{
                          lib.manifest?.version || '-'
                        }}</span>
                      </div>
                      <div class="hidden sm:block w-px h-3.5 bg-gray-300 dark:bg-gray-600"></div>
                      <div class="flex items-center whitespace-nowrap">
                        <span class="text-gray-500 dark:text-gray-400 mr-1.5">作者:</span>
                        <span class="font-bold text-gray-800 dark:text-gray-200">{{
                          lib.manifest?.author || '-'
                        }}</span>
                      </div>
                      <div class="hidden sm:block w-px h-3.5 bg-gray-300 dark:bg-gray-600"></div>
                      <div class="flex items-center min-w-0 flex-[2]">
                        <span class="text-gray-500 dark:text-gray-400 mr-1.5 shrink-0">描述:</span>
                        <span
                          class="font-medium text-gray-800 dark:text-gray-200 truncate min-w-0"
                          :title="lib.manifest?.description"
                          >{{ lib.manifest?.description || '-' }}</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Components List -->
                  <div v-if="lib.componentsDetailed && lib.componentsDetailed.length > 0">
                    <div class="flex items-center justify-between mb-3">
                      <h3
                        class="font-bold text-gray-800 dark:text-white flex items-center gap-1.5 text-[13px] uppercase"
                      >
                        <i class="fas fa-layer-group text-gray-400"></i> 组件列表
                      </h3>
                      <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span
                          >已选 {{ selectedComponents.size }} /
                          {{ lib.componentsDetailed.length }}</span
                        >
                        <button
                          class="text-blue-600 dark:text-blue-400 hover:underline"
                          @click="
                            lib.componentsDetailed.forEach((c: any) =>
                              selectedComponents.add(c.name)
                            );
                            selectedComponents = new Set(selectedComponents);
                          "
                        >
                          全选
                        </button>
                        <span>|</span>
                        <button
                          class="text-gray-500 dark:text-gray-400 hover:underline"
                          @click="selectedComponents = new Set()"
                        >
                          全不选
                        </button>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      <div
                        v-for="comp in lib.componentsDetailed"
                        :key="comp.name"
                        class="group relative border rounded-lg p-2.5 transition-all flex flex-col cursor-pointer select-none"
                        :class="
                          selectedComponents.has(comp.name)
                            ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 opacity-60'
                        "
                        @click="toggleComponent(comp.name)"
                      >
                        <div class="flex items-center gap-2 mb-1.5">
                          <input
                            type="checkbox"
                            class="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer flex-shrink-0"
                            :checked="selectedComponents.has(comp.name)"
                            @click.stop
                            @change="toggleComponent(comp.name)"
                          />
                          <i
                            :class="comp.icon || 'fas fa-chart-pie'"
                            class="text-gray-400 text-[13px]"
                          ></i>
                          <div class="font-bold text-gray-800 dark:text-gray-100 text-xs truncate">
                            {{ comp.zhName || comp.displayName || comp.name }}
                          </div>
                        </div>
                        <div
                          class="text-[12px] text-blue-500 dark:text-blue-400 mb-1.5 break-words font-mono tracking-wide"
                        >
                          {{ comp.name }}
                        </div>
                        <p
                          class="text-[12px] text-gray-500 dark:text-gray-400 leading-normal line-clamp-2 mt-auto"
                        >
                          {{ comp.description || '暂无描述' }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Fallback Component Keys -->
                  <div
                    v-else-if="lib.componentKeys && lib.componentKeys.length > 0"
                    class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <h3
                      class="font-bold text-gray-700 dark:text-gray-300 mb-2 text-[12px] uppercase"
                    >
                      导出对象 Keys
                    </h3>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="key in lib.componentKeys"
                        :key="key"
                        class="px-2 py-1 bg-white dark:bg-gray-600 rounded text-[10px] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 shadow-sm"
                      >
                        {{ key }}
                      </span>
                    </div>
                  </div>

                  <!-- Error Info -->
                  <div
                    v-if="lib.error"
                    class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-[12px] border border-red-100 dark:border-red-900/50 flex items-start gap-2"
                  >
                    <i class="fas fa-exclamation-triangle mt-0.5"></i>
                    <div>
                      <div class="font-bold mb-0.5">分析失败</div>
                      <div>{{ lib.error }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Fixed Action Footer -->
          <div
            v-if="analyzedLibraries.length > 0 && analyzedLibraries[0].status === 'success'"
            class="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end shrink-0"
          >
            <span class="text-sm text-gray-500 dark:text-gray-400 mr-2">
              已选 {{ selectedComponents.size }} 个组件
            </span>
            <button
              @click="uploadAnalyzedFile(analyzedLibraries[0])"
              :disabled="analyzedLibraries[0].isUploading || selectedComponents.size === 0"
              class="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <i
                class="fas fa-cloud-upload-alt"
                :class="{ 'animate-bounce': analyzedLibraries[0].isUploading }"
              ></i>
              {{ analyzedLibraries[0].isUploading ? '导入中...' : '导入到功能列表' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Empty State -->
    <div
      v-if="remoteLibraries.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-500"
    >
      <i class="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
      <p>暂无远程组件库信息</p>
    </div>

    <!-- Main Interface Server Libraries List -->
    <div
      v-for="lib in remoteLibraries"
      :key="lib.name"
      class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-6 transition-all duration-300 hover:shadow-md"
    >
      <!-- Library Header -->
      <div
        class="flex flex-col md:flex-row md:items-start justify-between border-b border-gray-100 dark:border-gray-700 pb-4 gap-4"
      >
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <div
              class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <i class="fas fa-cube text-blue-600 dark:text-blue-400 text-lg"></i>
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800 dark:text-white">{{ lib.name }}</h2>
              <p class="text-xs text-gray-400 font-mono mt-0.5 break-all">{{ lib.url }}</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <span
              class="px-2.5 py-0.5 rounded text-xs font-medium border"
              :class="{
                'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800':
                  lib.status === 'success',
                'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800':
                  lib.status === 'loading',
                'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800':
                  lib.status === 'error',
                'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700':
                  lib.status === 'pending',
              }"
            >
              <i class="fas fa-circle text-[8px] mr-1.5 opacity-60"></i
              >{{ lib.status.toUpperCase() }}
            </span>
            <span
              v-if="lib.registeredCount"
              class="px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
            >
              <i class="fas fa-check-circle mr-1.5 opacity-60"></i>已注册
              {{ lib.registeredCount }} 个组件
            </span>
          </div>
        </div>
      </div>

      <!-- Manifest Info -->
      <div
        v-if="lib.manifest"
        class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"
      >
        <div
          class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">版本</span>
          <span class="font-medium text-gray-800 dark:text-gray-200">{{
            lib.manifest.version || '-'
          }}</span>
        </div>
        <div
          class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">作者</span>
          <span class="font-medium text-gray-800 dark:text-gray-200">{{
            lib.manifest.author || '-'
          }}</span>
        </div>
        <div
          class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700 col-span-2"
        >
          <span class="text-xs text-gray-500 dark:text-gray-400 block mb-1">描述</span>
          <span class="font-medium text-gray-800 dark:text-gray-200">{{
            lib.manifest.description || '-'
          }}</span>
        </div>
      </div>

      <!-- Components List -->
      <div v-if="lib.componentsDetailed && lib.componentsDetailed.length > 0">
        <h3
          class="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider"
        >
          <i class="fas fa-layer-group text-gray-400"></i> 包含组件列表
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="comp in lib.componentsDetailed"
            :key="comp.name"
            class="group relative border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all bg-white dark:bg-gray-800"
          >
            <div
              class="absolute top-4 right-4 text-gray-300 group-hover:text-blue-500 transition-colors"
            >
              <i class="fas fa-code"></i>
            </div>
            <div class="font-bold text-gray-800 dark:text-white mb-1 pr-6">{{ comp.name }}</div>
            <div
              class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-0.5 rounded"
            >
              {{ comp.displayName || comp.name }}
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[2.5em]">
              {{ comp.description || '暂无描述' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Fallback Component Keys -->
      <div
        v-else-if="lib.componentKeys && lib.componentKeys.length > 0"
        class="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-xl border border-gray-100 dark:border-gray-700"
      >
        <h3
          class="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wider"
        >
          导出对象 Keys
        </h3>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="key in lib.componentKeys"
            :key="key"
            class="px-3 py-1.5 bg-white dark:bg-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-500 shadow-sm"
          >
            {{ key }}
          </span>
        </div>
      </div>

      <!-- Error Info -->
      <div
        v-if="lib.error"
        class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/50 flex items-start gap-3"
      >
        <i class="fas fa-exclamation-triangle mt-0.5"></i>
        <div>
          <div class="font-bold mb-1">加载失败</div>
          <div>{{ lib.error }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .animate-fade-in-up {
    animation: fadeInUp 0.3s ease-out forwards;
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* 自定义滚动条样式 */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
  }
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.5);
  }
</style>
