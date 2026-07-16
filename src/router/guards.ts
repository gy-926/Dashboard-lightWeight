import type { Router } from 'vue-router';
import { waitForRoutesReady, isDynamicRoutesReady, setTargetNavigation } from './index';
import { getGlobalConfig, syncInternalCodeToEntryPath } from '@/router/routes';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 配置 NProgress
NProgress.configure({ showSpinner: false });

// 路由守卫配置
const guardsConfig = {
  enabled: true,
  defaultTitle: 'GavinYin Hub',
};

export function setupRouteGuards(router: Router) {
  if (!guardsConfig.enabled) {
    return;
  }

  router.beforeEach(async (to, _from, next) => {
    // 开始进度条
    NProgress.start();

    // 根据主题配置动态修改进度条颜色
    try {
      const savedTheme = localStorage.getItem('kivii-theme');
      if (savedTheme) {
        const theme = JSON.parse(savedTheme);
        if (theme.primaryColor) {
          const root = document.documentElement;
          root.style.setProperty('--nprogress-color', theme.primaryColor);
        }
      }
    } catch (e) {
      // ignore
    }
    const config = getGlobalConfig();
    syncInternalCodeToEntryPath(config.InternalCode);
    const loginPaths = ['/login', '/SpringLogin'];

    // 如果未登录且当前访问的不是登录页面
    if (!config.IsAuthenticated && !loginPaths.includes(to.path)) {
      // 1. 如果配置了公共登录页（PublicLoginUrl），则跳往公共登录页
      if (config.PublicLoginUrl) {
        // 构造带回跳地址的公共登录页 URL，便于公共登录成功后能跳回本系统
        const redirectUrl = encodeURIComponent(window.location.href);
        const targetUrl = config.PublicLoginUrl.includes('?')
          ? `${config.PublicLoginUrl}&redirect=${redirectUrl}`
          : `${config.PublicLoginUrl}?redirect=${redirectUrl}`;

        window.location.href = targetUrl;
        return;
      }

      // 2. 否则按原有流程，跳转到系统自带的登录页
      next('/login');
      return;
    }

    if (!isDynamicRoutesReady()) {
      let targetPath = to.path;
      const hash = window.location.hash;
      if (hash && hash.startsWith('#/') && hash.length > 2) {
        targetPath = hash.substring(1);
      }
      setTargetNavigation(targetPath);
    }

    if (loginPaths.includes(to.path)) {
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

    const menuStoreModule = await import('@/layouts/modules/global-menu/store');
    const menuStore = (menuStoreModule as any).useMenuStore?.();
    if (!menuStore) {
      next();
      return;
    }

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

  router.afterEach(() => {
    // 路由切换完成后的处理
    NProgress.done();
  });
}

export { guardsConfig };
