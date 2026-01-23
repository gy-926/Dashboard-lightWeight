import type { Router } from 'vue-router'

// 路由守卫配置
const guardsConfig = {
  enabled: true,
  defaultTitle: "",
}

export function setupRouteGuards(router: Router) {
  if (!guardsConfig.enabled) {
    return
  }
  
  router.beforeEach((to, from, next) => {
    // 设置页面标题
    const title = to.meta?.title as string || guardsConfig.defaultTitle
    if (title) {
      document.title = title
    }
    
    // 这里可以根据需要添加自定义的路由守卫逻辑
    // 例如：检查 to.meta?.params 中的自定义参数
    
    next()
  })
  
  router.afterEach((to, from) => {
    // 路由切换完成后的处理
    console.log(`Route changed from ${from.path} to ${to.path}`)
    
    // 可以在这里处理页面分析、埋点等
    if (to.meta?.title) {
      console.log(`Page title set to: ${to.meta.title}`)
    }
  })
}

export { guardsConfig }
