import type { MenuApiResponse } from './types'

// 模拟的菜单数据（模拟后端返回）
export const mockMenuData: MenuApiResponse = {
  MenusMain: {
    Results: [
      // ========== 一级菜单 ==========
      {
        Kvid: 'system',
        ParentKvid: null,
        Title: '系统管理',
        Type: 'Folder',
        Icon: 'fa-cog',
        Order: 1,
        Children: []
      },
      {
        Kvid: 'content',
        ParentKvid: null,
        Title: '内容管理',
        Type: 'Folder',
        Icon: 'fa-book',
        Order: 2,
        Children: []
      },
      {
        Kvid: 'demo',
        ParentKvid: null,
        Title: '功能演示',
        Type: 'Folder',
        Icon: 'fa-flask',
        Order: 3,
        Children: []
      },

      // ========== 系统管理 - 二级菜单 ==========
      {
        Kvid: 'user',
        ParentKvid: 'system',
        Title: '用户管理',
        Type: 'Page',
        Icon: 'fa-users',
        FunctionKvid: 'sys_user_manage',
        Order: 1
      },
      {
        Kvid: 'role',
        ParentKvid: 'system',
        Title: '角色管理',
        Type: 'Page',
        Icon: 'fa-user-tag',
        FunctionKvid: 'sys_role_manage',
        Order: 2
      },
      {
        Kvid: 'menu',
        ParentKvid: 'system',
        Title: '菜单管理',
        Type: 'Page',
        Icon: 'fa-list',
        FunctionKvid: 'sys_menu_manage',
        Order: 3
      },

      // ========== 内容管理 - 二级菜单 ==========
      {
        Kvid: 'article',
        ParentKvid: 'content',
        Title: '文章管理',
        Type: 'Page',
        Icon: 'fa-newspaper',
        FunctionKvid: 'content_article',
        Order: 1
      },
      {
        Kvid: 'category',
        ParentKvid: 'content',
        Title: '分类管理',
        Type: 'Page',
        Icon: 'fa-folder',
        FunctionKvid: 'content_category',
        Order: 2
      },
      {
        Kvid: 'tag',
        ParentKvid: 'content',
        Title: '标签管理',
        Type: 'Page',
        Icon: 'fa-tags',
        FunctionKvid: 'content_tag',
        Order: 3
      },

      // ========== 功能演示 - 二级菜单 ==========
      {
        Kvid: 'iframe-demo',
        ParentKvid: 'demo',
        Title: '外部页面',
        Type: 'Page',
        Icon: 'fa-external-link-alt',
        Remark: 'https://www.baidu.com',
        Order: 1
      },
      {
        Kvid: 'vue-demo',
        ParentKvid: 'demo',
        Title: '远程Vue组件',
        Type: 'Page',
        Icon: 'fa-code',
        FunctionKvid: '/remote-test.vue',
        Order: 2
      },
      {
        Kvid: 'extjs-demo',
        ParentKvid: 'demo',
        Title: 'ExtJS组件',
        Type: 'Page',
        Icon: 'fa-puzzle-piece',
        FunctionKvid: 'ExtJS.panel.Demo',
        Order: 3
      }
    ]
  },
  MenuRoot: {
    Kvid: 'root',
    Title: '根菜单'
  }
}

// 模拟 API 请求
export async function fetchMenuData(internalCode: string): Promise<MenuApiResponse> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))

  // 实际项目中这里会使用 fetch:
  // const response = await fetch(`/Restful/Kivii.Basic.Entities.Menu/Show.json?RootInternalCode=${internalCode}`)
  // return await response.json()

  return mockMenuData
}
