# Dashboard Nest API

该目录是 `Dashboard-lightWeight-Api` 的自建后端模块，提供用户认证、无感续期、登录限制、菜单和权限管理、本地文件存储以及 UMD 导入与版本控制。

## 随完整演示启动

在仓库根目录运行：

```bash
docker compose -f docker-compose.demo.yml up --build
```

已安装 pnpm 时也可以运行 `pnpm demo`。

Docker Compose 会启动 MySQL、执行迁移、启动 API 并初始化演示管理员，不需要手工创建数据库。

## 单独开发

需要 Node.js 24 和 MySQL。复制环境变量并填写数据库连接：

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

默认只监听 `127.0.0.1:3000`；需要从容器或局域网监听时显式设置 `HOST`。生产环境必须配置 HTTPS 证书。

## 验证

```bash
npm test
npm run test:e2e
npm run build
npm run lint
```

接口说明见仓库根目录的 `docs/self-hosted-api.md`，后端实现记录位于本目录的 `doc/`。
