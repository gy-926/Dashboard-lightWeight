<script setup lang="ts">
import { PAGE_HOST_RESIDENT_LIMIT, usePageHostPilotStore } from './pilot-store';
const pageHost = usePageHostPilotStore();
</script>

<template>
  <div
    v-if="pageHost.capacityWarning"
    role="alert"
    class="fixed left-1/2 top-5 z-[600] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 shadow-lg dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
  >
    <span>页面驻留已达上限（{{ PAGE_HOST_RESIDENT_LIMIT }} 个），请关闭未使用标签。</span>
    <button type="button" aria-label="关闭驻留上限提示" class="shrink-0 rounded px-1 text-lg hover:bg-amber-100 dark:hover:bg-amber-900" @click="pageHost.dismissCapacityWarning()">×</button>
  </div>
</template>
