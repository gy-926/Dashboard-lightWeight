import { defineStore } from 'pinia';
import { ref, computed, markRaw } from 'vue';

export type PageType = 'webview' | 'vue' | 'umd';

export interface PageInfo {
  id: string;
  type: PageType;
  url: string;
  kvid?: string;
  status: 'pending' | 'loading' | 'ready' | 'active' | 'hidden';
  createdAt: number;
  activatedAt?: number;
}

export interface TeleportManagerState {
  pages: Map<string, PageInfo>;
  activePageId: string | null;
  activationQueue: Map<string, number>;
  activationLock: boolean;
  vueComponentCache: Map<string, any>;
  vueComponentLoading: Map<string, Promise<any>>;
}

// 生成唯一页面实例 ID
export function generatePageId(url: string, kvid: string, type: PageType): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const encodedUrl = encodeURIComponent(url.slice(0, 50));
  return `${type}_${encodedUrl}_${kvid || 'default'}_${timestamp}_${random}`;
}

// 生成 Vue 组件缓存键（用于 keep-alive 保持组件状态）
export function generateComponentCacheKey(
  url: string,
  kvid: string,
  backendOrigin?: string
): string {
  const origin = backendOrigin || '';
  const fullUrl = /^https?:\/\//i.test(url) ? url : `${origin}${url}`;
  return `vue_component::${fullUrl}::${kvid || ''}`;
}

export const useTeleportManager = defineStore('teleport-manager', () => {
  const pages = ref<Map<string, PageInfo>>(new Map());
  const activePageId = ref<string | null>(null);
  const activationQueue = ref<Map<string, number>>(new Map());
  const activationLock = ref(false);

  // Vue 组件全局缓存（用于 keep-alive 保持组件状态）
  const vueComponentCache = ref<Map<string, any>>(new Map());
  const vueComponentLoading = ref<Map<string, Promise<any>>>(new Map());
  const vueComponentGenerations = new Map<string, number>();

  // 防抖激活请求
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const allPages = computed(() => Array.from(pages.value.values()));

  const activePage = computed(() => {
    if (!activePageId.value) return null;
    return pages.value.get(activePageId.value) || null;
  });

  const visiblePages = computed(() => {
    if (!activePageId.value) return [];
    return allPages.value.filter(p => p.status === 'active' || p.id === activePageId.value);
  });

  // Vue 组件缓存操作
  function getVueComponent(cacheKey: string): any | undefined {
    return vueComponentCache.value.get(cacheKey);
  }

  function getVueComponentGeneration(cacheKey: string): number {
    return vueComponentGenerations.get(cacheKey) || 0;
  }

  function isVueComponentGenerationCurrent(cacheKey: string, generation: number): boolean {
    return getVueComponentGeneration(cacheKey) === generation;
  }

  function setVueComponent(cacheKey: string, component: any, generation?: number): boolean {
    if (generation !== undefined && !isVueComponentGenerationCurrent(cacheKey, generation)) {
      return false;
    }
    vueComponentCache.value.set(cacheKey, component);
    return true;
  }

  function hasVueComponent(cacheKey: string): boolean {
    return vueComponentCache.value.has(cacheKey);
  }

  function getVueComponentLoading(cacheKey: string): Promise<any> | undefined {
    return vueComponentLoading.value.get(cacheKey);
  }

  function setVueComponentLoading(cacheKey: string, promise: Promise<any>): void {
    // Promise 不需要响应式代理；保留原始身份，才能区分旧任务与重新打开后的新任务
    vueComponentLoading.value.set(cacheKey, markRaw(promise));
  }

  function deleteVueComponentLoading(cacheKey: string, promise?: Promise<any>): void {
    if (promise && vueComponentLoading.value.get(cacheKey) !== promise) {
      return;
    }
    vueComponentLoading.value.delete(cacheKey);
  }

  function clearVueComponentCache(): void {
    const keys = new Set([
      ...vueComponentCache.value.keys(),
      ...vueComponentLoading.value.keys(),
    ]);
    keys.forEach(removeVueComponentCacheEntry);
  }

  function parseVueComponentCacheKey(key: string): { fullUrl: string; kvid: string } | null {
    const prefix = 'vue_component::';
    if (!key.startsWith(prefix)) return null;

    const value = key.slice(prefix.length);
    const lastSeparator = value.lastIndexOf('::');
    if (lastSeparator < 0) return null;

    return {
      fullUrl: value.slice(0, lastSeparator),
      kvid: value.slice(lastSeparator + 2),
    };
  }

  function removeVueComponentCacheEntry(key: string): void {
    vueComponentGenerations.set(key, getVueComponentGeneration(key) + 1);

    const cached = vueComponentCache.value.get(key);
    if (cached && Array.isArray(cached.styles)) {
      cached.styles.forEach((style: HTMLStyleElement) => style.remove());
    }

    vueComponentCache.value.delete(key);
    vueComponentLoading.value.delete(key);
  }

  // 根据标签身份移除组件缓存；没有 kvid 时才使用路径兼容匹配
  function removeComponentCacheByPath(path: string, kvid?: string): void {
    const targetKvid = kvid || '';
    const keys = new Set([
      ...vueComponentCache.value.keys(),
      ...vueComponentLoading.value.keys(),
    ]);

    keys.forEach(key => {
      const parsed = parseVueComponentCacheKey(key);
      if (!parsed) return;

      const isMatch = targetKvid
        ? parsed.kvid === targetKvid
        : path.includes(parsed.fullUrl) ||
          path.includes(encodeURIComponent(parsed.fullUrl)) ||
          parsed.fullUrl.includes(path) ||
          (!!parsed.kvid && parsed.kvid.length > 8 && path.includes(parsed.kvid));

      if (isMatch) {
        removeVueComponentCacheEntry(key);
      }
    });
  }

  function registerPage(id: string, type: PageType, url: string, kvid?: string): void {
    const page: PageInfo = {
      id,
      type,
      url,
      kvid,
      status: 'pending',
      createdAt: Date.now(),
    };
    pages.value.set(id, page);
  }

  function unregisterPage(id: string): void {
    pages.value.delete(id);
    activationQueue.value.delete(id);
    if (activePageId.value === id) {
      activePageId.value = null;
    }
  }

  function getPage(id: string): PageInfo | undefined {
    return pages.value.get(id);
  }

  function updatePageStatus(id: string, status: PageInfo['status']): void {
    const page = pages.value.get(id);
    if (page) {
      page.status = status;
      if (status === 'active') {
        page.activatedAt = Date.now();
        activePageId.value = id;
      }
    }
  }

  function requestActivation(id: string): void {
    // 添加到队列
    const count = activationQueue.value.get(id) || 0;
    activationQueue.value.set(id, count + 1);

    // 清除之前的防抖定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // 防抖执行
    debounceTimer = setTimeout(() => {
      performActivation();
    }, 50);
  }

  function debouncedRequestActivation(id: string): void {
    requestActivation(id);
  }

  function performActivation(): void {
    if (activationLock.value) return;

    // 找到队列中请求次数最多的页面
    let maxCount = 0;
    let targetId: string | null = null;

    activationQueue.value.forEach((count, id) => {
      const page = pages.value.get(id);
      if (page && count > maxCount) {
        maxCount = count;
        targetId = id;
      }
    });

    if (targetId && maxCount > 0) {
      activationLock.value = true;

      // 将所有页面设置为 hidden
      pages.value.forEach((page, id) => {
        if (id !== targetId) {
          page.status = 'hidden';
        }
      });

      // 激活目标页面
      const targetPage = pages.value.get(targetId!);
      if (targetPage) {
        targetPage.status = 'active';
        targetPage.activatedAt = Date.now();
        activePageId.value = targetId;
      }

      // 清除队列
      activationQueue.value.clear();
      activationLock.value = false;
    }
  }

  // 强制立即激活（跳过防抖队列），用于 Tab 切换等明确的用户交互
  function forceActivate(id: string): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    activationQueue.value.clear();

    // 更新状态
    pages.value.forEach((page, pid) => {
      if (pid !== id) {
        page.status = 'hidden';
      }
    });

    const targetPage = pages.value.get(id);
    if (targetPage) {
      targetPage.status = 'active';
      targetPage.activatedAt = Date.now();
      activePageId.value = id;
    }
  }

  // 隐藏所有页面（用于切换到非动态路由时）
  function hideAllPages(): void {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    activationQueue.value.clear();

    pages.value.forEach(page => {
      page.status = 'hidden';
    });
    activePageId.value = null;
  }

  function shouldShowPage(id: string): boolean {
    const page = pages.value.get(id);
    if (!page) return false; // 未注册的页面默认不显示（防止残留组件显示）
    // 显示：pending(等待中)、loading(加载中)、ready(就绪)、active(激活中)
    // 不显示：hidden(已隐藏)
    return page.status !== 'hidden';
  }

  function getActivePage(): PageInfo | null {
    return activePage.value;
  }

  function cleanup(): void {
    pages.value.clear();
    activationQueue.value.clear();
    activePageId.value = null;
    activationLock.value = false;
    // 不清除组件缓存（保持状态）
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  }

  // 清理与当前用户会话绑定的页面运行时；UMD 等应用级库资源不在此处卸载
  function clearUserRuntime(): void {
    cleanup();
    clearVueComponentCache();
  }

  return {
    pages,
    activePageId,
    allPages,
    activePage,
    visiblePages,
    activationLock,
    vueComponentCache,
    vueComponentLoading,
    registerPage,
    unregisterPage,
    getPage,
    updatePageStatus,
    requestActivation,
    debouncedRequestActivation,
    forceActivate,
    hideAllPages,
    shouldShowPage,
    getActivePage,
    getVueComponent,
    getVueComponentGeneration,
    isVueComponentGenerationCurrent,
    setVueComponent,
    hasVueComponent,
    getVueComponentLoading,
    setVueComponentLoading,
    deleteVueComponentLoading,
    clearVueComponentCache,
    removeComponentCacheByPath,
    cleanup,
    clearUserRuntime,
  };
});
