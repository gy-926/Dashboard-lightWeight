import type { Router } from 'vue-router'

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
    // 设置页面标题
    const title = to.meta?.title as string || guardsConfig.defaultTitle
    if (title) {
      document.title = title
    }

    // 跳过登录页、404 等特殊页面，避免循环刷新
    if (to.path === '/login' || to.path === '/404' || to.path.startsWith('/:pathMatch')) {
      return next()
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
