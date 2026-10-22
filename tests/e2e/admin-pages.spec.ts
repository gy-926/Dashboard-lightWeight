import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

async function mockApi(page: Page) {
  await page.route(
    url => url.pathname.startsWith('/api/'),
    async route => {
      const path = new URL(route.request().url()).pathname;
      let result: unknown = null;
      if (path === '/api/auth/refresh' || path === '/api/auth/login')
        result = {
          accessToken: 'a'.repeat(43),
          expiresIn: 900,
          user: { id: 'admin', email: 'admin@example.com', name: 'Admin', role: 'super_admin' },
        };
      else if (path.endsWith('/me/roles'))
        result = [{ kvid: 'admin', code: 'admin', name: '管理员' }];
      else if (path.endsWith('/menus/runtime'))
        result = {
          MenuRoot: { Kvid: 'root', Title: 'Workspace' },
          MenusMain: { Results: [], Total: 0 },
        };
      else if (path.endsWith('/admin/menu-config'))
        result = {
          roots: [
            {
              kvid: 'root',
              title: '工作台',
              display_name: '工作台',
              internal_code: 'umdDashboard',
              parameters: {},
            },
          ],
          menus: [
            {
              kvid: 'page',
              parent_kvid: null,
              menu_root_kvid: 'root',
              title: '示例页面',
              display_name: '示例页面',
              type: 'Page',
              sort_order: 0,
              function_kvid: 'feature',
              parameters: {},
              is_active: true,
            },
          ],
          functions: [{ kvid: 'feature', title: '功能', handler: '/demo', is_active: true }],
        };
      else if (path.endsWith('/admin/permissions'))
        result = {
          roles: [],
          roleFunctions: [],
          userRoles: [],
          users: [],
          departments: [],
          departmentFunctions: [],
        };
      else if (path.endsWith('/umd-versions') || path === '/api/dashboard-functions') result = [];
      else if (route.request().method() !== 'GET') result = route.request().postDataJSON();
      await route.fulfill({ json: { status: 200, message: 'success', Results: result } });
    }
  );
}

test.beforeEach(async ({ page }) => mockApi(page));

test('menu editor retains its shared state and blocks deletion of a root with page children', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/system/menu-config');
  const editor = page.locator('.menu-config');
  await expect(editor.getByText('示例页面', { exact: true }).first()).toBeVisible();
  await editor.locator('header').getByRole('button', { name: '删除', exact: true }).click();
  await expect(editor.getByText('无法删除', { exact: true })).toBeVisible();
  await expect(editor.getByText('请先删除子节点，再删除当前节点')).toBeVisible();
  expect(errors).toEqual([]);
});

test('home renders the runtime overview and interactive previews', async ({ page }) => {
  await page.goto('/#/home');
  await expect(page.getByRole('heading', { name: '一次远程模块如何进入工作台' })).toBeVisible();
  await page.getByRole('button', { name: /业务运营中心/ }).click();
  await expect(page.locator('.dashboard-preview-heading code')).toHaveText('operationsDashboard');
});

test('header and theme drawer keep dark mode synchronized across edits and reopening', async ({ page }) => {
  await page.goto('/#/home');
  const headerToggle = page.getByRole('button', { name: '切换主题', exact: true });
  const openSettings = page.getByRole('button', { name: '主题设置', exact: true });
  const darkToggle = page.locator('label').filter({ has: page.getByText('暗色模式', { exact: true }) }).locator('div').first();
  const tabsToggle = page.locator('label').filter({ has: page.getByText('显示标签页', { exact: true }) }).locator('div').first();

  await headerToggle.click();
  await openSettings.click();
  await expect(darkToggle).toHaveClass(/bg-primary/);
  await expect(page.locator('html')).toHaveClass(/dark/);

  // Changing another setting must preserve the mode selected in the header.
  await tabsToggle.click();
  await expect(darkToggle).toHaveClass(/bg-primary/);
  await expect(page.locator('html')).toHaveClass(/dark/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('kivii-theme')!).darkMode)).toBe(true);

  await darkToggle.click();
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(headerToggle.locator('i')).toHaveClass(/fa-moon/);

  await headerToggle.click();
  await openSettings.click();
  await expect(darkToggle).toHaveClass(/bg-primary/);
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await headerToggle.click();
  await openSettings.click();
  await expect(darkToggle).not.toHaveClass(/bg-primary/);
  await expect(page.locator('html')).not.toHaveClass(/dark/);
});

test('feature editor keeps an invalid JSON draft and saves corrected parameters', async ({
  page,
}) => {
  await page.goto('/#/system/feature-list');
  await page.getByRole('button', { name: '新增功能' }).click();
  await page.getByPlaceholder('请输入功能名称').fill('参数测试');
  await page
    .getByPlaceholder('<MyUmdComponent> / /path/to/page.vue / https://example.com')
    .fill('/example');
  const textarea = page.locator('textarea').first();
  await textarea.fill('{"unfinished":');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('扩展参数必须是合法 JSON');
  await expect(textarea).toHaveValue('{"unfinished":');
  await textarea.fill('{"enabled":false}');
  const request = page.waitForRequest(
    req => new URL(req.url()).pathname === '/api/dashboard-functions' && req.method() === 'POST'
  );
  await page.getByRole('button', { name: '保存', exact: true }).click();
  expect((await request).postDataJSON().parameters).toEqual({ enabled: false });
  await expect(textarea).toHaveCount(0);
});

test('shared auth shell renders login modes and synchronizes theme without writing it back', async ({
  page,
  context,
}) => {
  await page.goto('/#/login');
  await expect(page.getByText('安全登录', { exact: true })).toBeVisible();
  await page.getByText('忘记密码？', { exact: true }).click();
  await expect(page.getByRole('status')).toContainText('请联系管理员');
  await page.getByText('没有账号？去注册', { exact: true }).click();
  await expect(page.getByText('创建账号', { exact: true })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);

  const second = await context.newPage();
  await mockApi(second);
  await second.goto('/#/login');
  await expect(second.locator('.login-page')).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem(
      'kivii-theme',
      JSON.stringify({ darkMode: true, primaryColor: '#ef4444', layout: 'top' })
    )
  );
  await expect(second.locator('.login-page')).toHaveClass(/is-dark/);
  await expect
    .poll(() =>
      second.evaluate(() => document.documentElement.style.getPropertyValue('--color-primary'))
    )
    .toBe('#ef4444');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('kivii-theme')!).primaryColor)
  ).toBe('#ef4444');
  await expect(second.locator('.login-page')).toHaveCSS('background-color', 'rgb(10, 15, 30)');
  await second.screenshot({ path: '/tmp/dashboard-auth-dark.png', animations: 'disabled' });
  await second.close();
});

test('password change disables repeat submission and clears its redirect when leaving', async ({
  page,
}) => {
  await page.goto('/#/update-password');
  await page.getByPlaceholder('请输入原密码').fill('Old123!@');
  await page.getByPlaceholder('至少 8 位，含字母、数字和符号').fill('New123!@');
  await page.getByPlaceholder('请再次输入新密码').fill('New123!@');
  await page.locator('button[type="submit"]').click();
  await expect(page.getByText('密码修改成功！即将跳转至登录页...')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await page.getByRole('link', { name: '返回登录' }).click();
  await page.getByPlaceholder('请输入邮箱').fill('admin@example.com');
  await page.getByPlaceholder('请输入密码').fill('admin@123456');
  await page.locator('button[type="submit"]').click();
  await expect(page.locator('.showcase-page')).toBeVisible();
  // Poll beyond the previous timer deadline; a stale callback would return to login.
  await expect(async () => {
    await page.waitForTimeout(2200);
    expect(new URL(page.url()).hash).toBe('#/home');
  }).toPass({ timeout: 4000 });
});

test('closing a pending UMD analysis does not repopulate a reopened dialog', async ({ page }) => {
  let release!: () => void;
  const responseReady = new Promise<void>(resolve => {
    release = resolve;
  });
  await page.route('**/slow.umd.js*', async route => {
    await responseReady;
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
      window.__KIVII_UMD_REGISTRY__ ??= { byUrl: {}, byFileName: {} };
      window.__KIVII_UMD_REGISTRY__.byUrl[document.currentScript.src] = {
        manifest: { libName: 'LatePackage', version: '1.0.0', componentsDetailed: [{ name: 'LatePanel' }] }
      };
    `,
    });
  });
  await page.goto('/#/umd-management');
  await page.getByRole('button', { name: '分析 UMD 包', exact: true }).click();
  const input = page.getByPlaceholder(
    '请输入远程 UMD 文件的 URL，例如: https://example.com/component.umd.js'
  );
  await input.fill(new URL('/slow.umd.js', page.url()).href);
  const requested = page.waitForRequest('**/slow.umd.js*');
  await page.getByRole('button', { name: '读取远程文件' }).click();
  await requested;
  await page.getByRole('button', { name: '关闭分析弹窗' }).click();
  await page.getByRole('button', { name: '分析 UMD 包', exact: true }).click();
  const received = page.waitForResponse('**/slow.umd.js*');
  release();
  await received;
  await expect(input).toHaveValue('');
  await expect(page.getByText('暂无分析记录，请在上方输入URL或上传文件')).toBeVisible();
  await expect(page.getByText('LatePackage', { exact: true })).toHaveCount(0);
});

test('UMD activation remains visible when the new script fails to load', async ({ page }) => {
  let activated = false;
  let feedback = '';
  page.on('dialog', async dialog => {
    feedback = dialog.message();
    await dialog.accept();
  });
  await page.route('**/api/dashboard-functions/umd-versions', route =>
    route.fulfill({
      json: {
        Results: [
          {
            id: 'version',
            name: 'Example',
            version: '1.0.0',
            original_name: 'example.js',
            size: 12,
            sha256: 'a'.repeat(64),
            created_at: '2026-10-08',
            file_available: true,
            is_current: activated,
          },
        ],
      },
    })
  );
  await page.route('**/api/dashboard-functions/umd-versions/version/activate', route => {
    activated = true;
    return route.fulfill({ json: { Results: { sourceUrl: '/missing-version.umd.js' } } });
  });
  await page.route('**/missing-version.umd.js*', route =>
    route.fulfill({ status: 503, body: 'unavailable' })
  );
  await page.goto('/#/umd-management');
  await page.getByRole('button', { name: '启用版本' }).click();
  await expect(page.getByText('当前版本', { exact: true })).toBeVisible();
  await expect.poll(() => feedback).toContain('版本已启用，但组件加载失败');
});

test('failed inline menu saves keep the edited value and display feedback', async ({ page }) => {
  await page.route('**/api/dashboard-admin/admin/menus', route =>
    route.fulfill({ status: 503, json: { message: '模拟保存失败' } })
  );
  await page.goto('/#/system/menu-config');
  const editor = page.locator('.menu-config');
  await editor.getByText('示例页面', { exact: true }).first().dblclick();
  const input = editor.getByPlaceholder('显示名称', { exact: true });
  await input.fill('未保存的页面名称');
  await input.press('Enter');
  await expect(editor.getByText('保存失败：模拟保存失败')).toBeVisible();
  await editor.getByRole('button', { name: '确定', exact: true }).click();
  await expect(input).toHaveValue('未保存的页面名称');
});

test('saving a related menu does not erase the root form draft', async ({ page }) => {
  await page.goto('/#/system/menu-config');
  const editor = page.locator('.menu-config');
  const rootTitle = editor.locator('.field-input').first();
  await expect(rootTitle).toHaveValue('工作台');
  await rootTitle.fill('根目录未保存草稿');
  await editor.getByText('示例页面', { exact: true }).first().dblclick();
  const input = editor.getByPlaceholder('显示名称', { exact: true });
  await input.fill('已保存页面名称');
  await input.press('Enter');
  await expect(editor.getByText('已保存页面名称', { exact: true })).toBeVisible();
  await expect(rootTitle).toHaveValue('根目录未保存草稿');
});

for (const path of ['/missing-page/nested?source=direct', '/404']) {
  test(`renders 404 on initial navigation to ${path}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.goto(`/#${path}`);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveURL(/#\/404(?:\?source=direct)?$/);
    expect(errors).toEqual([]);
  });
}

test('unknown SPA routes render 404 and allow navigation back to home', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/#/home');
  const home = page.getByRole('heading', { name: '一次远程模块如何进入工作台' });
  await expect(home).toBeVisible();
  for (const path of ['/missing-page/nested', '/404']) {
    await page.evaluate(path => { window.location.hash = `#${path}`; }, path);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await expect(page).toHaveURL(/#\/404$/);
    await page.evaluate(() => { window.location.hash = '#/home'; });
    await expect(home).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('404 remains available after logout and login rebuild the dynamic routes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/#/home');
  await expect(page.getByRole('heading', { name: '一次远程模块如何进入工作台' })).toBeVisible();
  await page.getByRole('button', { name: 'Admin' }).hover();
  await page.getByText('退出登录', { exact: true }).click();
  await expect(page).toHaveURL(/#\/login$/);
  await page.getByPlaceholder('请输入邮箱').fill('admin@example.com');
  await page.getByPlaceholder('请输入密码').fill('admin@123456');
  await page.locator('.login-form button[type="submit"]').click();
  await expect(page.getByRole('heading', { name: '一次远程模块如何进入工作台' })).toBeVisible();
  await page.evaluate(() => { window.location.hash = '#/missing-after-login'; });
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page).toHaveURL(/#\/404$/);
  expect(errors).toEqual([]);
});

const workspaceResource = /vendor-(?:echarts|sfc-loader|kivii)|vue3-sfc-loader|echarts|\/umd-showcase\/|\/bootstrap\/workspace/;

test('login renders without requesting workspace resources or runtime menus', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('/#/login');
  await expect(page.getByText('安全登录', { exact: true })).toBeVisible();
  await page.getByText('没有账号？去注册', { exact: true }).click();
  await expect(page.getByText('创建账号', { exact: true })).toBeVisible();
  expect(requests.filter(url => workspaceResource.test(url))).toEqual([]);
  expect(requests.filter(url => /\/menus\/runtime|\/me\/roles/.test(url))).toEqual([]);
  if (process.env.E2E_PREVIEW) {
    const scripts = [...new Set(requests.map(url => new URL(url).pathname))]
      .filter(path => path.endsWith('.js'));
    const compressedBytes = scripts.reduce((total, path) =>
      total + gzipSync(readFileSync(join(process.cwd(), 'dist', path))).byteLength, 0);
    console.log(`Login JavaScript: ${(compressedBytes / 1024).toFixed(1)} KiB gzip`);
    expect(compressedBytes).toBeLessThan(200 * 1024);
  }

});

test('unauthenticated business entry loads login first and reloads once to its target after login', async ({ page }) => {
  let authenticated = false;
  await page.route('**/api/auth/refresh', route => authenticated
    ? route.fallback()
    : route.fulfill({ status: 401, json: { message: 'Unauthenticated' } }));
  await page.route('**/api/auth/login', async route => {
    authenticated = true;
    await route.fallback();
  });
  const requests: string[] = [];
  let documents = 0;
  page.on('request', request => {
    requests.push(request.url());
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
  });

  await page.goto('/#/system/menu-config');
  await expect(page.getByText('安全登录', { exact: true })).toBeVisible();
  expect(requests.filter(url => workspaceResource.test(url))).toEqual([]);
  expect(documents).toBe(1);
  await page.evaluate(() => {
    localStorage.setItem('DYNAMIC_ROUTES_CACHE', 'legacy-routes');
    localStorage.setItem('kivii-tabs', 'legacy-tabs');
  });
  await page.getByPlaceholder('请输入邮箱').fill('admin@example.com');
  await page.getByPlaceholder('请输入密码').fill('admin@123456');
  await page.locator('.login-form button[type="submit"]').click();
  await expect(page.locator('.menu-config')).toBeVisible();
  await expect(page).toHaveURL(/#\/system\/menu-config$/);
  expect(documents).toBe(2);
  expect(await page.evaluate(() => ({
    routes: localStorage.getItem('DYNAMIC_ROUTES_CACHE'),
    tabs: localStorage.getItem('kivii-tabs'),
  }))).toEqual({ routes: null, tabs: null });
  expect(requests.some(url => /\/umd-showcase\//.test(url))).toBe(true);
});

test('profile uses the authenticated user and persists display name and private avatar across reload', async ({ page }) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=', 'base64');
  const user = { id: 'profile-user', name: '张三', email: 'zhangsan@example.com', role: 'super_admin', avatarFileId: null as string | null };
  let avatarAuthorization = '';
  const legacyRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('/Restful/')) legacyRequests.push(request.url());
  });
  await page.addInitScript(() => {
    (window as any).KiviiContext = { CurrentMember: { FullName: '旧 Kivii 用户', Avatar: '/legacy-avatar.png' } };
  });
  await page.route('**/api/auth/refresh', route => route.fulfill({ json: {
    status: 200, message: 'success', Results: { accessToken: 'a'.repeat(43), expiresIn: 900, user },
  } }));
  await page.route('**/api/users/me', route => {
    if (route.request().method() === 'PATCH') user.name = route.request().postDataJSON().name;
    return route.fulfill({ json: { status: 200, message: 'success', Results: user } });
  });
  await page.route('**/api/users/me/avatar', route => {
    if (route.request().method() === 'POST') {
      user.avatarFileId = 'avatar-file';
      return route.fulfill({ json: { status: 201, message: 'success', Results: user } });
    }
    avatarAuthorization = route.request().headers().authorization;
    return route.fulfill({ contentType: 'image/png', body: png });
  });

  await page.goto('/#/home');
  const header = page.locator('header').first();
  await expect(header.getByRole('button', { name: '张三', exact: true })).toBeVisible();
  await header.getByRole('button', { name: '张三', exact: true }).hover();
  await page.getByText('个人中心', { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '个人中心' });
  await dialog.getByRole('button', { name: '修改显示名称', exact: true }).click();
  await dialog.getByPlaceholder('请输入显示名称').fill('李四');
  await dialog.getByRole('button', { name: '保存显示名称', exact: true }).click();
  await expect(dialog.getByText('显示名称更新成功', { exact: true })).toBeVisible();
  await expect(header.getByRole('button', { name: '李四', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭个人中心' }).click();
  await header.getByRole('button', { name: '李四', exact: true }).hover();
  await page.getByText('个人中心', { exact: true }).click();
  await dialog.locator('input[type="file"]').first().setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: png });
  await dialog.getByRole('button', { name: '保存头像', exact: true }).click();
  await expect(dialog.getByText('头像更新成功', { exact: true })).toBeVisible();
  await expect.poll(() => avatarAuthorization).toBe(`Bearer ${'a'.repeat(43)}`);
  await expect.poll(() => header.locator('img[alt="avatar"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await page.reload();
  await expect(header.getByRole('button', { name: '李四', exact: true })).toBeVisible();
  await expect.poll(() => header.locator('img[alt="avatar"]').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  expect(legacyRequests).toEqual([]);
});

test('profile write failures are shown without changing the displayed name or avatar', async ({ page }) => {
  const message = '演示账号为只读，不能修改数据';
  await page.route('**/api/users/me', route => route.fulfill({ status: 403, json: { message } }));
  await page.route('**/api/users/me/avatar', route => route.fulfill({ status: 403, json: { message } }));
  await page.goto('/#/home');
  const header = page.locator('header').first();
  await header.getByRole('button', { name: 'Admin', exact: true }).hover();
  await page.getByText('个人中心', { exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '个人中心' });
  await dialog.getByRole('button', { name: '修改显示名称', exact: true }).click();
  await dialog.getByPlaceholder('请输入显示名称').fill('不会保存');
  await dialog.getByRole('button', { name: '保存显示名称', exact: true }).click();
  await expect(dialog.getByText(message, { exact: true })).toBeVisible();
  await expect(header.getByRole('button', { name: 'Admin', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '修改头像', exact: true }).click();
  await dialog.locator('input[type="file"]').first().setInputFiles({
    name: 'avatar.png', mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=', 'base64'),
  });
  await dialog.getByRole('button', { name: '保存头像', exact: true }).click();
  await expect(dialog.getByText(message, { exact: true })).toBeVisible();
  await expect(header.locator('img[alt="avatar"]')).toHaveCount(0);
});
