# GavinYin Hub

一个经过持续试运行验证的 Vue 3 企业工作台，用统一的路由、标签、鉴权和运行时生命周期承载本地页面、远程 Vue SFC、UMD 业务组件与 iframe 系统。

本项目不是通用 Vue Admin 皮肤，也不是带 JavaScript 沙箱的通用微前端框架。它面向来源可信、技术栈可控的企业业务模块，强调低成本接入、单文件交付和渐进式集成。

## 在线体验

- 地址：[https://www.gavinyin.online/entry/umdDashboard](https://www.gavinyin.online/entry/umdDashboard)
- 演示账号：`admin@example.com`
- 演示密码：`admin@123456`

该账号仅用于功能演示，请勿填写真实或敏感信息。公开部署 Demo 时，应使用独立数据环境、限制高风险管理操作，并按需定期重置数据。

## 解决的问题

传统后台模板通常只负责本地页面。本项目进一步处理企业系统中常见的运行时接入问题：

- 后端菜单在登录后生成路由、标签和权限导航；
- 多个独立业务仓库以单文件 UMD 形式交付；
- 宿主统一提供 Vue、ECharts、Bridge、主题和基础布局；
- 远程组件异步注册后自动进入菜单和路由；
- 页面关闭、退出登录或权限变化时清理用户级运行状态；
- 通过兼容层继续承载远程 Vue SFC、iframe 和历史 UMD 协议。

## 核心能力

- **异构页面运行时**：本地 Vue、远程 Vue SFC、UMD/ESM 组件和 iframe 使用同一工作台导航。
- **UMD Registry**：支持按脚本 URL、文件名、显式全局变量和历史默认名称解析 UMD 导出。
- **Manifest 驱动菜单**：根据组件清单、中文名、图标和描述生成 UMD 菜单与路由。
- **多标签工作台**：统一处理打开、切换、刷新、关闭和批量关闭。
- **缓存与竞争保护**：远程 Vue 加载去重，并阻止已失效异步任务重新写入缓存。
- **会话隔离**：退出和重新认证后清理旧用户的标签、动态路由与页面运行时。
- **Supabase 鉴权**：使用 Supabase Auth、Edge Functions 和 RLS 管理菜单、角色与用户权限。
- **主题与响应式布局**：支持侧边、顶部和混合导航，以及亮色、暗色和窄屏布局。

## 主项目与 UMD 模板

完整体系由两个仓库组成：

| 仓库 | 职责 |
| --- | --- |
| [Dashboard-lightWeight](https://github.com/gy-926/Dashboard-lightWeight) | 宿主工作台、鉴权、动态路由、菜单、标签和远程组件运行时 |
| [Dashboard-lightWeight-UMDTemplate](https://github.com/gy-926/Dashboard-lightWeight-UMDTemplate) | 单文件 UMD 业务组件的开发、样式隔离、Manifest 和产物验证 |

```mermaid
flowchart LR
  Template[UMD 开发模板] --> Build[单文件 UMD<br/>Manifest + CSS]
  Build --> Registry[运行时 Registry]
  Registry --> Loader[宿主加载与注册]
  Loader --> Routes[动态菜单与路由]
  Routes --> Workspace[标签式工作台]
```

UMD 模板将 Vue、ECharts 和 `@kivii.com/bridge` 设为外部依赖，避免业务组件携带第二份运行时。宿主加载组件前提供兼容版本，并通过 `app.use()` 或具名导出完成注册。

## 技术栈

- Vue 3、TypeScript、Vite
- Vue Router、Pinia、VueUse
- Tailwind CSS、Font Awesome
- Supabase Auth、Database、RLS、Edge Functions
- Vitest
- `vue3-sfc-loader`
- `@kivii.com/bridge`

## 快速开始

### 环境要求

- Node.js 20.19 或更高版本
- pnpm 10（仓库锁定版本为 10.28.1）
- 如需运行本地 Supabase：Docker

### 安装与启动

```bash
git clone https://github.com/gy-926/Dashboard-lightWeight.git
cd Dashboard-lightWeight
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

在 `.env` 中填写自己的 Supabase 项目配置：

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

浏览器端只能使用 Supabase Anon Key。不要把 `SUPABASE_SERVICE_ROLE_KEY` 或其他服务端密钥写入 `.env`、前端代码或 Git。

### 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm test` | 运行 Vitest 回归测试 |
| `pnpm test:watch` | 监听模式运行测试 |
| `pnpm type-check` | 执行 Vue/TypeScript 类型检查 |
| `pnpm build` | 类型检查并生成生产构建 |
| `pnpm preview` | 预览生产构建 |
| `pnpm edge:serve` | 本地运行 Supabase Edge Functions |
| `pnpm edge:deploy` | 部署 Dashboard Edge Functions |

## Supabase 初始化

仓库提供菜单、权限、用户目录和 RLS 所需的 SQL 脚本，以及两个 Edge Function：

- `dashboard-functions`：读取当前用户可访问的功能与菜单；
- `dashboard-admin`：执行受管理员权限保护的菜单、角色和用户管理操作。

首次部署建议按以下顺序执行：

1. 创建或关联 Supabase 项目；
2. 根据 `scripts/` 中的初始化与升级脚本创建表、权限和 RLS；
3. 部署 `dashboard-functions` 与 `dashboard-admin`；
4. 验证新版前端能够通过 Edge Function 访问数据；
5. 最后执行 `scripts/secure-dashboard-for-edge-api.sql`，关闭浏览器对业务表的直接访问。

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <your-project-ref>
pnpm edge:deploy
```

管理员接口要求当前用户的 `app_metadata.role` 为 `admin`。Service Role Key 只能配置在 Supabase 服务端。

## UMD 接入契约

推荐使用配套模板构建业务 UMD。每个 UMD 至少应提供：

```ts
export const manifest = {
  libName: 'exampleLibrary',
  format: 'umd',
  fileName: 'example-library.umd.js',
  version: '1.0.0',
  components: ['ExamplePanel'],
  componentsDetailed: [
    {
      name: 'ExamplePanel',
      zhName: '示例面板',
      icon: 'fas fa-cube',
      description: '用于演示宿主运行时接入。',
    },
  ],
}
```

新模板产物会自动写入：

```ts
window.__KIVII_UMD_REGISTRY__.byUrl[scriptUrl]
window.__KIVII_UMD_REGISTRY__.byFileName[fileName]
```

旧系统仍可继续提供 `GlobalName`。宿主会按兼容顺序解析，不要求一次性迁移全部历史组件。

## 目录结构

```text
src/
├── api/                         Supabase Edge Function 客户端
├── bridge/                      Bridge 与宿主 OpenTab 适配
├── components/                  通用组件与重新登录弹窗
├── layouts/                     工作台布局、菜单、标签和主题
├── router/                      静态路由、动态路由与导航守卫
├── store/                       页面运行时与菜单配置状态
├── utils/remoteComponentLoader  UMD/ESM 加载、Registry 与注册
└── views/_builtin/iframe-page   iframe、远程 Vue 和 UMD 页面入口

supabase/functions/              Edge Functions
scripts/                         数据库、权限和 RLS 脚本
public/umd-showcase/             可公开运行的 UMD 示例
tests/                           Vitest 回归测试
docs/                            模块说明与实现记录
```

## 安全边界

远程 UMD、ESM 和 Vue SFC 与宿主共享页面权限，可以访问当前页面允许访问的 DOM、网络和全局对象。因此：

- 只加载受信任、经过审核的组件来源；
- 不要把本项目描述为第三方代码沙箱；
- 不可信页面应使用独立域名和受限 iframe；
- 生产环境应使用明确的资源白名单、HTTPS 和合适的 CSP；
- 演示账号必须与真实业务数据隔离，并限制高风险管理操作。

## 当前工程状态

项目已在服务器环境持续试运行并保持迭代。当前自动化基线覆盖页面身份传递、远程 Vue 缓存失效、异步加载代次和用户运行时清理。

仍在推进的方向包括：

- 扩充浏览器端到端测试；
- 为 Manifest 和远程协议建立共享类型；
- 拆分超大页面和加载器的职责；
- 增加 CI、Lint、运行时诊断和兼容矩阵；
- 逐步明确库缓存、页面实例和业务数据缓存的边界。

## 文档

- [远程组件加载](docs/remote-component-loading.md)
- [动态路由模块](docs/dynamic-routes-module.md)
- [iframe 与动态页面](docs/iframe-page-module.md)
- [Bridge OpenTab](docs/kivii-bridge-opentab.md)
- [实现分析](docs/implementation_analysis.md)

## 贡献

欢迎通过 Issue 提交问题、复现步骤和改进建议。提交代码前请至少运行：

```bash
pnpm test
pnpm type-check
pnpm build-only
```

修改 UMD 协议时，请同时验证旧 `GlobalName` 和新 Registry 两种加载方式。

## License

[MIT](LICENSE) © 2025 gy-926
