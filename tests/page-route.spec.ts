import { describe, expect, it } from 'vitest';
import { isDynamicPageRoute, shouldBypassRouteKeepAlive } from '@/router/page-route';

describe('isDynamicPageRoute', () => {
  it('recognizes backend KVID pages from route metadata', () => {
    const route = {
      path: '/root-kvid/page-kvid',
      name: 'root-kvid_page-kvid',
      meta: { type: 'iframe', keepAlive: true },
    };

    expect(isDynamicPageRoute(route)).toBe(true);
    expect(shouldBypassRouteKeepAlive(route)).toBe(false);
  });

  it.each([
    { path: '/custom_report', name: 'custom-report' },
    { path: '/bridge_task', name: 'bridge-task' },
    { path: '/iframe-page/detail/example', name: 'iframe-page-detail' },
  ])('keeps compatibility with legacy dynamic route $path', route => {
    expect(isDynamicPageRoute(route)).toBe(true);
    expect(shouldBypassRouteKeepAlive(route)).toBe(true);
  });

  it('does not classify ordinary local and standalone UMD routes as dynamic pages', () => {
    expect(isDynamicPageRoute({ path: '/ai-chat', name: 'ai-chat', meta: {} })).toBe(false);
    expect(shouldBypassRouteKeepAlive({ path: '/ai-chat', name: 'ai-chat', meta: {} })).toBe(false);
    expect(
      isDynamicPageRoute({
        path: '/umd/library/component',
        name: 'umd_library_component',
        meta: { umdLibrary: 'library' },
      })
    ).toBe(false);
  });
});
