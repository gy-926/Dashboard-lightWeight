import { createRouter, createWebHistory } from 'vue-router'
import autoRoutes from './auto/routes'
import { setupRouteGuards } from './guards'

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: autoRoutes
})

// 设置路由守卫
setupRouteGuards(router)

export default router
