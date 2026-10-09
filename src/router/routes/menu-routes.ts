import type { MenuItem, ElegantRoute } from './types';
import { normalizeBrandText } from '@/utils/brand';

// ==================== 菜单树构建 ====================

interface TreeStats {
  maxDepth: number;
  totalNodes: number;
  leafCount: number;
  containerCount: number;
  functionCount: number;
}

export function getMenuTree(items: MenuItem[]): MenuItem[] {
  if (!items || items.length === 0) return [];

  const itemKvids = new Set(items.map(item => item.Kvid));

  // 找出根节点：
  // 1. ParentKvid 为 null / undefined / ''
  // 2. ParentKvid 不存在于当前数据集中（孤儿节点兜底为根节点）
  const rootItems = items.filter(item => {
    const parentKvid = item.ParentKvid;
    return parentKvid == null || parentKvid === '' || !itemKvids.has(parentKvid);
  });

  // 递归构建子树
  function buildChildren(parentKvid: string): MenuItem[] {
    const children = items.filter(item => item.ParentKvid === parentKvid);
    children.forEach(child => {
      child.Children = buildChildren(child.Kvid);
    });
    return children;
  }

  // 为每个根节点构建子树
  rootItems.forEach(item => {
    item.Children = buildChildren(item.Kvid);
  });

  return rootItems;
}

// 统计分析
export function analyzeTree(items: MenuItem[], depth = 1): TreeStats {
  let maxDepth = depth;
  let totalNodes = 0;
  let leafCount = 0;
  let containerCount = 0;
  let functionCount = 0;

  function traverse(nodes: MenuItem[], currentDepth: number) {
    nodes.forEach(node => {
      totalNodes++;
      maxDepth = Math.max(maxDepth, currentDepth);

      const hasChildren = node.Children && node.Children.length > 0;
      const hasFunction = !!node.FunctionKvid;

      if (hasChildren) {
        containerCount++;
        traverse(node.Children!, currentDepth + 1);
      }
      if (hasFunction || !hasChildren) {
        leafCount++;
      }
      if (hasFunction) {
        functionCount++;
      }
    });
  }

  traverse(items, depth);

  return {
    maxDepth,
    totalNodes,
    leafCount,
    containerCount,
    functionCount,
  };
}

// ==================== 路由生成 ====================

// 获取菜单显示名称（优先使用 DisplayName，否则使用 Title）
function getMenuDisplayName(item: MenuItem): string {
  return normalizeBrandText(item.DisplayName || item.Title);
}

// 生成根级路由
function generateRootRoute(item: MenuItem, parentPath = ''): ElegantRoute {
  const routeName = item.Type === 'System' ? item.Type : item.Kvid;
  // 确保路径以 / 开头
  const routePath =
    item.Type === 'System'
      ? (item.Remark || `/${item.Type}`).startsWith('/')
        ? item.Remark || `/${item.Type}`
        : `/${item.Remark || item.Type}`
      : `/${item.Kvid}`;

  return {
    name: routeName,
    path: routePath,
    component: 'layout.base',
    meta: {
      title: getMenuDisplayName(item),
      icon: item.Icon,
      order: item.Order,
      keepAlive: true,
    },
    children: [],
  };
}

// 生成子路由
function generateChildRoutes(
  items: MenuItem[],
  parentPath: string,
  parentName: string
): ElegantRoute[] {
  return items.map(item => {
    const isSystem = item.Type === 'System';
    const hasChildren = item.Children && item.Children.length > 0;
    const hasFunction = !!item.FunctionKvid;
    // Dashboard API 会显式返回 Handler（包括空字符串）。只有字段确实存在时，
    // 才视为路由层已经完成解析，以兼容仍依赖旧 Access 接口的数据源。
    const handlerResolved = Object.prototype.hasOwnProperty.call(item, 'Handler');

    // 生成路由名称
    let routeName: string;
    if (isSystem && item.Remark) {
      // System 类型使用 Remark 拼接
      const remarkPath = item.Remark.replace(/^\//, '');
      routeName = `${parentName}_${remarkPath.replace(/\//g, '_')}`;
    } else {
      routeName = `${parentName}_${item.Kvid}`;
    }

    // 生成路由路径（确保以 / 开头）
    let routePath: string;
    if (isSystem && item.Remark) {
      routePath = item.Remark.startsWith('/') ? item.Remark : `/${item.Remark}`;
    } else {
      // 拼接父路径
      const normalizedParent = parentPath.replace(/\/$/, '');
      routePath = `${normalizedParent}/${item.Kvid}`;
    }

    // 容器节点（有 children）
    if (hasChildren) {
      const route: ElegantRoute = {
        name: routeName,
        path: routePath,
        component: 'layout.passthrough',
        meta: {
          title: getMenuDisplayName(item),
          icon: item.Icon,
          order: item.Order,
          keepAlive: true,
        },
        children: [],
      };

      // 递归生成子路由
      route.children = generateChildRoutes(item.Children!, routePath, routeName);

      // 容器兼页面（有 FunctionKvid）- 添加默认子路由
      if (hasFunction) {
        route.children.unshift({
          name: `${routeName}_default`,
          path: '',
          component: 'view.iframe-page',
          props: {
            url: item.Type === 'System' ? item.Remark || '' : '',
            kvid: item.Kvid,
            functionKvid: item.FunctionKvid,
            handler: item.Handler || '',
            handlerResolved,
            scriptPath: item.Remark || '',
            type: 'webview',
          },
          meta: {
            title: getMenuDisplayName(item),
            type: 'iframe',
            keepAlive: true,
            kvid: item.Kvid,
            pageHandler: item.Handler || '',
            pageHandlerResolved: handlerResolved,
            pageScriptPath: item.Remark || '',
          },
        });
      }

      return route;
    }

    // 页面节点（叶子节点或有 FunctionKvid）
    // 使用 IframePage 渲染
    return {
      name: routeName,
      path: routePath,
      component: 'view.iframe-page',
      props: {
        url: item.Type === 'System' ? item.Remark || '' : '',
        kvid: item.Kvid,
        functionKvid: item.FunctionKvid || '',
        handler: item.Handler || '',
        handlerResolved,
        scriptPath: item.Remark || '',
        type: (item.FunctionKvid?.endsWith('.vue') ? 'vue' : 'webview') as 'webview' | 'vue',
      },
      meta: {
        title: getMenuDisplayName(item),
        icon: item.Icon,
        order: item.Order,
        type: 'iframe',
        keepAlive: true,
        kvid: item.Kvid,
        pageHandler: item.Handler || '',
        pageHandlerResolved: handlerResolved,
        pageScriptPath: item.Remark || '',
      },
    };
  });
}

// 生成路由树
export function generateRoutes(menuTree: MenuItem[]): ElegantRoute[] {
  return menuTree.map(item => {
    const route = generateRootRoute(item);

    if (item.Children && item.Children.length > 0) {
      route.children = generateChildRoutes(item.Children, route.path, route.name || item.Kvid);
    }

    return route;
  });
}
