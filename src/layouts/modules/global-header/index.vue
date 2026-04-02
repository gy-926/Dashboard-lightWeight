<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useMenuStore } from '../global-menu/store';
  import GlobalTopMenu from '../global-menu/GlobalTopMenu.vue';
  import type { MenuItem } from '../global-menu/types';
  import { kivii } from '@kivii.com/bridge';

  defineProps<{
    showSiderToggle?: boolean;
  }>();

  const router = useRouter();
  const menuStore = useMenuStore();

  // 全屏功能
  const isFullscreen = ref(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function onFullscreenChange() {
    isFullscreen.value = !!document.fullscreenElement;
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', onFullscreenChange);
  });

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
  });

  // 菜单列表
  const menuList = ref(menuStore.menuList);

  function handleMenuSelect(item: MenuItem) {
    // mix 模式：点击顶部根节点时立即更新侧边子菜单
    if (isMixLayout.value) {
      menuStore.setMixActiveRoot(item.key);
      // 根节点在原始菜单树中有子项，说明它只是容器而非页面，不加入标签页
      const original = menuStore.menuList.find(m => m.key === item.key);
      if (original?.children?.length) return;
    }
    menuStore.addTab(item);
  }

  const userDropdownVisible = ref(false);
  function toggleUserDropdown() {
    userDropdownVisible.value = !userDropdownVisible.value;
  }

  // 退出登录
  async function handleLogout() {
    try {
      await kivii.request.post('/auth/logout.json', undefined, {
        header: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear store state (tabs, etc.)
      menuStore.resetState();

      // Clear all caches
      localStorage.clear();
      sessionStorage.clear();
      // Redirect to login
      router.replace('/login');
    }
  }

  // 是否为顶部菜单布局
  const isTopLayout = computed(() => menuStore.theme.layout === 'top');

  // 顶部菜单列表（只显示一级菜单）
  const topMenuList = computed(() => {
    return menuStore.menuList.filter(item => !item.hidden);
  });

  // 是否为混合布局
  const isMixLayout = computed(() => menuStore.theme.layout === 'mix');

  // 混合布局下的顶部菜单
  const mixHeaderMenuList = computed(() => menuStore.mixHeaderMenuList);

  // 全局配置相关的展示字段
  const systemName = computed(() => {
    return (window as any).uiGlobalConfig?.DisplayName || 'Kivii';
  });

  const systemIcon = computed(() => {
    return (window as any).uiGlobalConfig?.Icon || 'fas fa-bolt';
  });

  const currentUserName = computed(() => {
    return (window as any).KiviiContext?.CurrentMember?.DisplayName || 'Admin';
  });
</script>

<template>
  <!-- 顶部菜单布局 -->
  <header
    v-if="isTopLayout"
    class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between relative z-[20] transition-colors duration-300"
  >
    <!-- 左侧：Logo（固定宽度） -->
    <div
      class="flex items-center px-6 border-r border-gray-200 dark:border-gray-700 h-full w-auto flex-shrink-0"
    >
      <div class="flex items-center gap-2 cursor-pointer">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <i :class="[systemIcon, 'text-white']" />
        </div>
        <span class="text-lg font-bold text-gray-800 dark:text-white">{{ systemName }}</span>
      </div>
    </div>

    <!-- 中间：顶部导航菜单（自适应，占据剩余空间） -->
    <div class="h-full flex-1 overflow-visible">
      <GlobalTopMenu
        :menu="topMenuList"
        @select="handleMenuSelect"
      />
    </div>

    <!-- 右侧：通知、用户 -->
    <div class="flex items-center gap-1 pr-4">
      <!-- 全屏按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        :title="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      >
        <i :class="['fas', isFullscreen ? 'fa-compress' : 'fa-expand']" />
      </button>

      <!-- 主题切换按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="切换主题"
        @click="menuStore.toggleDarkMode()"
      >
        <i :class="['fas', menuStore.theme.darkMode ? 'fa-sun' : 'fa-moon']" />
      </button>

      <!-- 用户下拉菜单 -->
      <div
        class="relative ml-2"
        @mouseenter="userDropdownVisible = true"
        @mouseleave="userDropdownVisible = false"
      >
        <button
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
          >
            <i class="fas fa-user text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ currentUserName }}</span>
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
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[200]"
          >
            <a
              href="#"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <i class="fas fa-user-circle w-4" />
              <span>个人中心</span>
            </a>
            <a
              href="#"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <i class="fas fa-cog w-4" />
              <span>设置</span>
            </a>
            <hr class="my-1 border-gray-200 dark:border-gray-700" />
            <a
              href="#"
              class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              @click.prevent="handleLogout"
            >
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
    class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 relative z-[50] transition-colors duration-300"
  >
    <!-- 左侧：侧边栏折叠按钮 或 Logo -->
    <div class="flex items-center gap-4 flex-shrink-0">
      <button
        v-if="showSiderToggle !== false"
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        @click="menuStore.toggleSider()"
      >
        <i class="fas fa-bars" />
      </button>
      <div
        v-else-if="isMixLayout"
        class="flex items-center gap-2 cursor-pointer pr-4 border-r border-gray-200 dark:border-gray-700"
        @click="router.push('/')"
      >
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <i :class="[systemIcon, 'text-white']" />
        </div>
        <span class="text-lg font-bold text-gray-800 dark:text-white">{{ systemName }}</span>
      </div>
    </div>

    <!-- 混合布局下的二级菜单 -->
    <div
      v-if="isMixLayout"
      class="flex-1 h-full overflow-visible ml-4"
    >
      <GlobalTopMenu
        :menu="mixHeaderMenuList"
        layout-mode="mix"
        @select="handleMenuSelect"
      />
    </div>

    <!-- 右侧：通知、用户 -->
    <div class="flex items-center gap-1">
      <!-- 全屏按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        :title="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      >
        <i :class="['fas', isFullscreen ? 'fa-compress' : 'fa-expand']" />
      </button>

      <!-- 主题切换按钮 -->
      <button
        class="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        title="切换主题"
        @click="menuStore.toggleDarkMode()"
      >
        <i :class="['fas', menuStore.theme.darkMode ? 'fa-sun' : 'fa-moon']" />
      </button>

      <!-- 用户下拉菜单 -->
      <div
        class="relative ml-2"
        @mouseenter="userDropdownVisible = true"
        @mouseleave="userDropdownVisible = false"
      >
        <button
          class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div
            class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
          >
            <i class="fas fa-user text-blue-600 dark:text-blue-400" />
          </div>
          <span class="text-sm text-gray-600 dark:text-gray-400">{{ currentUserName }}</span>
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
            class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[200]"
          >
            <a
              href="#"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <i class="fas fa-user-circle w-4" />
              <span>个人中心</span>
            </a>
            <a
              href="#"
              class="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            >
              <i class="fas fa-cog w-4" />
              <span>设置</span>
            </a>
            <hr class="my-1 border-gray-200 dark:border-gray-700" />
            <a
              href="#"
              class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              @click.prevent="handleLogout"
            >
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
