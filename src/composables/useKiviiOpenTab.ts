/**
 * Kivii OpenTab Composable
 *
 * 统一管理标签页打开功能，支持：
 * - 外部 URL：使用 window.open
 * - 内部路径：通过 kivii.openTab 或 router.push
 */

import { useRouter } from 'vue-router'
import { useMenuStore } from '@/layouts/modules/global-menu/store'
import type { MenuItem } from '@/layouts/modules/global-menu/types'

/**
 * 打开选项
 */
export interface OpenTabOptions {
  /** 是否在新窗口打开（仅外部链接有效） */
  newTab?: boolean
  /** 是否激活已存在的标签（默认 true） */
  activateExisting?: boolean
}

/**
 * 路径信息
 */
interface PathInfo {
  key: string
  path: string
  title?: string
  icon?: string
  kvid?: string
  url?: string
  type?: 'webview' | 'extjs' | 'vue'
}

/**
 * 检查 kivii 是否可用
 */
function isKiviiAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).kivii
}

/**
 * 判断是否为外部 URL
 */
function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

/**
 * 标准化路径
 */
function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  // 移除查询参数和 hash
  return path.split('?')[0].split('#')[0]
}

/**
 * 使用 Kivii OpenTab
 */
export function useKiviiOpenTab() {
  const router = useRouter()
  const menuStore = useMenuStore()

  /**
   * 打开 URL 或路径
   */
  async function openTab(url: string, options?: OpenTabOptions): Promise<boolean> {
    try {
      // 外部链接
      if (isExternalUrl(url)) {
        if (options?.newTab) {
          window.open(url, '_blank', 'noopener,noreferrer')
        } else {
          window.open(url, '_blank', 'noopener,noreferrer')
        }
        return true
      }

      // 内部路径
      return openPath(url, options)
    } catch (error) {
      console.error('[useKiviiOpenTab] 打开失败:', error)
      return false
    }
  }

  /**
   * 打开内部路径
   */
  async function openPath(path: string, options?: OpenTabOptions): Promise<boolean> {
    try {
      const normalizedPath = normalizePath(path)

      // 尝试使用 kivii.openTab
      if (isKiviiAvailable()) {
        const result = await (window as any).kivii.openTab.open(normalizedPath, options)
        if (result) {
          return true
        }
        // 如果 kivii 返回 false，继续使用 router
      }

      // 回退到路由跳转
      const pathInfo = findPathInfo(normalizedPath)
      if (pathInfo) {
        const tab: MenuItem = {
          key: pathInfo.key,
          path: pathInfo.path,
          title: pathInfo.title || '未命名页面',
          icon: pathInfo.icon || 'fa-file',
          children: [],
        }
        // 存储额外信息到 meta
        if (pathInfo.kvid || pathInfo.url || pathInfo.type) {
          (tab as any).meta = {
            kvid: pathInfo.kvid,
            url: pathInfo.url,
            type: pathInfo.type,
          }
        }
        menuStore.addTab(tab)
      }

      router.push(normalizedPath)
      return true
    } catch (error) {
      console.error('[useKiviiOpenTab] 打开路径失败:', error)
      return false
    }
  }

  /**
   * 通过 kvid 打开
   */
  async function openByKvid(kvid: string, options?: OpenTabOptions): Promise<boolean> {
    try {
      const pathInfo = findPathInfoByKvid(kvid)

      if (!pathInfo?.path) {
        console.warn('[useKiviiOpenTab] 未找到 kvid 对应的路径:', kvid)
        return false
      }

      return openPath(pathInfo.path, options)
    } catch (error) {
      console.error('[useKiviiOpenTab] 打开 kvid 失败:', error)
      return false
    }
  }

  /**
   * 打开菜单项
   */
  async function openMenuItem(item: MenuItem, options?: OpenTabOptions): Promise<boolean> {
    if (!item.path) {
      console.warn('[useKiviiOpenTab] 菜单项缺少 path:', item)
      return false
    }
    return openPath(item.path, options)
  }

  /**
   * 查找路径信息
   */
  function findPathInfo(path: string): PathInfo | null {
    const findInMenu = (items: MenuItem[]): PathInfo | null => {
      for (const item of items) {
        if (item.path === path) {
          const meta = (item as any).meta || {}
          return {
            key: item.key,
            path: item.path,
            title: item.title,
            icon: item.icon,
            kvid: meta.kvid,
            url: meta.url,
            type: getPageType(item),
          }
        }
        if (item.children?.length) {
          const found = findInMenu(item.children)
          if (found) return found
        }
      }
      return null
    }

    return findInMenu(menuStore.menuList)
  }

  /**
   * 通过 kvid 查找路径信息
   */
  function findPathInfoByKvid(kvid: string): PathInfo | null {
    const findInMenu = (items: MenuItem[]): PathInfo | null => {
      for (const item of items) {
        const meta = (item as any).meta || {}
        if (meta.kvid === kvid || item.key === kvid) {
          return {
            key: item.key,
            path: item.path,
            title: item.title,
            icon: item.icon,
            kvid: meta.kvid,
            url: meta.url,
            type: getPageType(item),
          }
        }
        if (item.children?.length) {
          const found = findInMenu(item.children)
          if (found) return found
        }
      }
      return null
    }

    return findInMenu(menuStore.menuList)
  }

  /**
   * 获取页面类型
   */
  function getPageType(item: MenuItem): 'webview' | 'extjs' | 'vue' {
    const meta = (item as any).meta || {}
    const functionKvid = meta.url || ''
    if (functionKvid.startsWith('ExtJS.')) {
      return 'extjs'
    }
    if (functionKvid.endsWith('.vue')) {
      return 'vue'
    }
    return 'webview'
  }

  return {
    openTab,
    openPath,
    openByKvid,
    openMenuItem,
    findPathInfo,
    findPathInfoByKvid,
  }
}
