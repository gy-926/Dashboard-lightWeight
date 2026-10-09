<script setup lang="ts">
  import { ref } from 'vue';
  import { remoteLibraries } from '@/utils/umd/state';
  import { useUmdVersions } from './useUmdVersions';
  import UmdVersionList from './components/UmdVersionList.vue';
  import UmdImportDialog from './components/UmdImportDialog.vue';
  import UmdLibraryCard from './components/UmdLibraryCard.vue';
  const isModalOpen = ref(false);
  const openModal = () => {
    isModalOpen.value = true;
  };
  const { versions, versionsLoading, switchingVersionId, loadVersions, switchVersion } =
    useUmdVersions();
</script>

<template>
  <div class="space-y-6 relative">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div
          class="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400"
        >
          <i class="fas fa-flask"></i>
          模块接入与检查
        </div>
        <h1 class="mt-1.5 text-2xl font-bold text-gray-800 dark:text-white">UMD 模块管理</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          加载远程地址或本地 UMD 文件，检查模块信息与可注册组件。
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button
          @click="openModal"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <i class="fas fa-magnifying-glass-chart"></i>
          分析 UMD 包
        </button>

        <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          已加载 {{ remoteLibraries.length }} 个组件库
        </span>
      </div>
    </div>

    <UmdVersionList
      :versions="versions"
      :versions-loading="versionsLoading"
      :switching-version-id="switchingVersionId"
      @refresh="loadVersions"
      @activate="switchVersion"
    />

    <!-- Modal (Dialog) Overlay using pure Tailwind CSS and Teleport -->
    <UmdImportDialog
      v-model="isModalOpen"
      :on-imported="loadVersions"
    />

    <!-- Empty State -->
    <div
      v-if="remoteLibraries.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-500"
    >
      <i class="fas fa-inbox text-4xl mb-4 text-gray-300"></i>
      <p>暂无远程组件库信息</p>
    </div>

    <!-- Main Interface Server Libraries List -->
    <UmdLibraryCard
      v-for="lib in remoteLibraries"
      :key="lib.url"
      :lib="lib"
    />
  </div>
</template>
