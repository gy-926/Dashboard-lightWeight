import type { MenuApiResponse } from './types';
import { isMockMode } from '@/api/mock-mode';

// 恢复后端连接时，取消下方 import 注释
// import { kivii } from '@kivii.com/bridge';

// 401 未授权错误（供上层识别并跳转登录页）
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super('权限不足，请重新登录');
    this.name = 'UnauthorizedError';
  }
}

// ==================== Mock 菜单数据 ====================
// 这是一份本地演示菜单，用于开箱即用体验。
// 接入真实后端后，删除此 mock 数据，恢复下方 fetchMenuData 中的接口请求。
const MOCK_MENU_DATA: MenuApiResponse = {
  MenuRoot: {
    Kvid: 'root-mock',
    Title: 'Kivii Dashboard',
    DisplayName: 'Kivii Dashboard',
  },
  MenusMain: {
    Total: 2,
    Results: [
      // ── 功能演示（保留一个 iframe 嵌入示例） ──
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
