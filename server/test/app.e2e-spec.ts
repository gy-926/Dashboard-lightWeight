import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter.js';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor.js';
import { User, UserRole } from './../src/users/entities/user.entity.js';
import { verifyPassword } from './../src/auth/password.js';
import { LoginAttempt } from './../src/auth/entities/login-attempt.entity.js';
import { tokenHash } from './../src/auth/auth.service.js';
import { FilesService } from './../src/files/files.service.js';

describe('AppController (e2e)', () => {
  // 完整 Nest 应用实例，用于从 HTTP 层测试接口。
  let app: INestApplication<App>;
  const createdIds: string[] = [];
  const createdEmails: string[] = [];
  const password = 'A-long-test-password-123';

  async function registerAndLogin() {
    const email = `auth-${crypto.randomUUID()}@example.com`;
    const created = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Auth Test', email, password })
      .expect(201);
    createdIds.push(created.body.Results.id);
    createdEmails.push(email);
    const loggedIn = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return { email, created, loggedIn };
  }

  beforeEach(async () => {
    // 导入真实 AppModule，建立与正式应用相同的模块结构。
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // 创建应用但不监听真实端口，Supertest 会直接调用 HTTP Server。
    app = moduleFixture.createNestApplication();

    // e2e 测试不会执行 main.ts，因此要手动注册与正式应用相同的全局组件。
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  // 验证根路径的原始业务数据会被全局拦截器包装成统一 JSON。
  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect({
        status: 200,
        message: 'success',
        Results: {
          message: 'NestJS 学习开始',
          author: 'Gavin',
        },
        Total: 1,
      });
  });

  it('/users (GET) accepts sorting and pagination', async () => {
    const { loggedIn } = await registerAndLogin();
    const response = await request(app.getHttpServer())
      .get('/users?sortBy=email&sortOrder=DESC&take=2')
      .set('Authorization', `Bearer ${loggedIn.body.Results.accessToken}`)
      .expect(200);

    expect(response.body.status).toBe(200);
    expect(Array.isArray(response.body.Results)).toBe(true);
    expect(response.body.Results.length).toBeLessThanOrEqual(2);
    expect(typeof response.body.Total).toBe('number');
  });

  it('/users (GET) rejects an unsupported sort field', async () => {
    const { loggedIn } = await registerAndLogin();
    const response = await request(app.getHttpServer())
      .get('/users?sortBy=password')
      .set('Authorization', `Bearer ${loggedIn.body.Results.accessToken}`)
      .expect(400);

    expect(response.body.status).toBe(400);
    expect(response.body.Results).toBeNull();
  });

  it('/users stores timestamps and can sort by creation time', async () => {
    const { created, loggedIn } = await registerAndLogin();
    const userId = created.body.Results.id;
    const accessToken = loggedIn.body.Results.accessToken;
    expect(Date.parse(created.body.Results.createdAt)).not.toBeNaN();
    expect(Date.parse(created.body.Results.updatedAt)).not.toBeNaN();

    const updated = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Timestamp Updated' })
      .expect(200);

    expect(updated.body.Results.createdAt).toBe(created.body.Results.createdAt);
    expect(Date.parse(updated.body.Results.updatedAt)).toBeGreaterThanOrEqual(
      Date.parse(created.body.Results.updatedAt),
    );

    const fetched = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(fetched.body.Results.updatedAt).toBe(updated.body.Results.updatedAt);

    await request(app.getHttpServer())
      .get('/users?sortBy=createdAt&sortOrder=DESC&take=1')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('hashes passwords, rotates tokens, and revokes sessions after password change', async () => {
    const { email, created, loggedIn } = await registerAndLogin();
    const userId = created.body.Results.id;
    expect(created.body.Results).not.toHaveProperty('password');
    expect(created.body.Results).not.toHaveProperty('passwordHash');
    expect(loggedIn.body.Results.user).not.toHaveProperty('passwordHash');

    const stored = await app
      .get(DataSource)
      .getRepository(User)
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: userId })
      .getOneOrFail();
    expect(stored.passwordHash).not.toBe(password);
    expect(await verifyPassword(password, stored.passwordHash!)).toBe(true);

    const oldAccess = loggedIn.body.Results.accessToken;
    expect(String(loggedIn.headers['set-cookie'])).toContain('HttpOnly');
    expect(String(loggedIn.headers['set-cookie'])).toContain('SameSite=Strict');
    const oldCookie = String(loggedIn.headers['set-cookie']).split(';')[0];
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${oldAccess}`)
      .expect(200);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(200);
    const newAccess = refreshed.body.Results.accessToken;
    const newCookie = String(refreshed.headers['set-cookie']).split(';')[0];
    expect(newAccess).not.toBe(oldAccess);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${oldAccess}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(401);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${newAccess}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', `Bearer ${newAccess}`)
      .send({ oldPassword: password, newPassword: 'A-different-password-456' })
      .expect(200);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${newAccess}`)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', newCookie)
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);
    const loginAgain = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'A-different-password-456' })
      .expect(200);
    const activeCookie = String(loginAgain.headers['set-cookie']).split(';')[0];
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', activeCookie)
      .expect(200);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginAgain.body.Results.accessToken}`)
      .expect(401);
  });

  it('requires a password and prevents access to another user account', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'No Password', email: 'no-password@example.com' })
      .expect(400);
    await request(app.getHttpServer()).get('/users').expect(401);

    const first = await registerAndLogin();
    const second = await registerAndLogin();
    const token = first.loggedIn.body.Results.accessToken;
    const otherId = second.created.body.Results.id;
    const ownList = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(ownList.body.Results.map((user: User) => user.id)).toEqual([
      first.created.body.Results.id,
    ]);
    expect(ownList.body.Total).toBe(1);
    await request(app.getHttpServer())
      .get(`/users/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/users/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Unauthorized Change' })
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/users/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    const legacy = await app
      .get(DataSource)
      .getRepository(User)
      .save({
        name: 'Legacy',
        email: `legacy-${crypto.randomUUID()}@example.com`,
        passwordHash: null,
      });
    createdIds.push(legacy.id);
    createdEmails.push(legacy.email);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: legacy.email, password })
      .expect(401);
  });

  it('accepts eight-character complex passwords and rejects missing character classes', async () => {
    const email = `policy-${crypto.randomUUID()}@example.com`;
    for (const weak of ['Abcdef12', 'Abcdef!@', '123456!@', 'Ab1!']) {
      await request(app.getHttpServer())
        .post('/users')
        .send({ name: 'Policy Test', email, password: weak })
        .expect(400);
    }
    const created = await request(app.getHttpServer())
      .post('/users')
      .send({ name: 'Policy Test', email, password: 'Abc123!@' })
      .expect(201);
    createdIds.push(created.body.Results.id);
    const loggedIn = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Abc123!@' })
      .expect(200);
    const auth = `Bearer ${loggedIn.body.Results.accessToken}`;
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', auth)
      .send({ oldPassword: 'Abc123!@', newPassword: 'Newpass12' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/auth/change-password')
      .set('Authorization', auth)
      .send({ oldPassword: 'Abc123!@', newPassword: 'New123!@' })
      .expect(200);
  });

  it('lets a super administrator read all users but not edit another account', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Unauthorized Admin',
        email: `admin-injection-${crypto.randomUUID()}@example.com`,
        password,
        role: UserRole.SuperAdmin,
      })
      .expect(400);
    const admin = await registerAndLogin();
    const other = await registerAndLogin();
    const adminId = admin.created.body.Results.id;
    const otherId = other.created.body.Results.id;
    await app
      .get(DataSource)
      .getRepository(User)
      .update({ id: adminId }, { role: UserRole.SuperAdmin });
    const token = admin.loggedIn.body.Results.accessToken;
    const list = await request(app.getHttpServer())
      .get('/users')
      .query({
        queryKeys: 'email',
        queryValue: other.email,
        queryMode: 'exact',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const ids = list.body.Results.map((user: User) => user.id);
    expect(ids).toEqual([otherId]);
    await request(app.getHttpServer())
      .get(`/users/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/users/${otherId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Not Allowed' })
      .expect(403);
  });

  it('locks an email after 10 failed logins for 15 minutes', async () => {
    const account = await registerAndLogin();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: account.email, password: 'wrong-password' })
        .expect(401);
    }
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password })
      .expect(429);

    const emailHash = tokenHash(account.email.toLowerCase());
    await app
      .get(DataSource)
      .getRepository(LoginAttempt)
      .update(
        { emailHash },
        {
          lockedUntil: new Date(Date.now() - 1000),
          windowStartedAt: new Date(Date.now() - 16 * 60 * 1000),
        },
      );
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: account.email, password })
      .expect(200);
    expect(
      await app
        .get(DataSource)
        .getRepository(LoginAttempt)
        .findOneBy({ emailHash }),
    ).toBeNull();
  });

  it('serves dashboard menus by role and restricts dashboard administration', async () => {
    const admin = await registerAndLogin();
    const member = await registerAndLogin();
    const db = app.get(DataSource);
    await db.getRepository(User).update({ id: admin.created.body.Results.id }, { role: UserRole.SuperAdmin });
    const adminToken = admin.loggedIn.body.Results.accessToken;
    const memberToken = member.loggedIn.body.Results.accessToken;
    const suffix = crypto.randomUUID();
    const root = `root-${suffix}`;
    const feature = `feature-${suffix}`;
    const menu = `menu-${suffix}`;
    const role = `role-${suffix}`;
    const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
    try {
      await request(app.getHttpServer()).get('/dashboard-admin/admin/menu-config').set(auth(memberToken)).expect(403);
      await request(app.getHttpServer()).post('/dashboard-functions').set(auth(adminToken)).send({ kvid: feature, handler: '/demo', title: 'Demo', render_type: 'webview', source_type: 'manual' }).expect(200);
      await request(app.getHttpServer()).post('/dashboard-admin/admin/menu-roots').set(auth(adminToken)).send({ kvid: root, title: 'Root', internal_code: root }).expect(200);
      await request(app.getHttpServer()).post('/dashboard-admin/admin/menus').set(auth(adminToken)).send({ kvid: menu, title: 'Menu', menu_root_kvid: root, type: 'Page', function_kvid: feature }).expect(200);
      const before = await request(app.getHttpServer()).get('/dashboard-admin/menus/runtime').query({ internalCode: root }).set(auth(memberToken)).expect(200);
      expect(before.body.Results.MenusMain.Total).toBe(0);
      await request(app.getHttpServer()).post('/dashboard-admin/admin/roles').set(auth(adminToken)).send({ kvid: role, code: role, name: 'Tester' }).expect(200);
      await request(app.getHttpServer()).put(`/dashboard-admin/admin/roles/${role}/functions`).set(auth(adminToken)).send({ functionKvids: [feature] }).expect(200);
      await request(app.getHttpServer()).put(`/dashboard-admin/admin/users/${member.created.body.Results.id}/roles`).set(auth(adminToken)).send({ roleKvids: [role] }).expect(200);
      const after = await request(app.getHttpServer()).get('/dashboard-admin/menus/runtime').query({ internalCode: root }).set(auth(memberToken)).expect(200);
      expect(after.body.Results.MenusMain.Results[0].Handler).toBe('/demo');
      expect(after.body.Results.MenusMain.Total).toBe(1);
    } finally {
      await db.query('DELETE FROM dashboard_user_roles WHERE role_kvid = ?', [role]);
      await db.query('DELETE FROM dashboard_role_functions WHERE role_kvid = ?', [role]);
      await db.query('DELETE FROM dashboard_menus WHERE kvid = ?', [menu]);
      await db.query('DELETE FROM dashboard_roles WHERE kvid = ?', [role]);
      await db.query('DELETE FROM dashboard_menu_roots WHERE kvid = ?', [root]);
      await db.query('DELETE FROM dashboard_functions WHERE kvid = ?', [feature]);
    }
  });

  it('stores files privately and lets the owner download and delete them', async () => {
    const owner = await registerAndLogin();
    const other = await registerAndLogin();
    const ownerToken = owner.loggedIn.body.Results.accessToken;
    const otherToken = other.loggedIn.body.Results.accessToken;
    const content = Buffer.from('private file content');
    const uploaded = await request(app.getHttpServer())
      .post('/files')
      .set('Authorization', `Bearer ${ownerToken}`)
      .attach('file', content, { filename: '测试 file.txt', contentType: 'text/plain' })
      .expect(201);
    const fileId = uploaded.body.Results.id;
    expect(uploaded.body.Results.originalName).toBe('测试 file.txt');
    expect(uploaded.body.Results.size).toBe(content.length);
    expect(uploaded.body.Results).not.toHaveProperty('storedName');

    const ownerList = await request(app.getHttpServer())
      .get('/files')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(ownerList.body.Results.some((file: { id: string }) => file.id === fileId)).toBe(true);

    const otherList = await request(app.getHttpServer())
      .get('/files')
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(200);
    expect(otherList.body.Results.some((file: { id: string }) => file.id === fileId)).toBe(false);
    await request(app.getHttpServer())
      .get(`/files/${fileId}/download`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .delete(`/files/${fileId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);

    const download = await request(app.getHttpServer())
      .get(`/files/${fileId}/download`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect('Content-Type', /text\/plain/);
    expect(download.text).toBe(content.toString());
    await request(app.getHttpServer())
      .delete(`/files/${fileId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/files/${fileId}/download`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('imports a UMD file into the function list and keeps switchable versions', async () => {
    const admin = await registerAndLogin();
    const db = app.get(DataSource);
    const files = app.get(FilesService);
    await db.getRepository(User).update({ id: admin.created.body.Results.id }, { role: UserRole.SuperAdmin });
    const auth = { Authorization: `Bearer ${admin.loggedIn.body.Results.accessToken}` };
    const moduleKey = `e2e-umd-${crypto.randomUUID()}`;
    const fileIds: string[] = [];
    const manifest = {
      libName: moduleKey,
      zhName: 'E2E UMD',
      version: '1.0.0',
      componentsDetailed: [{ name: 'E2eWidget', zhName: 'E2E Widget', icon: 'fas fa-cube' }],
    };

    try {
      const first = await request(app.getHttpServer())
        .post('/dashboard-functions/import-umd')
        .set(auth)
        .field('moduleKey', moduleKey)
        .field('name', 'E2E UMD')
        .field('version', '1.0.0')
        .field('manifest', JSON.stringify(manifest))
        .field('components', JSON.stringify(manifest.componentsDetailed))
        .attach('file', Buffer.from('window.__e2eUmdVersion = "1.0.0";'), { filename: 'e2e.umd.js', contentType: 'text/javascript' })
        .expect(200);
      fileIds.push(first.body.Results.file.id);
      expect(first.body.Results.imported).toBe(1);

      const functions = await request(app.getHttpServer()).get('/dashboard-functions').set(auth).expect(200);
      const imported = functions.body.Results.find((item: { source_module: string }) => item.source_module === moduleKey);
      expect(imported.handler).toBe('<E2eWidget />');
      expect(imported.source_url).toBe(first.body.Results.sourceUrl);

      const asset = await request(app.getHttpServer()).get(first.body.Results.sourceUrl.replace(/^\/api/, '')).expect(200);
      expect(asset.text).toContain('__e2eUmdVersion');

      const secondManifest = { ...manifest, version: '2.0.0' };
      const second = await request(app.getHttpServer())
        .post('/dashboard-functions/import-umd')
        .set(auth)
        .field('moduleKey', moduleKey)
        .field('name', 'E2E UMD')
        .field('version', '2.0.0')
        .field('manifest', JSON.stringify(secondManifest))
        .field('components', JSON.stringify(secondManifest.componentsDetailed))
        .attach('file', Buffer.from('window.__e2eUmdVersion = "2.0.0";'), { filename: 'e2e.umd.js', contentType: 'text/javascript' })
        .expect(200);
      fileIds.push(second.body.Results.file.id);

      const versions = await request(app.getHttpServer()).get('/dashboard-functions/umd-versions').query({ moduleKey }).set(auth).expect(200);
      expect(versions.body.Results).toHaveLength(2);
      expect(versions.body.Results.find((item: { version: string }) => item.version === '2.0.0').is_current).toBe(true);

      await request(app.getHttpServer()).put(`/dashboard-functions/umd-versions/${first.body.Results.versionId}/activate`).set(auth).expect(200);
      const activated = await db.query('SELECT source_url FROM dashboard_functions WHERE source_module = ?', [moduleKey]);
      expect(activated[0].source_url).toBe(first.body.Results.sourceUrl);
    } finally {
      await db.query('DELETE FROM dashboard_functions WHERE source_module = ?', [moduleKey]);
      await db.query('DELETE v FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id WHERE p.module_key = ?', [moduleKey]);
      await db.query('DELETE FROM dashboard_umd_packages WHERE module_key = ?', [moduleKey]);
      for (const fileId of fileIds) await files.removeStored(fileId);
    }
  });

  afterEach(async () => {
    for (const email of createdEmails.splice(0)) {
      await app
        .get(DataSource)
        .getRepository(LoginAttempt)
        .delete({ emailHash: tokenHash(email.toLowerCase()) });
    }
    for (const id of createdIds.splice(0)) {
      await app.get(DataSource).getRepository(User).delete({ id });
    }
    // 每个测试结束后关闭应用，释放数据库连接等资源。
    await app.close();
  });
});
