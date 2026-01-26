<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from './store'
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
const menuStore = useMenuStore()

const selectedKey = computed(() => route.path)
const openKeys = computed(() => menuStore.openKeys)

function hasChildren(item: MenuItem): boolean {
  return !!(item.children && item.children.length > 0)
}

function isOpen(key: string): boolean {
  return openKeys.value.includes(key)
}

function toggleOpen(key: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  menuStore.toggleOpenKey(key)
}

function handleSelect(item: MenuItem) {
  emit('select', item)
  router.push(item.path)
}

// 检查当前路由是否在某个父菜单下
function isChildOfMenu(menuPath: string): boolean {
  return selectedKey.value.startsWith(menuPath) && selectedKey.value !== menuPath
}
</script>

<template>
  <ul class="space-y-1">
    <template v-for="item in menu" :key="item.key">
      <!-- 无子菜单的菜单项 -->
      <li v-if="!hasChildren(item)">
        <router-link
          :to="item.path"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
          :class="[
            selectedKey === item.path
              ? 'bg-primary-bg text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          ]"
          :title="item.title"
        >
          <i v-if="item.icon" :class="['fas', item.icon, 'w-5 h-5 flex-shrink-0']" />
          <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
        </router-link>
      </li>

      <!-- 有子菜单的菜单项 -->
      <li v-else>
        <div>
          <!-- 父级菜单 - 用 button 处理展开/收起 -->
          <button
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
            :class="[
              selectedKey.startsWith(item.path)
                ? 'bg-primary-bg text-primary font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
            ]"
            :title="item.title"
            @click="toggleOpen(item.key, $event)"
          >
            <i v-if="item.icon" :class="['fas', item.icon, 'w-5 h-5 flex-shrink-0']" />
            <template v-if="!collapsed">
              <span class="flex-1 truncate">{{ item.title }}</span>
              <i
                class="fas text-xs transition-transform duration-200"
                :class="[
                  isOpen(item.key) || isChildOfMenu(item.path) ? 'fa-chevron-up rotate-180' : 'fa-chevron-down'
                ]"
              />
            </template>
          </button>

          <!-- 子菜单 -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div v-if="!collapsed && (isOpen(item.key) || isChildOfMenu(item.path))" class="ml-4 mt-1 space-y-1">
              <GlobalMenuItem
                :menu="item.children || []"
                :collapsed="collapsed"
                @select="emit('select', $event)"
              />
            </div>
          </Transition>
        </div>
      </li>
    </template>
  </ul>
</template>
