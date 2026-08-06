import { describe, expect, it } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';
import { transformRouteToMenu } from '@/layouts/modules/global-menu/types';

describe('transformRouteToMenu', () => {
  it('copies kvid from route meta', () => {
    const routes = [
      {
        path: '/remote-page',
        name: 'remote-page',
        meta: { title: '远程页面', kvid: 'meta-kvid' },
      },
    ] as RouteRecordRaw[];

    expect(transformRouteToMenu(routes)[0].kvid).toBe('meta-kvid');
  });

  it('falls back to static route props and keeps meta authoritative', () => {
    const routes = [
      {
        path: '/props-page',
        name: 'props-page',
        props: { kvid: 'props-kvid' },
        meta: { title: 'Props 页面' },
      },
      {
        path: '/meta-page',
        name: 'meta-page',
        props: { kvid: 'props-kvid' },
        meta: { title: 'Meta 页面', kvid: 'meta-kvid' },
      },
    ] as RouteRecordRaw[];

    const menu = transformRouteToMenu(routes);
    expect(menu[0].kvid).toBe('props-kvid');
    expect(menu[1].kvid).toBe('meta-kvid');
  });
});
