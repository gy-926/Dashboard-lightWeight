<script setup lang="ts">
import { computed } from 'vue'
import { useMenuStore } from '../global-menu/store'

const menuStore = useMenuStore()

// 菜单列表
const menuList = computed(() => menuStore.menuList)

// 折叠状态
const collapsed = computed(() => menuStore.siderCollapsed)

// 侧边栏宽度样式
const siderWidth = computed(() => collapsed.value ? '72px' : '220px')

// Logo 区域点击事件
function handleLogoClick() {
  // 可以添加 Logo 点击逻辑
}
</script>

<template>
  <aside
    class="h-screen flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300"
    :style="{ width: siderWidth }"
  >
    <!-- Logo 区域 -->
    <div
      class="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 cursor-pointer"
      @click="handleLogoClick"
    >
      <template v-if="!collapsed">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i class="fas fa-bolt text-white" />
          </div>
          <span class="text-lg font-bold text-gray-800 dark:text-white">Kivii</span>
        </div>
      </template>
      <template v-else>
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <i class="fas fa-bolt text-white" />
        </div>
      </template>
    </div>

    <!-- 菜单滚动区域 -->
    <div class="flex-1 py-4 px-3 scrollbar-hide overflow-y-auto overflow-x-hidden">
      <GlobalMenu
        :menu="menuList"
        :collapsed="collapsed"
        @select="menuStore.addTab"
      />
    </div>

    <!-- 底部折叠按钮 -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-3">
      <button
        class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-200"
        @click="menuStore.toggleSider()"
      >
        <i :class="['fas transition-transform duration-200', collapsed ? 'fa-angle-right' : 'fa-angle-left']" />
        <span v-if="!collapsed" class="text-sm">收起</span>
      </button>
    </div>
  </aside>
</template>
