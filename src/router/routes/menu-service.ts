import type { MenuApiResponse } from './types';
import { isMockMode } from '@/api/mock-mode';
import { kivii } from '@kivii.com/bridge';

// 401 未授权错误（供上层识别并跳转登录页）
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super('权限不足，请重新登录');
    this.name = 'UnauthorizedError';
  }
}

// ==================== Mock 菜单数据 ====================
const MOCK_MENU_DATA: MenuApiResponse = {
  MenuRoot: {
    Kvid: 'root-mock',
    Title: 'GavinYin Dashboard',
    DisplayName: 'GavinYin Dashboard',
  },
  MenusMain: {
    Total: 2,
    Results: [
      {
        Kvid: 'mock-demo',
        Title: '功能演示',
        Type: 'Folder',
        Icon: 'fas fa-flask',
        Order: 1,
      },
      {
        Kvid: 'mock-demo-iframe',
        ParentKvid: 'mock-demo',
        Title: 'iframe 嵌入示例',
        Type: 'Page',
        Icon: 'fas fa-window-restore',
        Order: 1,
        FunctionKvid: 'func-demo-iframe',
      },
    ],
  },
};

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
export async function fetchAutoStartupKvid(menuRootKvid: string): Promise<string | null> {
  try {
    const response = await kivii.request.get<{ Results: any[] }>(
      `/Restful/Kivii.Basic.Entities.Menu/Query.json?ParentKvid=${menuRootKvid}&isRelateFunction=true`
    );
    const results: any[] = response.data?.Results ?? [];

    const item = results.find(m => {
      const params = parseParameters(m.Parameters);
      const val = params.AutoStartup;
      return val === true || val === 'true' || val === 1;
    });

    return item?.Kvid ?? null;
  } catch {
    return null;
  }
}

// 从接口获取菜单数据
export async function fetchMenuData(_internalCode: string): Promise<MenuApiResponse> {
  if (isMockMode) {
    return MOCK_MENU_DATA;
  }

  // ── 真实后端请求（设置 VITE_API_MODE=real 后生效）──
  // try {
  //   const response = await kivii.request.get<MenuApiResponse>(
  //     `/Restful/Kivii.Basic.Entities.Menu/Show.json?RootInternalCode=${_internalCode}`
  //   );
  //   return response.data;
  // } catch (error: unknown) {
  //   const err = error as { status?: number; response?: { status: number } };
  //   if (err?.status === 401 || err?.response?.status === 401) {
  //     throw new UnauthorizedError();
  //   }
  //   throw error;
  // }
  return MOCK_MENU_DATA; // fallback，真实请求取消注释后删除此行
}
