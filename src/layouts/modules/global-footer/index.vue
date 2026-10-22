<script setup lang="ts">
// 当前年份
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-[54px] shrink-0 flex items-center px-4 md:px-6">
    <div class="flex w-full min-w-0 items-center justify-between gap-4">
      <!-- 版权信息 -->
      <div class="min-w-0 truncate text-xs text-gray-500 dark:text-gray-400">
        &copy; {{ currentYear }} GavinYinHub. All rights reserved.
      </div>

      <!-- 备案信息 -->
      <div class="min-w-0 truncate text-xs text-gray-400 dark:text-gray-500">
        Powered by Vue 3 + Tailwind CSS
      </div>
    </div>
  </footer>
</template>
