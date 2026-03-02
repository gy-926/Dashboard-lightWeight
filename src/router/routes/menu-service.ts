import type { MenuApiResponse } from './types';

import { kivii } from '@kivii.com/bridge';

// 401 未授权错误（供上层识别并跳转登录页）
// 注意：request.get 内部已经处理了 401 跳转，这里可能不需要额外抛出 UnauthorizedError，
// 除非上层逻辑依赖这个特定 Error 类型。
// 为了保持兼容性，我们可以捕获错误并重新抛出，或者依赖全局处理。
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super('权限不足，请重新登录');
    this.name = 'UnauthorizedError';
  }
}

// 从接口获取菜单数据
export async function fetchMenuData(internalCode: string): Promise<MenuApiResponse> {
  try {
    const response = await kivii.request.get<MenuApiResponse>(
      `/Restful/Kivii.Basic.Entities.Menu/Show.json?RootInternalCode=${internalCode}`
    );
    return response.data;
  } catch (error: any) {
    if (error?.status === 401 || error?.response?.status === 401) {
      throw new UnauthorizedError();
    }
    throw error;
  }
}
