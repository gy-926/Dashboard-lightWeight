# Dashboard Nest API

该目录是 `Dashboard-lightWeight-Api` 的自建后端模块，提供用户认证、无感续期、登录限制、菜单和权限管理、本地文件存储以及 UMD 导入与版本控制。

## 从仓库根目录启动

首次运行：

```bash
cp server/.env.example server/.env
```

填写 MySQL 配置并启动 MySQL，然后选择：

```bash
pnpm dev       # 先启动 API，再启动前端
pnpm dev:api   # 只启动 API
pnpm dev:web   # 只启动前端
```

`pnpm dev` 和 `pnpm dev:api` 会自动安装缺失的 API 依赖、执行迁移并确认本地演示管理员。

## 在本目录单独启动

```bash
cp .env.example .env
npm install
npm run dev:ready
```

默认只监听 `127.0.0.1:3000`。生产环境必须配置 HTTPS 证书。

## 验证

```bash
npm test
npm run test:e2e
npm run build
npm run lint
```

接口说明见仓库根目录的 `docs/self-hosted-api.md`，后端实现记录位于本目录的 `doc/`。
