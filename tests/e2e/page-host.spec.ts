import { expect, test, type Page } from '@playwright/test';

const rootKvid = 'E2E-ROOT';
const firstKvid = 'E2E-PAGE-A';
const secondKvid = 'E2E-PAGE-B';
const umdKvid = 'E2E-PAGE-UMD';
const vueKvid = 'E2E-PAGE-VUE';
const firstPath = `/${rootKvid}/${firstKvid}`;
const secondPath = `/${rootKvid}/${secondKvid}`;
const umdPath = `/${rootKvid}/${umdKvid}`;
const vuePath = `/${rootKvid}/${vueKvid}`;

async function installPageHostFixtures(page: Page) {
  await page.addInitScript(() => {
    window.uiGlobalConfig = {
      InternalCode: 'page-host-e2e',
      IsAuthenticated: true,
      UseWindowOrigin: true,
      Parameters: {},
    };
    window.b64_md5 = value => `e2e-${value}`;
  });

  await page.route('**/Content/UmdDashboard/UmdResources/kivii-component-System.umd.js', route =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.VueComponent={manifest:{fileName:'kivii-component-System.umd.js'}};`,
    })
  );

  await page.route('**/Restful/Kivii.Basic.Entities.Menu/Show.json?**', route =>
    route.fulfill({
      json: {
        MenusMain: {
          Results: [
            { Kvid: rootKvid, Title: 'E2E 页面', Type: 'Folder', ParentKvid: null },
            {
              Kvid: firstKvid,
              ParentKvid: rootKvid,
              Title: '表单页面 A',
              Type: 'Page',
              FunctionKvid: 'FUNCTION-A',
            },
            {
              Kvid: secondKvid,
              ParentKvid: rootKvid,
              Title: '表单页面 B',
              Type: 'Page',
              FunctionKvid: 'FUNCTION-B',
            },
            {
              Kvid: umdKvid,
              ParentKvid: rootKvid,
              Title: 'UMD 表单页面',
              Type: 'Page',
              FunctionKvid: 'FUNCTION-UMD',
            },
            {
              Kvid: vueKvid,
              ParentKvid: rootKvid,
              Title: '远程 Vue 表单',
              Type: 'Page',
              FunctionKvid: 'remote-form.vue',
            },
          ],
        },
        MenuRoot: { Kvid: 'E2E-MENU-ROOT', Title: 'E2E Root' },
      },
    })
  );

  await page.route('**/Restful/Kivii.Basic.Entities.Menu/Query.json?**', route =>
    route.fulfill({ json: { Results: [] } })
  );

  // 启动阶段会预加载 UMD 文件清单；固定为空，避免真实后端内容和大脚本加载影响路由时序。
  await page.route('**/Restful/Kivii.Storages.Entities.DbFile/Query.json?**', route =>
    route.fulfill({ json: { Results: [] } })
  );

  await page.route('**/auth/logout.json', route => route.fulfill({ json: { success: true } }));
  await page.route('**/auth/kivii.json', route => route.fulfill({ json: { success: true } }));
  await page.route('**/e2e/protected.json', route =>
    route.fulfill({ status: 401, json: { message: 'expired' } })
  );

  await page.route('**/Restful/Kivii.Basic.Entities.Function/Access.json?**', async route => {
    const url = new URL(route.request().url());
    const kvid = url.searchParams.get('MenuKvids');
    const result = kvid === umdKvid
      ? { Handler: '<E2EUmdForm>', Remark: '/e2e/e2e-umd.js' }
      : kvid === vueKvid
        ? { Handler: '/e2e/remote-form.vue' }
        : { Handler: kvid === firstKvid ? '/e2e/page-a.html' : '/e2e/page-b.html' };
    await route.fulfill({
      json: {
        Results: [result],
      },
    });
  });

  await page.route('**/e2e/e2e-umd.js', route =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `(() => {
        const component = {
          name: 'E2EUmdForm',
          setup() {
            const draft = window.Vue.ref('');
            const mountId = Math.random().toString(36).slice(2);
            return () => window.Vue.h('div', { 'data-umd-mount-id': mountId }, [
              window.Vue.h('input', {
                id: 'umd-draft',
                value: draft.value,
                onInput: event => { draft.value = event.target.value; },
              }),
            ]);
          },
        };
        window.__KIVII_UMD_REGISTRY__ ??= { byUrl: {}, byFileName: {} };
        window.__KIVII_UMD_REGISTRY__.byFileName['e2e-umd.js'] = {
          E2EUmdForm: component,
          manifest: { fileName: 'e2e-umd.js' },
        };
      })();`,
    })
  );

  await page.route('**/e2e/remote-form.vue', route =>
    route.fulfill({
      contentType: 'text/plain',
      body: `<script setup>
import { ref } from 'vue'
const draft = ref('')
const mountId = Math.random().toString(36).slice(2)
</script>
<template>
  <div class="e2e-remote-style-marker" :data-vue-mount-id="mountId">
    <input id="vue-draft" v-model="draft" />
  </div>
</template>
<style>
.e2e-remote-style-marker { color: rgb(1, 2, 3); }
</style>`,
    })
  );

  await page.route('**/e2e/page-*.html', async route => {
    const isFirst = route.request().url().includes('page-a');
    await route.fulfill({
      contentType: 'text/html',
      headers: {
        'Cross-Origin-Embedder-Policy': 'credentialless',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Resource-Policy': 'same-origin',
      },
      body: `<!doctype html><html><body>
        <label>${isFirst ? 'A' : 'B'}<input id="draft" value=""></label>
        <script>
          window.mountId = Math.random().toString(36).slice(2);
          document.body.dataset.mountId = window.mountId;
        </script>
      </body></html>`,
    });
  });

  await page.route(/^https:\/\/datav\.kivii\.org\/Content\//, route => route.abort());
}

async function diagnosticSummary(page: Page) {
  return page.evaluate(() => window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.summary());
}

test.beforeEach(async ({ page }) => {
  await installPageHostFixtures(page);
  await page.goto(`/#${firstPath}`);
  await expect(page.locator('#page-host-root iframe')).toHaveCount(1);
  await expect.poll(async () => (await diagnosticSummary(page))?.hosted).toBeGreaterThan(0);
});

test('keeps form state while switching tabs and destroys the instance on close', async ({ page }) => {
  const firstFrame = page.frameLocator(`iframe[src$="/e2e/page-a.html"]`);
  await firstFrame.locator('#draft').fill('unfinished form');

  await page.goto(`/#${secondPath}`);
  await expect(page.locator('#page-host-root iframe')).toHaveCount(2);
  await page.goto(`/#${firstPath}`);

  await expect(firstFrame.locator('#draft')).toHaveValue('unfinished form');

  const destroyBefore = (await diagnosticSummary(page))?.destroy ?? 0;
  const firstTab = page.locator('.tab-item', { hasText: '表单页面 A' });
  await firstTab.locator('.tab-close-btn').click();

  await expect(page.locator(`iframe[src$="/e2e/page-a.html"]`)).toHaveCount(0);
  await expect.poll(async () => (await diagnosticSummary(page))?.destroy).toBe(destroyBefore + 1);
});

test('refresh rebuilds the active PageHost instance exactly once', async ({ page }) => {
  const frame = page.frameLocator(`iframe[src$="/e2e/page-a.html"]`);
  await frame.locator('#draft').fill('will be cleared');
  const mountIdBefore = await frame.locator('body').getAttribute('data-mount-id');
  const destroyBefore = (await diagnosticSummary(page))?.destroy ?? 0;

  await page.getByTitle('刷新当前页').click();

  await expect.poll(async () => (await diagnosticSummary(page))?.destroy).toBe(destroyBefore + 1);
  await expect(frame.locator('#draft')).toHaveValue('');
  await expect.poll(async () => frame.locator('body').getAttribute('data-mount-id')).not.toBe(mountIdBefore);
  await expect(page.locator('#page-host-root iframe')).toHaveCount(1);
});

test('keeps a Hosted UMD component alive across tab switches and destroys it on close', async ({ page }) => {
  await page.goto(`/#${umdPath}`);
  const umdInput = page.locator('#page-host-root #umd-draft');
  await umdInput.fill('unfinished UMD form');
  const mountIdBefore = await page.locator('[data-umd-mount-id]').getAttribute('data-umd-mount-id');

  await page.goto(`/#${firstPath}`);
  await page.goto(`/#${umdPath}`);

  await expect(umdInput).toHaveValue('unfinished UMD form');
  await expect(page.locator('[data-umd-mount-id]')).toHaveAttribute('data-umd-mount-id', mountIdBefore!);

  const destroyBefore = (await diagnosticSummary(page))?.destroy ?? 0;
  const umdTab = page.locator('.tab-item', { hasText: 'UMD 表单页面' });
  await umdTab.locator('.tab-close-btn').click();

  await expect(page.locator('#page-host-root #umd-draft')).toHaveCount(0);
  await expect.poll(async () => (await diagnosticSummary(page))?.destroy).toBe(destroyBefore + 1);
});

test('body teleported UMD dialogs appear above hosted page content', async ({ page }) => {
  await page.goto(`/#${umdPath}`);
  await expect(page.locator('#page-host-root #umd-draft')).toBeVisible();

  const topElementId = await page.evaluate(() => {
    const overlay = document.createElement('div');
    overlay.id = 'e2e-umd-dialog';
    overlay.style.cssText = 'position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.4)';
    document.body.appendChild(overlay);
    const input = document.querySelector('#page-host-root #umd-draft')!;
    const bounds = input.getBoundingClientRect();
    const topElement = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    overlay.remove();
    return topElement?.id;
  });

  expect(topElementId).toBe('e2e-umd-dialog');
});

test('close all destroys every hosted page through the public tab menu', async ({ page }) => {
  await page.goto(`/#${secondPath}`);
  await page.goto(`/#${umdPath}`);
  await expect(page.locator('#page-host-root [data-page-host-instance]')).toHaveCount(3);
  const destroyBefore = (await diagnosticSummary(page))?.destroy ?? 0;

  await page.locator('.tab-item', { hasText: 'UMD 表单页面' }).click({ button: 'right' });
  await page.getByText('关闭所有', { exact: true }).click();

  await expect(page.locator('#page-host-root [data-page-host-instance]')).toHaveCount(0);
  await expect.poll(async () => (await diagnosticSummary(page))?.destroy).toBe(destroyBefore + 3);
});

test('keeps a remote Vue instance alive and removes its scoped resources on close', async ({ page }) => {
  await page.goto(`/#${vuePath}`);
  const vueInput = page.locator('#page-host-root #vue-draft');
  await vueInput.fill('unfinished remote Vue form');
  const componentRoot = page.locator('[data-vue-mount-id]');
  const mountIdBefore = await componentRoot.getAttribute('data-vue-mount-id');
  const hasRemoteStyle = () => page.evaluate(() =>
    Array.from(document.head.querySelectorAll('style'))
      .some(style => style.textContent?.includes('e2e-remote-style-marker'))
  );
  await expect.poll(hasRemoteStyle).toBe(true);

  await page.goto(`/#${firstPath}`);
  await page.goto(`/#${vuePath}`);

  await expect(vueInput).toHaveValue('unfinished remote Vue form');
  await expect(componentRoot).toHaveAttribute('data-vue-mount-id', mountIdBefore!);

  const destroyBefore = (await diagnosticSummary(page))?.destroy ?? 0;
  const vueTab = page.locator('.tab-item', { hasText: '远程 Vue 表单' });
  await vueTab.locator('.tab-close-btn').click();

  await expect(page.locator('#page-host-root #vue-draft')).toHaveCount(0);
  await expect.poll(async () => (await diagnosticSummary(page))?.destroy).toBe(destroyBefore + 1);
  await expect.poll(hasRemoteStyle).toBe(false);
});

test('normal logout destroys every PageHost instance and clears the session tabs', async ({ page }) => {
  await page.goto(`/#${vuePath}`);
  await page.goto(`/#${umdPath}`);
  await expect(page.locator('#page-host-root [data-page-host-instance]')).toHaveCount(3);
  const destroyBefore = (await diagnosticSummary(page))?.destroy ?? 0;

  await page.getByRole('button', { name: 'Admin' }).hover();
  await page.getByText('退出登录', { exact: true }).click();

  await expect(page).toHaveURL(/#\/login$/);
  await expect(page.locator('#page-host-root [data-page-host-instance]')).toHaveCount(0);
  await expect.poll(async () => (await diagnosticSummary(page))?.destroy).toBe(destroyBefore + 3);
  await expect(page.locator('.tab-item')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.uiGlobalConfig?.IsAuthenticated)).toBe(false);
});

test('401 relogin clears stale persistence and rebuilds the current PageHost page', async ({ page }) => {
  const firstFrame = page.frameLocator(`iframe[src$="/e2e/page-a.html"]`);
  await firstFrame.locator('#draft').fill('stale session form');
  const mountIdBefore = await firstFrame.locator('body').getAttribute('data-mount-id');
  await page.evaluate(() => {
    localStorage.setItem('DYNAMIC_ROUTES_CACHE', 'stale-routes');
    localStorage.setItem('kivii-tabs', 'stale-tabs');
  });

  await page.evaluate(() => fetch('/e2e/protected.json'));
  await expect(page.getByText('登录已过期', { exact: true })).toBeVisible();
  await page.getByPlaceholder('请输入用户名').fill('e2e-user');
  await page.getByPlaceholder('请输入密码').fill('e2e-password');

  const reloaded = page.waitForEvent('framenavigated', frame => frame === page.mainFrame());
  await page.getByRole('button', { name: '重新登录' }).click();
  await reloaded;

  await expect(page).toHaveURL(new RegExp(`#${firstPath}$`));
  await expect(page.locator('#page-host-root iframe')).toHaveCount(1);
  await expect(firstFrame.locator('#draft')).toHaveValue('');
  await expect.poll(async () => firstFrame.locator('body').getAttribute('data-mount-id')).not.toBe(mountIdBefore);
  await expect.poll(() => page.evaluate(() => ({
    routes: localStorage.getItem('DYNAMIC_ROUTES_CACHE'),
    tabs: localStorage.getItem('kivii-tabs'),
  }))).not.toEqual({ routes: 'stale-routes', tabs: 'stale-tabs' });
  await expect.poll(() => page.evaluate(() => {
    const routes = localStorage.getItem('DYNAMIC_ROUTES_CACHE');
    const tabs = localStorage.getItem('kivii-tabs');
    return {
      hasFreshRoutes: !!routes && routes.includes('E2E-PAGE-A'),
      hasFreshTabs: !!tabs && tabs.includes('E2E-PAGE-A'),
    };
  })).toEqual({ hasFreshRoutes: true, hasFreshTabs: true });
});
