import '@/styles/tailwind.css'
import '@/styles/fontawesome.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import * as LayoutComponents from '@/layouts/modules'

const app = createApp(App)

// 注册布局全局组件
for (const [key, component] of Object.entries(LayoutComponents)) {
  if (component) {
    app.component(key, component)
  }
}

// 安装 Pinia
const pinia = createPinia()
app.use(pinia)

// 安装路由
app.use(router)

app.mount('#app')
