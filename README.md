# Kivii Vue3 模板

一个基于 Vue 3 + TypeScript + Vite + Tailwind CSS 的现代化前端开发模板，集成了自动路由、FontAwesome 图标库等开箱即用的功能。

## 🌐 在线体验

- 项目地址: [https://www.gavinyin.online/entry/umdDashboard](https://www.gavinyin.online/entry/umdDashboard)
- 登录账号: `admin@example.com`
- 登录密码: `admin@123456`

## ✨ 特性

- 🚀 **Vue 3** - 使用最新的 Vue 3 Composition API
- 📦 **TypeScript** - 完整的 TypeScript 支持
- ⚡ **Vite** - 极速的开发构建工具
- 🎨 **Tailwind CSS** - 实用优先的 CSS 框架
- 🛣️ **自动路由** - 基于文件系统的自动路由生成
- 🎯 **FontAwesome** - 丰富的图标库
- 🔧 **开发工具** - 集成 Vue DevTools
- 📱 **响应式设计** - 移动端优先的响应式布局

## 🛠️ 技术栈

- **前端框架**: Vue 3.5.17
- **构建工具**: Vite 7.0.0
- **类型系统**: TypeScript 5.8.0
- **样式框架**: Tailwind CSS 3.4.1
- **路由管理**: Vue Router 4.5.1
- **图标库**: FontAwesome 6.7.2
- **包管理器**: pnpm

## 📁 项目结构

```
kivii-vue3-template/
├── public/                 # 静态资源
│   └── favicon.ico
├── src/
│   ├── components/         # 组件目录
│   ├── composables/        # 组合式函数
│   ├── router/            # 路由配置
│   │   └── auto/          # 自动生成的路由
│   ├── styles/            # 样式文件
│   │   └── tailwind.css   # Tailwind CSS
│   ├── types/             # TypeScript 类型定义
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   │   ├── home.vue       # 首页
│   │   └── 404.vue        # 404 页面
│   ├── App.vue            # 根组件
│   └── main.ts            # 应用入口
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
├── tailwind.config.js     # Tailwind 配置
└── tsconfig.json          # TypeScript 配置
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

### 在线项目地址

- 项目地址: [https://www.gavinyin.online/entry/umdDashboard](https://www.gavinyin.online/entry/umdDashboard)
- 演示账号: `admin@example.com`
- 演示密码: `admin@123456`

### 构建生产版本

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 类型检查

```bash
# 运行 TypeScript 类型检查
pnpm type-check
```

## 📖 使用指南

### 路由系统

项目使用 `@wemt/vue3-auto-router` 实现基于文件系统的自动路由：

- 在 `src/views/` 目录下创建 `.vue` 文件即可自动生成路由
- 文件名对应路由路径（如 `about.vue` 对应 `/about`）
- 支持嵌套路由和动态路由

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
