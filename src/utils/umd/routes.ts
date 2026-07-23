import type { ElegantRoute } from '@/router/routes/types';
import { remoteLibraries } from './state';
import { normalizeBrandText } from '@/utils/brand';

const EXCLUDED_KEYS = new Set([
  'default',
  'install',
  'manifest',
  'componentsMap',
  'componentsDetailed',
  'version',
  '__esModule',
  'VueDemoComponent',
]);

function toRouteSafeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * 根据已加载的 remoteLibraries 生成 UMD 组件路由树。
 * 每个成功加载的库生成一个 layout.base folder 节点，
 * 每个导出组件生成一个 view.umd-component 叶子路由。
 */
export function generateUmdRoutes(): ElegantRoute[] {
  const routes: ElegantRoute[] = [];

  for (const lib of remoteLibraries.value) {
    if (lib.status !== 'success' || lib.showInMenu !== true) continue;

    const keys = (lib.componentKeys ?? []).filter(k => !EXCLUDED_KEYS.has(k));
    if (keys.length === 0) continue;

    const safeName = toRouteSafeName(lib.name);
    const libPath = `/umd/${lib.name}`;
    const libRouteName = `umd_${safeName}`;

    const children: ElegantRoute[] = keys.map(compName => {
      const detail = lib.componentsDetailed?.find(
        (d: any) => d.name === compName || d.tag === compName
      );
      const title = normalizeBrandText(
        detail?.zhName ?? detail?.displayName ?? detail?.title ?? compName
      );
      const rawIcon: string | undefined = detail?.icon;
      const icon: string | undefined = rawIcon?.replace(/^(fas|far|fab|fal|fad)\s+/, '');
      const description = detail?.description
        ? normalizeBrandText(detail.description)
        : undefined;

      return {
        name: `${libRouteName}_${toRouteSafeName(compName)}`,
        path: `${libPath}/${compName}`,
        component: 'view.umd-component',
        props: { componentName: compName },
        meta: {
          title,
          ...(icon ? { icon } : {}),
          ...(description ? { description } : {}),
          keepAlive: true,
          umdLibrary: lib.name,
          umdComponent: compName,
        },
      };
    });

    routes.push({
      name: libRouteName,
      path: libPath,
      component: 'layout.base',
      redirect: children[0]?.path,
      meta: {
        title: normalizeBrandText(lib.manifest?.zhName ?? lib.name),
        icon: 'fa-cube',
        umdLibrary: lib.name,
        autoDiscovered: true,
      },
      children,
    });
  }

  return routes;
}
