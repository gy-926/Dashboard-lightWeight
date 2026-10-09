<script setup lang="ts">
  import type { UmdVersionRecord } from '@/api/dashboard-functions';
  import { formatSize } from '../display';
  defineProps<{
    versions: UmdVersionRecord[];
    versionsLoading: boolean;
    switchingVersionId: string | null;
  }>();
  const emit = defineEmits<{ refresh: []; activate: [item: UmdVersionRecord] }>();
  const loadVersions = () => emit('refresh');
  const switchVersion = (item: UmdVersionRecord) => emit('activate', item);
</script>
<template>
  <section class="admin-list-panel">
    <div class="admin-list-header">
      <div>
        <h2 class="text-sm font-bold text-gray-800 dark:text-white">本地 UMD 版本</h2>
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          每次导入都会保存原始 JS；启用历史版本会同步更新功能列表的运行地址。
        </p>
      </div>
      <button
        class="text-xs font-bold text-blue-600 dark:text-blue-400"
        :disabled="versionsLoading"
        @click="loadVersions"
      >
        <i
          class="fas fa-rotate-right mr-1"
          :class="{ 'fa-spin': versionsLoading }"
        />刷新
      </button>
    </div>
    <div
      v-if="versions.length === 0"
      class="px-5 py-8 text-center text-sm text-gray-400"
    >
      暂无本地版本，请先分析并导入 UMD 文件。
    </div>
    <div
      v-else
      class="divide-y divide-slate-100 dark:divide-slate-700"
    >
      <div
        v-for="item in versions"
        :key="item.id"
        class="admin-list-row"
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <span
            class="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
            ><i class="fas fa-code-branch"
          /></span>
          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-gray-800 dark:text-white">
              {{ item.name }}
              <span class="font-mono text-blue-600 dark:text-blue-400">v{{ item.version }}</span>
            </p>
            <p class="truncate text-xs text-gray-400">
              {{ item.original_name }} · {{ formatSize(item.size) }} · SHA-256
              {{ item.sha256.slice(0, 12) }}… ·
              {{ new Date(item.created_at).toLocaleString('zh-CN') }}
            </p>
          </div>
        </div>
        <div class="admin-list-actions">
          <span
            v-if="!item.file_available"
            class="w-fit rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400"
            title="数据库记录存在，但服务器上的原始 JS 已缺失或大小不匹配；请恢复存储文件或重新导入新版本。"
            >文件缺失</span
          >
          <span
            v-if="item.is_current"
            class="w-fit rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-600 dark:bg-green-900/20 dark:text-green-400"
            >当前版本</span
          >
          <button
            v-else
            class="admin-list-action admin-list-action-primary"
            :disabled="!item.file_available || Boolean(switchingVersionId)"
            @click="switchVersion(item)"
          >
            <i class="fas fa-circle-check" />启用版本
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
