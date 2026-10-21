import '@/styles/tailwind.css';
import { refreshAuth } from '@/api/nest-client';

async function bootstrap() {
  const requestedRoute = window.location.hash.slice(1) || '/';
  const path = requestedRoute.split('?')[0];

  // 认证页面独立启动，不导入工作台、动态页面宿主或业务组件资源。
  if (path === '/login' || path === '/update-password') {
    const { mountAuthApp } = await import('./bootstrap/auth');
    await mountAuthApp();
    return;
  }

  if (await refreshAuth()) {
    await import('./bootstrap/workspace');
    return;
  }

  const publicLoginUrl = window.uiGlobalConfig?.PublicLoginUrl;
  if (publicLoginUrl) {
    const separator = publicLoginUrl.includes('?') ? '&' : '?';
    window.location.replace(`${publicLoginUrl}${separator}redirect=${encodeURIComponent(window.location.href)}`);
    return;
  }

  const url = new URL(window.location.href);
  url.hash = `/login?redirect=${encodeURIComponent(requestedRoute)}`;
  window.history.replaceState(window.history.state, '', url);
  const { mountAuthApp } = await import('./bootstrap/auth');
  await mountAuthApp();
}

void bootstrap();
