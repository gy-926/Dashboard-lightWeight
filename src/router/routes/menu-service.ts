import { getAutoStartupMenuKvid, getRuntimeMenu } from '@/api/dashboard-admin';
import type { MenuApiResponse } from './types';

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super('权限不足，请重新登录');
    this.name = 'UnauthorizedError';
  }
}

export async function fetchAutoStartupKvid(menuRootKvid: string): Promise<string | null> {
  try {
    return await getAutoStartupMenuKvid(menuRootKvid);
  } catch (error) {
    console.warn('[MenuService] 获取自动启动菜单失败:', error);
    return null;
  }
}

export async function fetchMenuData(internalCode: string): Promise<MenuApiResponse> {
  try {
    return await getRuntimeMenu(internalCode);
  } catch (error) {
    console.warn('[MenuService] 获取菜单失败:', error);
    return { MenuRoot: { Kvid: '', Title: '' }, MenusMain: { Results: [], Total: 0 } };
  }
}
