<script setup lang="ts">
  import { useUmdAnalysis } from '../useUmdAnalysis';
  import { brandText } from '../display';
  const isModalOpen = defineModel<boolean>({ required: true });
  const props = defineProps<{ onImported: () => Promise<void> }>();
  const {
    analyzedLibraries,
    remoteUrl,
    fileInput,
    isProcessing,
    selectedComponents,
    closeModal,
    triggerFileInput,
    handleReadRemoteUrl,
    handleFileUpload,
    uploadAnalyzedFile,
    toggleComponent,
  } = useUmdAnalysis(isModalOpen, props.onImported);
</script>
<template>
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
            <i class="fas fa-flask text-blue-600"></i> 分析 UMD 包
          </h3>
          <button
            aria-label="关闭分析弹窗"
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
                          {{ brandText(lib.name) }}
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
                            {{ lib.status === 'loading' ? 'ANALYZING' : lib.status.toUpperCase() }}
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
                      <input
                        v-model="lib.versionOverride"
                        class="w-24 rounded border border-gray-300 bg-white px-2 py-1 font-mono font-bold text-gray-800 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        placeholder="1.0.0"
                      />
                    </div>
                    <div class="hidden sm:block w-px h-3.5 bg-gray-300 dark:bg-gray-600"></div>
                    <div class="flex items-center whitespace-nowrap">
                      <span class="text-gray-500 dark:text-gray-400 mr-1.5">作者:</span>
                      <span class="font-bold text-gray-800 dark:text-gray-200">{{
                        brandText(lib.manifest?.author)
                      }}</span>
                    </div>
                    <div class="hidden sm:block w-px h-3.5 bg-gray-300 dark:bg-gray-600"></div>
                    <div class="flex items-center min-w-0 flex-[2]">
                      <span class="text-gray-500 dark:text-gray-400 mr-1.5 shrink-0">描述:</span>
                      <span
                        class="font-medium text-gray-800 dark:text-gray-200 truncate min-w-0"
                        :title="brandText(lib.manifest?.description)"
                        >{{ brandText(lib.manifest?.description) }}</span
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
                          {{ brandText(comp.zhName || comp.displayName || comp.name) }}
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
                        {{ brandText(comp.description, '暂无描述') }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Fallback Component Keys -->
                <div
                  v-else-if="lib.componentKeys && lib.componentKeys.length > 0"
                  class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <h3 class="font-bold text-gray-700 dark:text-gray-300 mb-2 text-[12px] uppercase">
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
