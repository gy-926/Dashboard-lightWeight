import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type PageType = 'webview' | 'vue'

export interface PageInfo {
  id: string
  type: PageType
  url: string
  kvid?: string
  status: 'pending' | 'loading' | 'ready' | 'active' | 'hidden'
  createdAt: number
  activatedAt?: number
}

export interface TeleportManagerState {
  pages: Map<string, PageInfo>
  activePageId: string | null
  activationQueue: Map<string, number>
  activationLock: boolean
}

// 生成唯一页面实例 ID
export function generatePageId(url: string, kvid: string, type: PageType): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const encodedUrl = encodeURIComponent(url.slice(0, 50))
  return `${type}_${encodedUrl}_${kvid || 'default'}_${timestamp}_${random}`
}

export const useTeleportManager = defineStore('teleport-manager', () => {
  const pages = ref<Map<string, PageInfo>>(new Map())
  const activePageId = ref<string | null>(null)
  const activationQueue = ref<Map<string, number>>(new Map())
  const activationLock = ref(false)

  // 防抖激活请求
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const allPages = computed(() => Array.from(pages.value.values()))

  const activePage = computed(() => {
    if (!activePageId.value) return null
    return pages.value.get(activePageId.value) || null
  })

  const visiblePages = computed(() => {
    if (!activePageId.value) return []
    return allPages.value.filter(p => p.status === 'active' || p.id === activePageId.value)
  })

  function registerPage(id: string, type: PageType, url: string, kvid?: string): void {
    const page: PageInfo = {
      id,
      type,
      url,
      kvid,
      status: 'pending',
      createdAt: Date.now(),
    }
    pages.value.set(id, page)
  }

  function unregisterPage(id: string): void {
    pages.value.delete(id)
    activationQueue.value.delete(id)
    if (activePageId.value === id) {
      activePageId.value = null
    }
  }

  function getPage(id: string): PageInfo | undefined {
    return pages.value.get(id)
  }

  function updatePageStatus(id: string, status: PageInfo['status']): void {
    const page = pages.value.get(id)
    if (page) {
      page.status = status
      if (status === 'active') {
        page.activatedAt = Date.now()
        activePageId.value = id
      }
    }
  }

  function requestActivation(id: string): void {
    // 添加到队列
    const count = activationQueue.value.get(id) || 0
    activationQueue.value.set(id, count + 1)

    // 清除之前的防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // 防抖执行
    debounceTimer = setTimeout(() => {
      performActivation()
    }, 50)
  }

  function debouncedRequestActivation(id: string): void {
    requestActivation(id)
  }

  function performActivation(): void {
    if (activationLock.value) return

    // 找到队列中请求次数最多的页面
    let maxCount = 0
    let targetId: string | null = null

    activationQueue.value.forEach((count, id) => {
      const page = pages.value.get(id)
      if (page && count > maxCount) {
        maxCount = count
        targetId = id
      }
    })

    if (targetId && maxCount > 0) {
      activationLock.value = true

      // 将所有页面设置为 hidden
      pages.value.forEach((page, id) => {
        if (id !== targetId) {
          page.status = 'hidden'
        }
      })

      // 激活目标页面
      const targetPage = pages.value.get(targetId!)
      if (targetPage) {
        targetPage.status = 'active'
        targetPage.activatedAt = Date.now()
        activePageId.value = targetId
      }

      // 清除队列
      activationQueue.value.clear()
      activationLock.value = false
    }
  }

  function shouldShowPage(id: string): boolean {
    const page = pages.value.get(id)
    if (!page) return true // 未注册的页面默认显示（避免渲染空白）
    // 显示：pending(等待中)、loading(加载中)、ready(就绪)、active(激活中)
    // 不显示：hidden(已隐藏)
    return page.status !== 'hidden'
  }

  function getActivePage(): PageInfo | null {
    return activePage.value
  }

  function cleanup(): void {
    pages.value.clear()
    activationQueue.value.clear()
    activePageId.value = null
    activationLock.value = false
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }

  return {
    pages,
    activePageId,
    allPages,
    activePage,
    visiblePages,
    activationLock,
    registerPage,
    unregisterPage,
    getPage,
    updatePageStatus,
    requestActivation,
    debouncedRequestActivation,
    shouldShowPage,
    getActivePage,
    cleanup,
  }
})
