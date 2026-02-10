import type { Router } from 'vue-router';
import { waitForRoutesReady, isDynamicRoutesReady, setTargetNavigation } from './index';

// 路由守卫配置
const guardsConfig = {
  enabled: true,
  defaultTitle: 'Kivii Admin',
};

export function setupRouteGuards(router: Router) {
  if (!guardsConfig.enabled) {
    return;
  }

  router.beforeEach(async (to, from, next) => {
    if (!isDynamicRoutesReady()) {
      let targetPath = to.path;
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/') && hash.length > 2) {
        targetPath = hash.substring(1);
      }
      setTargetNavigation(targetPath);
    }

    if (to.path === '/login') {
      return next();
    }

    if ((to.path === '/404' || to.path.startsWith('/:pathMatch')) && !isDynamicRoutesReady()) {
      let targetPath = '/';
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/') && hash.length > 2) {
        targetPath = hash.substring(1);
      }
      setTargetNavigation(targetPath);
      await waitForRoutesReady();
      return next(targetPath);
    }

    if (!isDynamicRoutesReady()) {
      await waitForRoutesReady();
    }

    const title = (to.meta?.title as string) || guardsConfig.defaultTitle;
    if (title) {
      document.title = title;
    }

    const { useMenuStore } = await import('@/layouts/modules/global-menu/store');
    const menuStore = useMenuStore();

    menuStore.setSelectedKey(to.path);

    const menuItem = {
      key: (to.name as string) || to.path,
      path: to.path,
      title: title,
      icon: to.meta?.icon as string,
    };
    menuStore.addTab(menuItem);

    next();
  });

  router.afterEach((to, from) => {
    // 路由切换完成后的处理

  });
}

export { guardsConfig };
