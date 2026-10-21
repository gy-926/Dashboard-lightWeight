import { createApp, h } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory, RouterView } from 'vue-router';

export async function mountAuthApp() {
  const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
      { path: '/login', component: () => import('@/views/login/index.vue') },
      { path: '/update-password', component: () => import('@/views/login/update-password.vue') },
    ],
  });

  // 在轻量认证入口手动访问业务地址时，交给完整入口恢复会话和加载工作台。
  router.beforeEach(to => {
    if (to.path === '/login' || to.path === '/update-password') return true;
    const url = new URL(window.location.href);
    url.hash = to.fullPath;
    window.history.replaceState(window.history.state, '', url);
    window.location.reload();
    return false;
  });

  const app = createApp({ render: () => h(RouterView) });
  app.use(createPinia());
  app.use(router);
  await router.isReady();
  app.mount('#app');
}
