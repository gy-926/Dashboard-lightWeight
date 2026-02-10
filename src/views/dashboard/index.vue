<script setup lang="ts">
  import { remoteLibraries } from '@/utils/remoteComponentLoader';
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">UMD文件配置读取</h1>
      <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
        共 {{ remoteLibraries.length }} 个库
      </span>
    </div>

    <div
      v-if="remoteLibraries.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-500"
    >
      <i class="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
      <p>暂无远程组件库信息</p>
    </div>

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
