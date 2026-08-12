export interface PageRouteLike {
  path?: string;
  name?: string | symbol | null;
  meta?: Record<PropertyKey, unknown>;
}

/**
 * 判断路由是否由动态页面承载层渲染。
 *
 * 后端菜单路由以 meta.type 标记页面类型；custom/bridge 和内置 iframe
 * 路由保留路径、名称兼容判断，避免旧入口缺少 meta 时误入 KeepAlive。
 */
export function isDynamicPageRoute(route: PageRouteLike): boolean {
  const path = route.path || '';
  const name = String(route.name || '');

  return (
    route.meta?.type === 'iframe' ||
    path.startsWith('/custom_') ||
    path.startsWith('/bridge_') ||
    name.startsWith('iframe-page')
  );
}

/**
 * 判断动态页面是否绕过 router-view 的 KeepAlive。
 *
 * 后端 KVID 页面需要保留表单等实例状态，因此不在这里排除；旧的 custom、
 * bridge 和内置 iframe 入口维持原有行为，直到统一 PageHost 接管实例生命周期。
 */
export function shouldBypassRouteKeepAlive(route: PageRouteLike): boolean {
  const path = route.path || '';
  const name = String(route.name || '');

  return (
    path.startsWith('/custom_') ||
    path.startsWith('/bridge_') ||
    name.startsWith('iframe-page')
  );
}
