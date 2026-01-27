<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMenuStore } from '../global-menu/store'
import GlobalTopMenu from '../global-menu/GlobalTopMenu.vue'
import type { MenuItem } from '../global-menu/types'

defineProps<{
  showSiderToggle?: boolean
}>()

const menuStore = useMenuStore()

// 菜单列表
const menuList = ref(menuStore.menuList)

function handleMenuSelect(item: MenuItem) {
  menuStore.addTab(item)
}

const userDropdownVisible = ref(false)
function toggleUserDropdown() {
  userDropdownVisible.value = !userDropdownVisible.value
}

const notificationVisible = ref(false)
function toggleNotification() {
  notificationVisible.value = !notificationVisible.value
}

// 是否为顶部菜单布局
const isTopLayout = computed(() => menuStore.theme.layout === 'top')

// 顶部菜单列表（只显示一级菜单）
const topMenuList = computed(() => {
  return menuStore.menuList.filter(item => !item.hidden)
})
</script>

<template>
  <!-- 顶部菜单布局 -->
  <header
    v-if="isTopLayout"
    class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center"
  >
    <!-- Logo -->
    <div class="flex items-center px-6 border-r border-gray-200 dark:border-gray-700 h-full">
      <div class="flex items-center gap-2 cursor-pointer">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <i class="fas fa-bolt text-white" />
        </div>
        <span class="text-lg font-bold text-gray-800 dark:text-white">Kivii</span>
      </div>
    </div>

    <!-- 顶部导航菜单 -->
    <div class="flex-1 h-full max-w-4xl overflow-visible">
      <GlobalTopMenu
        :menu="topMenuList"
        @select="handleMenuSelect"
      />
    </div>

    <!-- 右侧：通知、用户 -->
    <div class="flex items-center gap-1 px-4">
      <!-- 全屏按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="全屏"
      >
        <i class="fas fa-expand" />
      </button>

      <!-- 主题切换按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="切换主题"
        @click="menuStore.toggleDarkMode()"
      >
        <i :class="['fas', menuStore.theme.darkMode ? 'fa-sun' : 'fa-moon']" />
      </button>

      <!-- 通知按钮 -->
      <div class="relative">
        <button
          class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          @click="toggleNotification()"
        >
          <i class="fas fa-bell" />
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="notificationVisible"
            class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          >
            <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 class="font-medium text-gray-800 dark:text-white">通知</h3>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <p class="text-sm text-gray-600 dark:text-gray-400">暂无新通知</p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 用户下拉菜单 -->
      <div class="relative ml-2">
        <button
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          @click="toggleUserDropdown()"
        >
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Admin</span>
          <i class="fas fa-chevron-down text-xs text-gray-400 dark:text-gray-500" />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="userDropdownVisible"
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          >
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <i class="fas fa-user-circle w-4" />
              <span>个人中心</span>
            </a>
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <i class="fas fa-cog w-4" />
              <span>设置</span>
            </a>
            <hr class="my-1 border-gray-200 dark:border-gray-700" />
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <i class="fas fa-sign-out-alt w-4" />
              <span>退出登录</span>
            </a>
          </div>
        </Transition>
      </div>

      <!-- 主题设置按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="主题设置"
        @click="$emit('open-theme-drawer')"
      >
        <i class="fas fa-palette" />
      </button>
    </div>
  </header>

  <!-- 侧边栏/混合布局 -->
  <header
    v-else
    class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4"
  >
    <!-- 左侧：侧边栏折叠按钮 -->
    <div class="flex items-center gap-4">
      <button
        v-if="showSiderToggle !== false"
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        @click="menuStore.toggleSider()"
      >
        <i class="fas fa-bars" />
      </button>
      <span class="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
        {{ new Date().toLocaleDateString('zh-CN') }}
      </span>
    </div>

    <!-- 右侧：通知、用户 -->
    <div class="flex items-center gap-1">
      <!-- 全屏按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="全屏"
      >
        <i class="fas fa-expand" />
      </button>

      <!-- 主题切换按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="切换主题"
        @click="menuStore.toggleDarkMode()"
      >
        <i :class="['fas', menuStore.theme.darkMode ? 'fa-sun' : 'fa-moon']" />
      </button>

      <!-- 通知按钮 -->
      <div class="relative">
        <button
          class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          @click="toggleNotification()"
        >
          <i class="fas fa-bell" />
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="notificationVisible"
            class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          >
            <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <h3 class="font-medium text-gray-800 dark:text-white">通知</h3>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <p class="text-sm text-gray-600 dark:text-gray-400">暂无新通知</p>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 用户下拉菜单 -->
      <div class="relative ml-2">
        <button
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          @click="toggleUserDropdown()"
        >
          <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400">Admin</span>
          <i class="fas fa-chevron-down text-xs text-gray-400 dark:text-gray-500" />
        </button>

        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="userDropdownVisible"
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
          >
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <i class="fas fa-user-circle w-4" />
              <span>个人中心</span>
            </a>
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <i class="fas fa-cog w-4" />
              <span>设置</span>
            </a>
            <hr class="my-1 border-gray-200 dark:border-gray-700" />
            <a href="#" class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700/50">
              <i class="fas fa-sign-out-alt w-4" />
              <span>退出登录</span>
            </a>
          </div>
        </Transition>
      </div>

      <!-- 主题设置按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="主题设置"
        @click="$emit('open-theme-drawer')"
      >
        <i class="fas fa-palette" />
      </button>
    </div>
  </header>
</template>
