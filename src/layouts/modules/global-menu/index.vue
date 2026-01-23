<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { MenuItem } from './types'

// 递归组件定义
defineOptions({
  name: 'GlobalMenuItem'
})

const props = defineProps<{
  menu: MenuItem[]
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', item: MenuItem): void
}>()

const router = useRouter()
const route = useRoute()

const selectedKey = computed(() => route.path)

function handleSelect(item: MenuItem) {
  emit('select', item)
  router.push(item.path)
}

function hasChildren(item: MenuItem): boolean {
  return !!(item.children && item.children.length > 0)
}
</script>

<template>
  <ul class="space-y-1">
    <template v-for="item in menu" :key="item.key">
      <li v-if="!hasChildren(item)">
        <router-link
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium': selectedKey === item.path }"
          :title="item.title"
        >
          <i v-if="item.icon" :class="['fas', item.icon, 'w-5 h-5 flex-shrink-0']" />
          <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
        </router-link>
      </li>
      <li v-else>
        <div class="group">
          <router-link
            :to="item.redirect || item.children[0]?.path || '#'"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium': selectedKey.startsWith(item.path) }"
            :title="item.title"
          >
            <i v-if="item.icon" :class="['fas', item.icon, 'w-5 h-5 flex-shrink-0']" />
            <template v-if="!collapsed">
              <span class="flex-1 truncate">{{ item.title }}</span>
              <i class="fas fa-chevron-down text-xs transition-transform group-[.is-active]:rotate-180" />
            </template>
          </router-link>
          <div v-if="!collapsed" class="ml-4 mt-1 space-y-1">
            <GlobalMenuItem
              :menu="item.children || []"
              :collapsed="collapsed"
              @select="emit('select', $event)"
            />
          </div>
        </div>
      </li>
    </template>
  </ul>
</template>
