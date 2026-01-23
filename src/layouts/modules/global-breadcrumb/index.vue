<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '../global-menu/store'

const menuStore = useMenuStore()
const route = useRoute()
const router = useRouter()

// 面包屑列表
const breadcrumbs = computed(() => menuStore.breadcrumbs)

// 跳转到指定路径
function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="flex items-center gap-2 text-sm">
    <template v-for="(item, index) in breadcrumbs" :key="item.path">
      <!-- 可点击的面包屑（非最后一项） -->
      <template v-if="index < breadcrumbs.length - 1">
        <router-link
          :to="item.path"
          class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <i v-if="item.icon" :class="['fas', item.icon, 'mr-1']" />
          {{ item.title }}
        </router-link>
        <i class="fas fa-chevron-right text-gray-300 dark:text-gray-600 text-xs" />
      </template>

      <!-- 当前页（最后一项） -->
      <template v-else>
        <span class="text-gray-800 dark:text-white font-medium">
          <i v-if="item.icon" :class="['fas', item.icon, 'mr-1']" />
          {{ item.title }}
        </span>
      </template>
    </template>
  </nav>
</template>
