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

// 解析菜单项的 Parameters 字段（可能是 JSON 字符串或对象）
function parseParameters(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw;
  return {};
}

// 查询 menuRoot 的直接子菜单，找到 Parameters.AutoStartup 为真的项
// 返回该菜单项的 Kvid，找不到则返回 null
export async function fetchAutoStartupKvid(menuRootKvid: string): Promise<string | null> {
  try {
    const response = await kivii.request.get<{ Results: any[] }>(
      `/Restful/Kivii.Basic.Entities.Menu/Query.json?ParentKvid=${menuRootKvid}&isRelateFunction=true`
    );
    const results: any[] = response.data?.Results ?? [];

    const item = results.find(m => {
      const params = parseParameters(m.Parameters);
      const val = params.AutoStartup;
      // 兼容 boolean true、字符串 "true"、数字 1
      return val === true || val === 'true' || val === 1;
    });

    return item?.Kvid ?? null;
  } catch {
    return null;
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
