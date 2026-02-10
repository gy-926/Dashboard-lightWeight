import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { MenuItem, ThemeConfig, MenuConfig } from './types';
import { transformRouteToMenu } from './types';

// 辅助函数：颜色变亮
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `rgba(${R}, ${G}, ${B}, 0.2)`;
}

// 辅助函数：颜色变暗
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}

// 辅助函数：hex 转 rgba
function hexToRgba(hex: string, alpha: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const R = (num >> 16) & 255;
  const G = (num >> 8) & 255;
  const B = num & 255;
  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

// 从本地存储读取保存的主题设置
function loadThemeFromStorage(): Partial<ThemeConfig> {
  try {
    const saved = localStorage.getItem('kivii-theme');
    if (saved) {
      return JSON.parse(saved);
    }
    // 检查系统偏好
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return { darkMode: true };
    }
  } catch (e) {
    console.warn('Failed to load theme from storage:', e);
  }
  return {};
}

// 从本地存储读取标签页
function loadTabsFromStorage(): MenuItem[] {
  try {
    const saved = localStorage.getItem('kivii-tabs');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load tabs from storage:', e);
  }
  return [];
}

// 应用暗色模式到 DOM
function applyDarkMode(darkMode: boolean) {
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// 应用主题色到 CSS 变量
function applyThemeColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', color);

  // 计算 lighten 颜色
  const lightColor = lightenColor(color, 40);
  root.style.setProperty('--color-primary-light', lightColor);

  // 计算 darker 颜色
  const darkColor = darkenColor(color, 10);
  root.style.setProperty('--color-primary-dark', darkColor);

  // 计算 hover 颜色
  const hoverColor = darkenColor(color, 5);
  root.style.setProperty('--color-primary-hover', hoverColor);

  // 计算半透明背景色
  root.style.setProperty('--color-primary-bg', hexToRgba(color, 0.1));

  // 计算暗色模式下的颜色变体
  const darkModeLight = hexToRgba(color, 0.15);
  const darkModeBg = hexToRgba(color, 0.1);
  const darkModeHover = hexToRgba(color, 0.25);
  root.style.setProperty('--color-primary-dark-mode-light', darkModeLight);
  root.style.setProperty('--color-primary-dark-mode-bg', darkModeBg);
  root.style.setProperty('--color-primary-dark-mode-hover', darkModeHover);
}

export const useMenuStore = defineStore('menu', () => {
  // 加载保存的设置
  const savedTheme = loadThemeFromStorage();

  // 菜单列表
  const menuList = ref<MenuItem[]>([]);
  // 展开的菜单 keys
  const openKeys = ref<string[]>([]);
  // 选中的菜单 key
  const selectedKey = ref<string>('');
  // 标签页列表
  const tabsList = ref<MenuItem[]>(loadTabsFromStorage());
  // 主题配置
  const theme = ref<ThemeConfig>({
    layout: 'side', // 强制使用顶部菜单布局
    primaryColor: savedTheme.primaryColor || '#3b82f6',
    darkMode: savedTheme.darkMode !== undefined ? savedTheme.darkMode : true,
    siderWidth: 220,
    showTabs: true,
    showBreadcrumb: true,
    showFooter: false,
  });
  // 菜单配置
  const menuConfig = ref<MenuConfig>({
    showFullPath: false,
    accordion: true,
    defaultOpenKeys: [],
    defaultSelectedKey: '',
    collapsed: false,
  });
  // 侧边栏折叠状态
  const siderCollapsed = ref(false);

  // 初始化时应用主题
  applyDarkMode(theme.value.darkMode);
  applyThemeColor(theme.value.primaryColor);

  // 监听主题变化并保存到本地存储
  watch(
    theme,
    val => {
      try {
        localStorage.setItem(
          'kivii-theme',
          JSON.stringify({
            layout: val.layout,
            primaryColor: val.primaryColor,
            darkMode: val.darkMode,
            showTabs: val.showTabs,
            showBreadcrumb: val.showBreadcrumb,
            showFooter: val.showFooter,
          })
        );
      } catch (e) {
        console.warn('Failed to save theme:', e);
      }
    },
    { deep: true }
  );

  // 监听标签页变化并保存到本地存储
  watch(
    tabsList,
    val => {
      try {
        localStorage.setItem('kivii-tabs', JSON.stringify(val));
      } catch (e) {
        console.warn('Failed to save tabs:', e);
      }
    },
    { deep: true }
  );

  // 计算面包屑
  const breadcrumbs = computed(() => {
    const selectedMenu = findMenuByKey(menuList.value, selectedKey.value);
    if (!selectedMenu) return [];

    const breads: MenuItem[] = [];
    breads.push(selectedMenu);

    let parent = findMenuParent(menuList.value, selectedMenu.path);
    while (parent) {
      breads.unshift(parent);
      parent = findMenuParent(menuList.value, parent.path);
    }

    return breads;
  });

  // 设置路由转换的菜单
  function setMenuFromRoutes(routes: any[]) {
    menuList.value = transformRouteToMenu(routes);
  }

  // 设置选中的菜单
  function setSelectedKey(path: string) {
    selectedKey.value = path;
    // 自动展开父级
    const parents = findAllParents(menuList.value, path);
    openKeys.value = parents.map(p => p.key);
  }

  // 添加标签页
  function addTab(menu: MenuItem) {
    const exists = tabsList.value.find(t => t.path === menu.path);
    if (!exists) {
      tabsList.value.push({ ...menu });
    }
  }

  // 移除标签页
  async function removeTab(path: string) {
    const index = tabsList.value.findIndex(t => t.path === path);
    if (index > -1) {
      const tab = tabsList.value[index];
      tabsList.value.splice(index, 1);
      // 清理对应的组件缓存
      try {
        const { useTeleportManager } = await import('@/store/modules/teleport-manager');
        const teleportManager = useTeleportManager();
        teleportManager.removeComponentCacheByPath(path, tab.kvid);
      } catch (e) {
        // 忽略导入错误
      }
    }
  }

  // 设置侧边栏折叠
  function setSiderCollapsed(collapsed: boolean) {
    siderCollapsed.value = collapsed;
  }

  // 切换侧边栏折叠
  function toggleSider() {
    siderCollapsed.value = !siderCollapsed.value;
  }

  // 切换主题
  function toggleDarkMode() {
    theme.value.darkMode = !theme.value.darkMode;
    applyDarkMode(theme.value.darkMode);
  }

  // 更新主题配置
  function setTheme(config: Partial<ThemeConfig>) {
    theme.value = { ...theme.value, ...config };

    // 处理暗色模式
    if (config.darkMode !== undefined) {
      applyDarkMode(config.darkMode);
    }

    // 更新 CSS 变量
    if (config.primaryColor) {
      applyThemeColor(config.primaryColor);
    }
  }

  // 更新主题色 CSS 变量
  function updateColorVariables(color: string) {
    applyThemeColor(color);
  }

  // 展开/收起菜单
  function toggleOpenKey(key: string) {
    const index = openKeys.value.indexOf(key);
    if (index > -1) {
      openKeys.value.splice(index, 1);
    } else {
      openKeys.value.push(key);
    }
  }

  // 展开菜单（用于 hover）
  function openKey(key: string) {
    if (!openKeys.value.includes(key)) {
      openKeys.value.push(key);
    }
  }

  // 关闭所有菜单（用于 hover 离开）
  function closeAllKeys() {
    openKeys.value = [];
  }

  // 重置菜单状态
  function resetState() {
    openKeys.value = [];
    selectedKey.value = '';
    tabsList.value = [];
    siderCollapsed.value = false;
  }

  // 查找菜单项
  function findMenuByKey(menu: MenuItem[], key: string): MenuItem | undefined {
    for (const item of menu) {
      if (item.key === key) return item;
      if (item.children) {
        const found = findMenuByKey(item.children, key);
        if (found) return found;
      }
    }
    return undefined;
  }

  // 查找菜单父级
  function findMenuParent(menu: MenuItem[], path: string): MenuItem | undefined {
    for (const item of menu) {
      if (item.children?.some(c => c.path === path)) return item;
      if (item.children) {
        const found = findMenuParent(item.children, path);
        if (found) return found;
      }
    }
    return undefined;
  }

  // 查找所有父级
  function findAllParents(
    menu: MenuItem[],
    path: string,
    visited: Set<string> = new Set()
  ): MenuItem[] {
    // 防止循环引用
    if (visited.has(path)) return [];

    const result: MenuItem[] = [];
    for (const item of menu) {
      if (item.path === path) {
        return result;
      }
      if (item.children) {
        visited.add(item.path);
        const found = findAllParents(item.children, path, visited);
        if (found.length >= 0) {
          // 如果找到或者还需要继续查找
          if (item.children.some(c => c.path === path)) {
            return [item, ...result];
          }
          if (found.length > 0) {
            return [item, ...found];
          }
        }
      }
    }
    return result;
  }

  return {
    menuList,
    openKeys,
    selectedKey,
    tabsList,
    theme,
    menuConfig,
    siderCollapsed,
    breadcrumbs,
    setMenuFromRoutes,
    setSelectedKey,
    addTab,
    removeTab,
    setSiderCollapsed,
    toggleSider,
    toggleDarkMode,
    setTheme,
    updateColorVariables,
    toggleOpenKey,
    openKey,
    closeAllKeys,
    resetState,
  };
});
