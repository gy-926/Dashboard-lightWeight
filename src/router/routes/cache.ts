// 兼容清理旧版本遗留数据；当前路由每次根据服务端菜单重新生成，不再读写缓存。
export function clearDynamicRoutesCache(): void {
  localStorage.removeItem('DYNAMIC_ROUTES_CACHE');
}
