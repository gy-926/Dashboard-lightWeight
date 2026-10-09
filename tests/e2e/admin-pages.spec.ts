import { expect, test, type Page } from '@playwright/test';

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
