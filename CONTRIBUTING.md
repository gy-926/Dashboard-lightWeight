# 贡献指南

欢迎通过 Issue 讨论问题和改进，通过 Pull Request 提交修改。较大的功能调整请先说明使用场景和预期行为。

## 本地开发

- 完整开发环境：Node.js 24、pnpm 10、MySQL 8 或兼容版本。
- 前端依赖：在仓库根目录执行 `pnpm install --frozen-lockfile`。
- 复制 `.env.example` 为 `.env`，复制 `server/.env.example` 为 `server/.env`，填写本机数据库信息。
- `pnpm dev` 会安装缺失的后端依赖、执行数据库迁移、自动初始化演示管理员，再启动前后端。
- `pnpm dev:web` 只启动前端；`pnpm dev:api` 只启动 API。

本项目是演示版本，保留默认演示管理员和演示菜单。API 开发端口在 `server/.env` 的 `PORT` 中设置，开发代理和启动检查会同步使用；进程环境变量优先。不要提交本地环境文件、数据库内容、存储文件和测试产物。

## 验证修改

前端修改执行：

```bash
pnpm test
pnpm type-check
pnpm build-only
```

涉及页面、路由、登录和生命周期的修改，另执行：

```bash
pnpm exec playwright install chrome
pnpm test:e2e
```

本地默认使用 Chrome；CI 安装并使用 Playwright 自带 Chromium，并测试生产构建。需要在本地验证生产资源拆分时执行：

```bash
pnpm build-only
E2E_PREVIEW=1 pnpm test:e2e
```

登录资源测试会检查实际请求的 JavaScript 压缩体积和工作台资源隔离。浏览器测试模拟 API，不需要启动 MySQL 或执行演示初始化。失败诊断文件在 `test-results/`，CI 失败时会上传该目录。

后端修改在 `server/` 中执行：

```bash
npm ci
npm run lint
npm test
npm run build
```

`npm run test:e2e` 需要已完成迁移的独立测试数据库；它会写入测试数据，请按测试环境准备连接配置。

## 提交 Pull Request

说明修改解决的问题、用户可观察到的变化，以及执行过的验证。保持修改范围集中；修改配置或启动方式时同步更新示例和文档。数据库结构调整使用新增迁移，避免更改已经发布的迁移。

新增或替换 UMD、图片和其他分发资源时，在 `docs/asset-sources.md` 记录来源、版本和授权依据，保留原有版权及许可声明。请仅提交你有权贡献的内容；项目代码采用仓库根目录的 MIT 许可证。

安全问题请先阅读 [SECURITY.md](SECURITY.md)，不要在公开 Issue 中提交凭据或尚未修复的利用细节。
