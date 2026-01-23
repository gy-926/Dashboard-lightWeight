import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MenuItem, ThemeConfig, MenuConfig } from './types'
import { transformRouteToMenu } from './types'

export const useMenuStore = defineStore('menu', () => {
  // 菜单列表
  const menuList = ref<MenuItem[]>([])
  // 展开的菜单 keys
  const openKeys = ref<string[]>([])
  // 选中的菜单 key
  const selectedKey = ref<string>('')
  // 标签页列表
  const tabsList = ref<MenuItem[]>([])
  // 主题配置
  const theme = ref<ThemeConfig>({
    layout: 'side',
    primaryColor: '#3b82f6',
    darkMode: false,
    siderWidth: 220,
    showTabs: true,
    showBreadcrumb: true,
    showFooter: false,
  })
  // 菜单配置
  const menuConfig = ref<MenuConfig>({
    showFullPath: false,
    accordion: true,
    defaultOpenKeys: [],
    defaultSelectedKey: '',
    collapsed: false,
  })
  // 侧边栏折叠状态
  const siderCollapsed = ref(false)

  // 计算面包屑
  const breadcrumbs = computed(() => {
    const selectedMenu = findMenuByKey(menuList.value, selectedKey.value)
    if (!selectedMenu) return []

    const breads: MenuItem[] = []
    breads.push(selectedMenu)

    let parent = findMenuParent(menuList.value, selectedMenu.path)
    while (parent) {
      breads.unshift(parent)
      parent = findMenuParent(menuList.value, parent.path)
    }

    return breads
  })

  // 设置路由转换的菜单
  function setMenuFromRoutes(routes: any[]) {
    menuList.value = transformRouteToMenu(routes)
  }

  // 设置选中的菜单
  function setSelectedKey(path: string) {
    selectedKey.value = path
    // 自动展开父级
    const parents = findAllParents(menuList.value, path)
    openKeys.value = parents.map(p => p.key)
  }

  // 添加标签页
  function addTab(menu: MenuItem) {
    const exists = tabsList.value.find(t => t.path === menu.path)
    if (!exists) {
      tabsList.value.push({ ...menu })
    }
  }

  // 移除标签页
  function removeTab(path: string) {
    const index = tabsList.value.findIndex(t => t.path === path)
    if (index > -1) {
      tabsList.value.splice(index, 1)
    }
  }

  // 设置侧边栏折叠
  function setSiderCollapsed(collapsed: boolean) {
    siderCollapsed.value = collapsed
  }

  // 切换侧边栏折叠
  function toggleSider() {
    siderCollapsed.value = !siderCollapsed.value
  }

  // 切换主题
  function toggleDarkMode() {
    theme.value.darkMode = !theme.value.darkMode
    if (theme.value.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // 更新主题配置
  function setTheme(config: Partial<ThemeConfig>) {
    theme.value = { ...theme.value, ...config }
  }

  // 展开/收起菜单
  function toggleOpenKey(key: string) {
    const index = openKeys.value.indexOf(key)
    if (index > -1) {
      openKeys.value.splice(index, 1)
    } else {
      openKeys.value.push(key)
    }
  }

  // 重置菜单状态
  function resetState() {
    openKeys.value = []
    selectedKey.value = ''
    tabsList.value = []
    siderCollapsed.value = false
  }

  // 查找菜单项
  function findMenuByKey(menu: MenuItem[], key: string): MenuItem | undefined {
    for (const item of menu) {
      if (item.key === key) return item
      if (item.children) {
        const found = findMenuByKey(item.children, key)
        if (found) return found
      }
    }
    return undefined
  }

  // 查找菜单父级
  function findMenuParent(menu: MenuItem[], path: string): MenuItem | undefined {
    for (const item of menu) {
      if (item.children?.some(c => c.path === path)) return item
      if (item.children) {
        const found = findMenuParent(item.children, path)
        if (found) return found
      }
    }
    return undefined
  }

  // 查找所有父级
  function findAllParents(menu: MenuItem[], path: string, visited: Set<string> = new Set()): MenuItem[] {
    // 防止循环引用
    if (visited.has(path)) return []

    const result: MenuItem[] = []
    for (const item of menu) {
      if (item.path === path) {
        return result
      }
      if (item.children) {
        visited.add(item.path)
        const found = findAllParents(item.children, path, visited)
        if (found.length >= 0) {
          // 如果找到或者还需要继续查找
          if (item.children.some(c => c.path === path)) {
            return [item, ...result]
          }
          if (found.length > 0) {
            return [item, ...found]
          }
        }
      }
    }
    return result
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
    toggleOpenKey,
    resetState,
  }
})
