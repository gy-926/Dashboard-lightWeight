# Dashboard 自建接口

`Dashboard-lightWeight-Api` 分支通过本目录的 Nest 接口读取功能、菜单和权限数据。前端配置 `VITE_API_BASE_URL=/api`；本地 Vite 默认监听 `127.0.0.1:5173`，将 `/api` 代理到 Nest 的 `127.0.0.1:3000`。Vite 同时把刷新 cookie 路径 `/auth` 改写为 `/api/auth`。部署时需配置同样的代理与 cookie 路径改写，并运行 MySQL 迁移。

```bash
./node_modules/.bin/typeorm-ts-node-esm migration:run -d data-source.ts
npm run start:dev
```

所有响应使用 `{ "status": 200, "message": "success", "Results": ..., "Total": 1 }`；错误时 `Results=null`，`message` 为错误文字。下列业务接口在请求头传 `Authorization: Bearer <accessToken>`。登录返回的 `accessToken` 保存在前端内存中；刷新令牌由 HTTP-only cookie 承载。前端遇到 401 会调用 `/auth/refresh` 并重试一次。部署时让前端和 API 处于同一站点，设置实际的 `FRONTEND_ORIGIN`，并通过 HTTPS 提供服务，以便 `SameSite=Strict` 的刷新 cookie 生效。

## 认证与用户

```bash
curl -X POST http://127.0.0.1:3000/users -H 'Content-Type: application/json' \
  -d '{"name":"Alice","email":"alice@example.com","password":"A-unique-password-123!"}'
curl -c cookies.txt -X POST http://127.0.0.1:3000/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"A-unique-password-123!"}'
curl -b cookies.txt -c cookies.txt -X POST http://127.0.0.1:3000/auth/refresh
curl -H 'Authorization: Bearer <accessToken>' http://127.0.0.1:3000/auth/me
curl -H 'Authorization: Bearer <accessToken>' -H 'Content-Type: application/json' \
  -d '{"oldPassword":"A-unique-password-123!","newPassword":"Another-password-456!"}' \
  http://127.0.0.1:3000/auth/change-password
```

认证细节、10 次登录限制和超级管理员设置见 [认证与无感续期.md](./认证与无感续期.md)。旧的无密码账号仍无法登录。Dashboard 的管理端点只允许 `users.role=super_admin`；普通用户只能读取自己的角色及权限过滤后的运行菜单。

## 功能接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/dashboard-functions` | 按排序值和标题列出功能 |
| POST | `/dashboard-functions` | 按 `kvid` 新增或更新 |
| PATCH | `/dashboard-functions/:kvid` | 更新指定字段 |
| DELETE | `/dashboard-functions/:kvid` | 删除 |
| POST | `/dashboard-functions/import` | 导入最多 100 条 UMD 功能；请求体 `{ "items": [...] }` |

功能记录字段：`kvid,title,handler,remark,parameters,render_type,source_type,source_module,source_url,source_component,icon,sort_order,is_active`。`render_type` 可为 `webview|vue|umd`，`source_type` 可为 `manual|umd|system`。

```bash
curl -H 'Authorization: Bearer <accessToken>' -H 'Content-Type: application/json' \
  -d '{"kvid":"demo","title":"示例","handler":"/demo","render_type":"webview","source_type":"manual","sort_order":1,"is_active":true}' \
  http://127.0.0.1:3000/dashboard-functions
```

## 菜单与权限接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/dashboard-admin/me/roles` | 当前用户角色 |
| GET | `/dashboard-admin/menus/runtime?internalCode=...` | 当前用户可见菜单 |
| GET | `/dashboard-admin/menus/autostart?menuRootKvid=...` | 自动启动菜单的 `kvid` 或 null |
| GET | `/dashboard-admin/admin/menu-config` | 所有菜单根、菜单、功能 |
| POST/DELETE | `/dashboard-admin/admin/menu-roots[/:kvid]` | 保存或删除菜单根 |
| POST | `/dashboard-admin/admin/menus` | 保存菜单 |
| POST | `/dashboard-admin/admin/menus/bulk` | 请求体 `{ "items": [...] }`，最多 200 条 |
| DELETE | `/dashboard-admin/admin/menus/:kvid` | 删除菜单 |
| GET | `/dashboard-admin/admin/permissions` | 角色、角色功能、用户角色、用户列表 |
| POST/DELETE | `/dashboard-admin/admin/roles[/:kvid]` | 保存或删除角色 |
| PUT | `/dashboard-admin/admin/roles/:kvid/functions` | 请求体 `{ "functionKvids": [...] }`，完整替换 |
| PUT | `/dashboard-admin/admin/users/:userId/roles` | 请求体 `{ "roleKvids": [...] }`，完整替换 |

除前三个 GET 外均要求超级管理员。`/menus/runtime` 使用前端运行时需要的 `MenuRoot`、`MenusMain.Results` 格式。

### UMD 文件导入与版本

超级管理员可在 UMD Runtime Lab 上传 `.js` 文件。导入使用 `multipart/form-data` 调用 `POST /dashboard-functions/import-umd`：

- `file`：UMD JavaScript 文件。
- `manifest`：UMD manifest JSON 对象字符串。
- `components`：组件清单 JSON 数组字符串。
- `moduleKey`：同一组件库各版本共用的稳定标识。
- `name`：组件库显示名称。
- `version`：版本号，同一 `moduleKey` 下不可重复。

文件会写入本地 `FILE_STORAGE_ROOT`，元数据写入 `stored_files`；版本写入 `dashboard_umd_packages` 和 `dashboard_umd_versions`。清单内的组件会新增或更新到 `dashboard_functions`，当前版本的 JS 地址保存在 `source_url`。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/dashboard-functions/umd-versions?moduleKey=...` | 查看全部或指定模块的版本记录 |
| PUT | `/dashboard-functions/umd-versions/:id/activate` | 将历史版本切换为当前版本 |
| GET | `/dashboard-assets/:versionId/:fileName` | 加载不可变的本地 UMD 文件 |

切换版本会更新同一 `source_module` 下全部 UMD 功能的 `source_url`。菜单运行时响应会把该地址放入 `Remark`，前端 PageHost 据此按需加载当前 JS 文件。

## 数据初始化与演示

TypeORM 迁移创建用户、会话、登录限制、文件、Dashboard 功能、菜单、角色、权限绑定和 UMD 版本表，并写入示例角色、菜单根及 iframe 示例。

完整仓库的 Docker Compose 演示会在迁移完成后调用注册接口创建演示账号，再将该账号设置为超级管理员。独立运行 API 时不会自动创建超级管理员；请先注册用户，再按 `认证与无感续期.md` 中的方式由数据库管理员授予角色。

随前端发布的 UMD 示例位于 `public/umd-showcase`。用户在 UMD Runtime Lab 导入的脚本由本 API 保存到 `FILE_STORAGE_ROOT`，并通过版本化的 `/dashboard-assets/:versionId/:fileName` 地址提供。
