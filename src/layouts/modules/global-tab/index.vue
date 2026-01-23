<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from '../global-menu/store'

const menuStore = useMenuStore()
const route = useRoute()
const router = useRouter()

// 标签页列表 - 按添加顺序从左往右排列
const tabsList = computed(() => menuStore.tabsList)

// 激活的标签
const activeTab = computed(() => route.path)

// 关闭标签
function closeTab(path: string, e: Event) {
  e.stopPropagation()
  const index = menuStore.tabsList.findIndex(t => t.path === path)
  if (index > -1) {
    menuStore.removeTab(path)
  }
  // 如果关闭的是当前激活的标签，跳转到最后一个标签
  if (path === activeTab.value && menuStore.tabsList.length > 0) {
    const lastTab = menuStore.tabsList[menuStore.tabsList.length - 1]
    router.push(lastTab.path)
  }
}

// 关闭其他标签
function closeOtherTabs(currentPath: string) {
  const currentTab = menuStore.tabsList.find(t => t.path === currentPath)
  if (currentTab) {
    menuStore.tabsList = [currentTab]
  }
}

// 关闭所有标签
function closeAllTabs() {
  menuStore.tabsList = []
  router.push('/')
}

// 是否可以关闭（至少保留一个标签）
function canClose(path: string): boolean {
  return menuStore.tabsList.length > 1 && path !== activeTab.value
}
</script>

<template>
  <div class="h-9 bg-white dark:bg-gray-800 flex items-center px-2 overflow-hidden">
    <div class="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-thin scrollbar-x">
      <template v-for="tab in tabsList" :key="tab.path">
        <div
          class="group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-all duration-200 whitespace-nowrap border border-transparent"
          :class="[
            activeTab === tab.path
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600'
          ]"
          @click="router.push(tab.path)"
        >
          <i v-if="tab.icon" :class="['fas', tab.icon, 'text-xs flex-shrink-0']" />
          <span class="truncate max-w-[100px]">{{ tab.title }}</span>
          <button
            v-if="canClose(tab.path) || activeTab === tab.path"
            class="w-4 h-4 rounded-full flex items-center justify-center transition-all"
            :class="[
              activeTab === tab.path
                ? 'opacity-100 hover:bg-blue-200 dark:hover:bg-blue-800/50'
                : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600'
            ]"
            @click="closeTab(tab.path, $event)"
          >
            <i
              class="fas fa-times text-[12px] not-italic"
              :class="activeTab === tab.path ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'"
            >x</i>
          </button>
        </div>
      </template>
    </div>

    <!-- 标签操作菜单 -->
    <div class="ml-auto flex items-center px-2 flex-shrink-0">
      <div class="relative group">
        <button class="p-1.5 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
          <i class="fas fa-ellipsis-h" />
        </button>
        <!-- 下拉菜单 -->
        <div class="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <button
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            @click="closeOtherTabs(activeTab)"
          >
            <i class="fas fa-times-circle" />
            <span>关闭其他</span>
          </button>
          <button
            class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            @click="closeAllTabs()"
          >
            <i class="fas fa-trash-alt" />
            <span>关闭所有</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scrollbar-x::-webkit-scrollbar {
  height: 3px;
}

.scrollbar-x::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-x::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.scrollbar-x::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>
