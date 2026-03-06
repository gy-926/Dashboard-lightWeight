# Kivii Admin Dashboard

一个基于 Vue 3 + TypeScript + Vite + Tailwind CSS 的现代化中后台管理系统模板。支持动态路由、UMD 远程组件加载、多主题布局切换以及标签页管理等企业级功能。

## ✨ 核心特性

- 🚀 **技术栈** - Vue 3.5 + TypeScript 5.8 + Vite 7.0 + Pinia
- 🎨 **UI 框架** - Tailwind CSS 3.4 + FontAwesome 6.7
- 🛣️ **动态路由** - 基于后端接口的动态菜单生成与权限控制
- 🧩 **远程组件** - 支持 UMD 格式的远程组件动态加载与渲染 (Teleport 方案)
- 📱 **多布局主题** - 内置三种布局模式（侧边栏、顶部菜单、混合模式）与暗色模式支持
- 📑 **标签页管理** - 支持多标签页操作、右键菜单（关闭当前/其它/左侧/右侧/所有）及持久化存储
- 🔌 **桥接集成** - 集成 `@kivii.com/bridge` 实现与宿主环境的通信
- 🔒 **权限控制** - 基于 Token 的登录认证与路由守卫

## 🛠️ 技术栈详情

- **前端框架**: Vue 3.5.17
- **状态管理**: Pinia 2.3.0 (集成持久化)
- **构建工具**: Vite 7.0.0
- **类型系统**: TypeScript 5.8.0
- **样式框架**: Tailwind CSS 3.4.1
- **路由管理**: Vue Router 4.5.1
- **远程加载**: vue3-sfc-loader
- **包管理器**: pnpm

## 📁 项目结构

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
│   ├── modules/
│   │   ├── global-menu/    # 菜单与主题状态
│   │   └── teleport-manager.ts # 远程组件渲染管理器
├── styles/                 # 全局样式
├── utils/                  # 工具函数
└── views/                  # 页面视图
    ├── _builtin/           # 内置视图 (IframePage, UMD加载器)
    ├── login/              # 登录页
    └── ...                 # 业务页面
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
# 使用 pnpm 安装依赖
pnpm install
```

### 开发模式

```bash
# 启动开发服务器
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 📖 功能指南

### 1. 动态路由与菜单

系统会在登录后请求后端接口获取菜单数据，并自动生成路由配置。

- 支持 `Page` (页面)、`Folder` (目录)、`Link` (外链) 等多种类型。
- 菜单数据会自动缓存，提升加载速度。

### 2. 远程组件加载 (UMD)

系统支持加载远程的 Vue 组件或 UMD 模块，无需重新构建主应用即可扩展功能。

- **原理**: 使用 `vue3-sfc-loader` 动态编译 `.vue` 文件，或通过 `<script>` 标签加载 UMD 库。
- **渲染**: 使用 `Teleport` 技术将远程组件渲染到指定 DOM 节点，实现高性能的微前端体验。

### 3. 布局与主题

- **布局切换**: 点击右上角设置图标，可在「侧边栏布局」、「顶部菜单布局」、「混合布局」之间切换。
- **暗色模式**: 支持一键切换深色/浅色主题，并自动持久化用户偏好。
- **标签页**: 顶部标签页记录用户访问历史，支持拖拽滚动和右键菜单管理。

### 4. 全局配置 (GlobalConfig)

系统支持通过 `window.uiGlobalConfig` 进行运行时配置，包括：

- `Origin`: 后端 API 地址
- `UserCode`: 当前用户编码
- `IsAuthenticated`: 认证状态
- `DisplayName`: 系统名称

### 样式开发

- 优先使用 Tailwind CSS 实用类
- 避免自定义样式，通过 Tailwind 类实现
- 如需自定义样式，使用 CSS 自定义属性
- 确保移动端适配

### 组件开发

- 使用 Vue 3 Composition API
- 组件文件使用 TypeScript
- 遵循 Vue 3 最佳实践

### 图标使用

项目已集成 FontAwesome，可以直接使用：

```vue
<template>
  <i class="fas fa-home"></i>
  <i class="fab fa-github"></i>
</template>
```

## 🔧 配置说明

### Vite 配置

- 支持 Vue 3 和 TypeScript
- 集成 Vue DevTools
- 配置路径别名 `@` 指向 `src` 目录
- 自动路由插件

### Tailwind 配置

- 扫描 `src` 目录下的所有 Vue、JS、TS 文件
- 支持响应式设计
- 可扩展主题配置

### TypeScript 配置

- 严格的类型检查
- 支持 Vue 3 类型推导
- 路径映射支持

## 📝 开发规范

### 代码风格

- 使用中文注释提高可读性
- 调试输出使用英文
- 优先使用 Tailwind CSS 类
- 响应式设计优先

### 文件命名

- 组件文件使用 PascalCase（如 `UserProfile.vue`）
- 页面文件使用 kebab-case（如 `user-profile.vue`）
- 工具函数使用 camelCase
