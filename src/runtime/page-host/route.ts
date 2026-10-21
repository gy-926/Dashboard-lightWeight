import type { RouteLocationNormalized } from 'vue-router';
import type { PageHostPilotRoute } from './pilot-store';
import type { PageIdentityQuery } from './types';

/** 守卫和永久宿主共用同一页面身份，容量判断与实际创建保持一致。 */
export function toPageHostRoute(route: Pick<RouteLocationNormalized, 'path' | 'name' | 'meta' | 'query'>): PageHostPilotRoute {
  const query = Object.entries(route.query).reduce<PageIdentityQuery>((result, [key, value]) => {
    result[key] = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : value;
    return result;
  }, {});
  return {
    path: route.path,
    name: route.name,
    kvid: (typeof route.meta.kvid === 'string' && route.meta.kvid) ||
      (typeof route.query.kvid === 'string' && route.query.kvid) || undefined,
    query,
    handler: typeof route.meta.pageHandler === 'string' ? route.meta.pageHandler : undefined,
    handlerResolved: route.meta.pageHandlerResolved === true,
    scriptPath: typeof route.meta.pageScriptPath === 'string' ? route.meta.pageScriptPath : undefined,
  };
}
