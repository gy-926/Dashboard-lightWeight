import { ApiError } from '@/api/nest-client';
import { withRequestTimeout } from '@/utils/request-timeout';
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
    return await withRequestTimeout(signal => getAutoStartupMenuKvid(menuRootKvid, signal), '自动启动菜单加载超时');
  } catch (error) {
    console.warn('[MenuService] 获取自动启动菜单失败:', error);
    return null;
  }
}

export async function fetchMenuData(internalCode: string): Promise<MenuApiResponse> {
  try {
    return await withRequestTimeout(signal => getRuntimeMenu(internalCode, signal), '菜单加载超时，请检查网络后重试');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) throw new UnauthorizedError();
    throw error;
  }
}
