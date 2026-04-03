import type { MenuApiResponse } from './types';

// [MOCK MODE] 已注释掉后端请求依赖，使用本地 Mock 数据
// 恢复后端连接时，取消下方 import 注释，并恢复 fetchMenuData 中的实际请求代码
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
    Total: 12,
    Results: [
      // ── 首页 ──
      {
        Kvid: 'mock-home',
        Title: '首页',
        Type: 'Folder',
        Icon: 'fas fa-home',
        Order: 1,
      },
      {
        Kvid: 'mock-home-workbench',
        ParentKvid: 'mock-home',
        Title: '工作台',
        Type: 'Page',
        Icon: 'fas fa-th-large',
        Order: 1,
        FunctionKvid: 'func-workbench',
      },
      {
        Kvid: 'mock-home-monitor',
        ParentKvid: 'mock-home',
        Title: '数据概览',
        Type: 'Page',
        Icon: 'fas fa-chart-bar',
        Order: 2,
        FunctionKvid: 'func-monitor',
      },
      // ── 用户管理 ──
      {
        Kvid: 'mock-user',
        Title: '用户管理',
        Type: 'Folder',
        Icon: 'fas fa-users',
        Order: 2,
      },
      {
        Kvid: 'mock-user-list',
        ParentKvid: 'mock-user',
        Title: '用户列表',
        Type: 'Page',
        Icon: 'fas fa-user',
        Order: 1,
        FunctionKvid: 'func-user-list',
      },
      {
        Kvid: 'mock-user-role',
        ParentKvid: 'mock-user',
        Title: '角色权限',
        Type: 'Page',
        Icon: 'fas fa-user-shield',
        Order: 2,
        FunctionKvid: 'func-user-role',
      },
      // ── 内容管理 ──
      {
        Kvid: 'mock-content',
        Title: '内容管理',
        Type: 'Folder',
        Icon: 'fas fa-file-alt',
        Order: 3,
      },
      {
        Kvid: 'mock-content-article',
        ParentKvid: 'mock-content',
        Title: '文章列表',
        Type: 'Page',
        Icon: 'fas fa-newspaper',
        Order: 1,
        FunctionKvid: 'func-article',
      },
      {
        Kvid: 'mock-content-media',
        ParentKvid: 'mock-content',
        Title: '媒体资源',
        Type: 'Page',
        Icon: 'fas fa-photo-video',
        Order: 2,
        FunctionKvid: 'func-media',
      },
      // ── 系统设置 ──
      {
        Kvid: 'mock-system',
        Title: '系统设置',
        Type: 'Folder',
        Icon: 'fas fa-cog',
        Order: 4,
      },
      {
        Kvid: 'mock-system-menu',
        ParentKvid: 'mock-system',
        Title: '菜单管理',
        Type: 'Page',
        Icon: 'fas fa-bars',
        Order: 1,
        FunctionKvid: 'func-menu',
      },
      {
        Kvid: 'mock-system-config',
        ParentKvid: 'mock-system',
        Title: '系统配置',
        Type: 'Page',
        Icon: 'fas fa-sliders-h',
        Order: 2,
        FunctionKvid: 'func-config',
      },
    ],
  },
};

// 从接口获取菜单数据
export async function fetchMenuData(_internalCode: string): Promise<MenuApiResponse> {
  // [MOCK MODE] 直接返回本地 Mock 菜单数据，跳过后端请求
  // 恢复后端连接时，注释掉下面这行，取消注释下方的实际请求代码
  return MOCK_MENU_DATA;

  // ── 原始后端请求（恢复时取消注释）──
  // try {
  //   const response = await kivii.request.get<MenuApiResponse>(
  //     `/Restful/Kivii.Basic.Entities.Menu/Show.json?RootInternalCode=${_internalCode}`
  //   );
  //   return response.data;
  // } catch (error: any) {
  //   if (error?.status === 401 || error?.response?.status === 401) {
  //     throw new UnauthorizedError();
  //   }
  //   throw error;
  // }
}
