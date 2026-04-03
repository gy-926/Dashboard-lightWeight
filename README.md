<p align="center">
  <h1 align="center">Kivii Admin Dashboard</h1>
  <p align="center">一个基于 Vue 3 + TypeScript + Vite + Tailwind CSS 的轻量级中后台管理系统模板</p>
  <p align="center">A lightweight admin dashboard template built with Vue 3 + TypeScript + Vite + Tailwind CSS</p>
</p>

<p align="center">
  <a href="https://github.com/gy-926/Dashboard-lightWeight/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  </a>
  <img src="https://img.shields.io/badge/vue-3.5-42b883.svg" alt="Vue 3" />
  <img src="https://img.shields.io/badge/vite-7.0-646cff.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/typescript-5.8-3178c6.svg" alt="TypeScript" />
  <img src="https://img.shields.io/badge/tailwindcss-3.4-38bdf8.svg" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/pnpm-recommended-f69220.svg" alt="pnpm" />
</p>

---

## ✨ 核心特性 / Features

- 🚀 **现代技术栈** — Vue 3.5 + TypeScript 5.8 + Vite 7.0 + Pinia
- 🎨 **原子化样式** — Tailwind CSS 3.4 + FontAwesome 6.7
- 🛣️ **动态路由** — 基于后端接口的动态菜单生成与权限控制
- 🧩 **远程组件** — 支持 UMD 格式远程组件动态加载（Teleport 方案）
- 📱 **多布局主题** — 侧边栏、顶部菜单、混合模式，支持暗色模式
- 📑 **标签页管理** — 多标签页操作 + 右键菜单 + 持久化存储
- 🔒 **权限控制** — 基于 Token 的登录认证与路由守卫
- 🔌 **桥接集成** — `@kivii.com/bridge` 宿主环境通信支持

## 🛠️ 技术栈 / Tech Stack

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue | 3.5.17 |
| 构建工具 | Vite | 7.0.0 |
| 类型系统 | TypeScript | 5.8.0 |
| 状态管理 | Pinia | 2.3.0 |
| 路由管理 | Vue Router | 4.5.1 |
| 样式框架 | Tailwind CSS | 3.4.1 |
| 远程加载 | vue3-sfc-loader | 0.9.5 |
| 包管理器 | pnpm | ≥ 8.0.0 |

## 📁 项目结构 / Project Structure

```
src/
├── bridge/                 # Kivii Bridge 桥接层
├── composables/            # 组合式函数 (Hooks)
├── layouts/                # 布局组件
│   ├── base-layout/        # 基础布局框架
│   └── modules/            # 布局模块 (Header, Sider, Tab, Menu)
├── router/                 # 路由配置
│   ├── guards.ts           # 路由守卫 (权限控制)
│   └── routes/             # 动态路由生成逻辑
├── store/                  # Pinia 状态管理
│   └── modules/
│       ├── global-menu/    # 菜单与主题状态
│       └── teleport-manager.ts  # 远程组件渲染管理器
├── styles/                 # 全局样式
├── utils/                  # 工具函数
└── views/                  # 页面视图
    ├── _builtin/           # 内置视图 (IframePage, UMD加载器)
    ├── login/              # 登录页
    └── ...                 # 业务页面
```

## 🚀 快速开始 / Quick Start

### 环境要求 / Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装与启动 / Install & Run

```bash
# 克隆项目
git clone https://github.com/gy-926/Dashboard-lightWeight.git
cd Dashboard-lightWeight

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建 / Build

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 📖 功能说明 / Features Guide

### 动态路由与菜单

登录后请求后端接口获取菜单数据，自动生成路由配置。支持 `Page`（页面）、`Folder`（目录）、`Link`（外链）等类型，菜单数据自动缓存。

### 远程组件加载 (UMD)

无需重新构建主应用即可扩展功能：
- 使用 `vue3-sfc-loader` 动态编译 `.vue` 文件
- 通过 `<script>` 标签加载 UMD 库
- 使用 `Teleport` 技术渲染远程组件到指定 DOM 节点

### 布局与主题

- **布局切换**：侧边栏布局 / 顶部菜单布局 / 混合布局
- **暗色模式**：一键切换，自动持久化用户偏好
- **标签页**：记录访问历史，支持右键菜单（关闭当前/其它/左侧/右侧/所有）

### 全局配置 (GlobalConfig)

通过 `window.uiGlobalConfig` 进行运行时配置：

| 字段 | 说明 |
|------|------|
| `Origin` | 后端 API 地址 |
| `UserCode` | 当前用户编码 |
| `IsAuthenticated` | 认证状态 |
| `DisplayName` | 系统名称 |

## 🤝 贡献指南 / Contributing

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

**Commit 规范** 参考 [Conventional Commits](https://www.conventionalcommits.org/)：
- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档变更
- `style:` 代码格式
- `refactor:` 重构
- `perf:` 性能优化
- `chore:` 构建/工具变更

## 📝 开发规范 / Code Style

- 使用 Vue 3 Composition API
- 组件文件使用 PascalCase（`UserProfile.vue`）
- 页面文件使用 kebab-case（`user-profile.vue`）
- 优先使用 Tailwind CSS 实用类，避免自定义样式
- 图标使用已集成的 FontAwesome

```vue
<template>
  <i class="fas fa-home"></i>
  <i class="fab fa-github"></i>
</template>
```

## 📄 License

本项目基于 [MIT License](./LICENSE) 开源。

---

<p align="center">
  如果这个项目对你有帮助，欢迎 ⭐ Star 支持！
</p>
