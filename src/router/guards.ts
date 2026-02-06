import type { Router } from 'vue-router'
import { waitForRoutesReady, isDynamicRoutesReady, setTargetNavigation } from './index'

// 路由守卫配置
const guardsConfig = {
  enabled: true,
  defaultTitle: 'Kivii Admin',
}

export function setupRouteGuards(router: Router) {
  if (!guardsConfig.enabled) {
    return
  }

  router.beforeEach(async (to, from, next) => {
    // 保存目标导航路径（用于刷新时恢复）
    // 优先使用 window.location.hash 获取正确的路径，因为 to.path 可能已经是 /404
    if (!isDynamicRoutesReady()) {
      let targetPath = to.path
      // 从 hash 中提取路径（去掉 #）
      const hash = window.location.hash
      if (hash && hash.startsWith('#/') && hash.length > 2) {
        targetPath = hash.substring(1) // 去掉 #
      }
      console.log(`[Guards] 保存目标路径: ${targetPath}, to.path: ${to.path}`)
      setTargetNavigation(targetPath)
    }

    // 跳过登录页、404 等特殊页面，避免循环刷新
    if (to.path === '/login' || to.path === '/404' || to.path.startsWith('/:pathMatch')) {
      return next()
    }

    // 等待动态路由加载完成后再处理导航
    if (!isDynamicRoutesReady()) {
      console.log(`[Guards] 等待动态路由加载... 当前导航: ${to.path}`)
      await waitForRoutesReady()
      console.log(`[Guards] 动态路由已加载，继续导航: ${to.path}`)
    }

    // 设置页面标题
    const title = to.meta?.title as string || guardsConfig.defaultTitle
    if (title) {
      document.title = title
    }

    // 延迟导入 store，确保 Pinia 已安装
    const { useMenuStore } = await import('@/layouts/modules/global-menu/store')
    const menuStore = useMenuStore()

    // 设置当前选中的菜单
    menuStore.setSelectedKey(to.path)

    // 添加到标签页
    const menuItem = {
      key: to.name as string || to.path,
      path: to.path,
      title: title,
      icon: to.meta?.icon as string,
    }
    menuStore.addTab(menuItem)

    next()
  })

  router.afterEach((to, from) => {
    // 路由切换完成后的处理
    console.log(`Route changed from ${from.path} to ${to.path}`)
  })
}

export { guardsConfig }
