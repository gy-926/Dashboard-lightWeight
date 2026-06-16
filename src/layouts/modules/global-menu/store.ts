import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { MenuItem, ThemeConfig } from './types';
import { findMenuParents, transformRouteToMenu } from './types';
import { useTeleportManager } from '@/store/modules/teleport-manager';

const THEME_STORAGE_KEY = 'kivii-theme';

const defaultTheme: ThemeConfig = {
  layout: 'side',
  primaryColor: '#3b82f6',
  darkMode: false,
  siderWidth: 220,
  showTabs: true,
  showBreadcrumb: true,
  showFooter: false,
  showWatermark: false,
  watermarkText: 'Dashboard',
  preserveHomeTab: true,
};

function loadThemeConfig(): ThemeConfig {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (!saved) return { ...defaultTheme };
    const parsed = JSON.parse(saved);
    return {
      ...defaultTheme,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return { ...defaultTheme };
  }
}

function persistTheme(theme: ThemeConfig) {
  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}

function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty('--ui-primary-color', theme.primaryColor);
  root.style.setProperty('--nprogress-color', theme.primaryColor);
  if (theme.darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

function cloneTab(item: MenuItem): MenuItem {
  return {
    key: item.key,
    path: item.path,
    title: item.title,
    icon: item.icon,
    description: item.description,
    hidden: item.hidden,
    alwaysShow: item.alwaysShow,
    parentPath: item.parentPath,
    meta: item.meta ? { ...item.meta } : undefined,
    redirect: item.redirect,
    kvid: item.kvid,
    children: [],
  };
}

function findMenuByPath(menu: MenuItem[], path: string): MenuItem | null {
  for (const item of menu) {
    if (item.path === path) return item;
    if (item.children?.length) {
      const child = findMenuByPath(item.children, path);
      if (child) return child;
    }
  }
  return null;
}

function getRootMenuByPath(menu: MenuItem[], path: string): MenuItem | null {
  for (const item of menu) {
    if (item.path === path) return item;
    if (item.children?.length) {
      const child = findMenuByPath(item.children, path);
      if (child) return item;
    }
  }
  return null;
}

function getTabKvid(tab: MenuItem): string | undefined {
  const meta = tab.meta as Record<string, unknown> | undefined;
  const metaKvid = typeof meta?.kvid === 'string' ? meta.kvid : undefined;
  return tab.kvid || metaKvid;
}

export const useMenuStore = defineStore('global-menu', () => {
  const teleportManager = useTeleportManager();

  const menuList = ref<MenuItem[]>([]);
  const tabsList = ref<MenuItem[]>([]);
  const openKeys = ref<string[]>([]);
  const selectedKey = ref('');
  const siderCollapsed = ref(false);
  const mixActiveRootKey = ref('');
  const theme = ref<ThemeConfig>(loadThemeConfig());

  applyTheme(theme.value);

  const mixHeaderMenuList = computed(() => menuList.value.filter(item => !item.hidden));
  const mixSiderMenuList = computed(() => {
    if (!mixActiveRootKey.value) return [];
    const root = menuList.value.find(item => item.key === mixActiveRootKey.value);
    return root?.children ?? [];
  });

  const breadcrumbs = computed(() => {
    const path = selectedKey.value;
    if (!path) return [];
    const parents = findMenuParents(menuList.value, path);
    const current = findMenuByPath(menuList.value, path);
    return current ? [...parents, current] : parents;
  });

  function setTheme(nextTheme: Partial<ThemeConfig>) {
    theme.value = {
      ...theme.value,
      ...nextTheme,
    };
    persistTheme(theme.value);
    applyTheme(theme.value);
  }

  function toggleDarkMode() {
    setTheme({ darkMode: !theme.value.darkMode });
  }

  function toggleSider() {
    siderCollapsed.value = !siderCollapsed.value;
  }

  function setMenuFromRoutes(routes: RouteRecordRaw[]) {
    menuList.value = transformRouteToMenu(routes);
    if (!mixActiveRootKey.value && menuList.value.length > 0) {
      mixActiveRootKey.value = menuList.value[0].key;
    }
    if (selectedKey.value) {
      setSelectedKey(selectedKey.value);
    }
  }

  function openKey(key: string) {
    if (!openKeys.value.includes(key)) {
      openKeys.value = [...openKeys.value, key];
    }
  }

  function closeAllKeys() {
    openKeys.value = [];
  }

  function toggleOpenKey(key: string) {
    if (openKeys.value.includes(key)) {
      openKeys.value = openKeys.value.filter(item => item !== key);
      return;
    }
    openKeys.value = [...openKeys.value, key];
  }

  function setMixActiveRoot(key: string) {
    mixActiveRootKey.value = key;
  }

  function setSelectedKey(path: string) {
    selectedKey.value = path;

    const parents = findMenuParents(menuList.value, path);
    openKeys.value = Array.from(new Set(parents.map(item => item.key)));

    const root = getRootMenuByPath(menuList.value, path);
    if (root) {
      mixActiveRootKey.value = root.key;
    }
  }

  function addTab(item: MenuItem) {
    if (!item?.path) return;

    const existingIndex = tabsList.value.findIndex(tab => tab.path === item.path);
    if (existingIndex !== -1) {
      const existing = tabsList.value[existingIndex];
      tabsList.value.splice(existingIndex, 1, {
        ...existing,
        ...cloneTab(item),
      });
      return;
    }

    tabsList.value.push(cloneTab(item));
  }

  function cleanupTabCache(tab: MenuItem) {
    teleportManager.removeComponentCacheByPath(tab.path, getTabKvid(tab));
  }

  function isProtectedHomeTab(tab: MenuItem) {
    return theme.value.preserveHomeTab && tab.path === '/home';
  }

  async function removeTab(path: string) {
    const target = tabsList.value.find(tab => tab.path === path);
    if (!target) return;
    if (isProtectedHomeTab(target)) return;

    tabsList.value = tabsList.value.filter(tab => tab.path !== path);
    cleanupTabCache(target);
  }

  async function removeOtherTabs(targetPath: string) {
    const removed = tabsList.value.filter(tab => {
      if (tab.path === targetPath) return false;
      if (isProtectedHomeTab(tab)) return false;
      return true;
    });
    tabsList.value = tabsList.value.filter(tab => {
      if (tab.path === targetPath) return true;
      return isProtectedHomeTab(tab);
    });
    removed.forEach(cleanupTabCache);
  }

  async function removeLeftTabs(targetPath: string) {
    const targetIndex = tabsList.value.findIndex(tab => tab.path === targetPath);
    if (targetIndex <= 0) return;

    const removed = tabsList.value.slice(0, targetIndex).filter(tab => !isProtectedHomeTab(tab));
    tabsList.value = [
      ...tabsList.value.slice(0, targetIndex).filter(isProtectedHomeTab),
      ...tabsList.value.slice(targetIndex),
    ];
    removed.forEach(cleanupTabCache);
  }

  async function removeRightTabs(targetPath: string) {
    const targetIndex = tabsList.value.findIndex(tab => tab.path === targetPath);
    if (targetIndex === -1) return;

    const removed = tabsList.value.slice(targetIndex + 1).filter(tab => !isProtectedHomeTab(tab));
    tabsList.value = [
      ...tabsList.value.slice(0, targetIndex + 1),
      ...tabsList.value.slice(targetIndex + 1).filter(isProtectedHomeTab),
    ];
    removed.forEach(cleanupTabCache);
  }

  async function removeAllTabs() {
    const removed = tabsList.value.filter(tab => !isProtectedHomeTab(tab));
    tabsList.value = tabsList.value.filter(isProtectedHomeTab);
    removed.forEach(cleanupTabCache);
  }

  // 关闭单个菜单 key（用于子菜单飞出层离开）
  function closeKey(key: string) {
    const index = openKeys.value.indexOf(key);
    if (index > -1) {
      openKeys.value.splice(index, 1);
    }
  }

  function resetState() {
    menuList.value = [];
    tabsList.value = [];
    openKeys.value = [];
    selectedKey.value = '';
    siderCollapsed.value = false;
    mixActiveRootKey.value = '';
  }

  return {
    menuList,
    tabsList,
    openKeys,
    selectedKey,
    siderCollapsed,
    mixActiveRootKey,
    theme,
    mixHeaderMenuList,
    mixSiderMenuList,
    breadcrumbs,
    setTheme,
    toggleDarkMode,
    toggleSider,
    setMenuFromRoutes,
    openKey,
    closeAllKeys,
    toggleOpenKey,
    setMixActiveRoot,
    setSelectedKey,
    addTab,
    removeTab,
    removeOtherTabs,
    removeLeftTabs,
    removeRightTabs,
    removeAllTabs,
    closeKey,
    resetState,
  };
});
