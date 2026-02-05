# KiviiBridge OpenTab 使用指南

## 概述

`kivii.openTab` 提供标签页打开功能，支持默认实现和自定义实现。

## API 列表

| 方法 | 说明 |
|------|------|
| `open(url, options)` | 打开外部 URL 或内部路径 |
| `openPath(path, options)` | 打开内部路径 |
| `openByKvid(kvid, options)` | 通过 kvid 打开功能模块 |

## 使用方式

### 1. 默认实现

```typescript
// 打开外部链接
kivii.openTab.open('https://example.com');

// 打开内部路径
kivii.openTab.openPath('/dashboard');
```

### 2. 自定义实现

```typescript
import { IOpenTab } from '@kivii.com/bridge';

class CustomOpenTab extends IOpenTab {
  open(url, options) {
    // 自定义打开逻辑
    console.log('自定义打开:', url);
    return true;
  }

  openPath(path) {
    // 自定义路径打开逻辑
    console.log('自定义路径:', path);
    return true;
  }
}

// 注册自定义实现
kivii.register(new CustomOpenTab());
```

### 3. 项目集成（KiviiOpenTab）

项目已实现 `KiviiOpenTab` 类，统一管理 IframePage 三种渲染类型的标签页打开：

**文件结构：**
```
src/
├── bridge/
│   └── kivii-open-tab.ts  # 自定义 OpenTab 实现
└── main.ts                 # 注册自定义实现
```

**核心功能：**
- `open()` - 识别外部 URL 或内部路径
- `openPath()` - 内部路径导航 + 标签页添加
- `openByKvid()` - 通过 kvid 打开功能模块

**初始化流程：**
```typescript
// main.ts
import { KiviiOpenTab } from './bridge/kivii-open-tab'

if ((window as any).kivii) {
  (window as any).kivii.register(new KiviiOpenTab())
}
```

### 4. 快捷函数

项目提供了快捷函数：

```typescript
import { openTab, openTabPath, openTabByKvid } from '@/bridge/kivii-open-tab'

// 打开 URL
openTab('https://example.com')

// 打开路径
openTabPath('/dashboard')

// 通过 kvid 打开
openTabByKvid('analysis_overview')
```

### 5. 完整示例

```typescript
import { kiviiBridge } from '@kivii.com/bridge';

class CustomOpenTab extends IOpenTab {
  open(url, options) {
    // 在新窗口中打开
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }

  openPath(path) {
    // 使用路由跳转
    window.location.hash = path;
    return true;
  }
}

// 注册
kiviiBridge.register(new CustomOpenTab());

// 使用
kiviiBridge.openTab.open('https://example.com');
kiviiBridge.openPath('/dashboard');
```

## 接口定义

```typescript
interface IOpenTab {
  open(url: string, options?: any): Promise<boolean>;
  openPath(path: string, options?: any): Promise<boolean>;
  openByKvid?(kvid: string, options?: any): Promise<boolean>;
}

interface OpenTabOptions {
  newTab?: boolean;
  activateExisting?: boolean;
}
```

## IframePage 渲染类型

IframePage 支持两种渲染类型，统一通过 kiviiBridge.openTab 管理：

| 类型 | 说明 | 渲染组件 |
|------|------|----------|
| webview | iframe 渲染外部/内部页面 | `webview.vue` |
| vue | 远程 Vue 组件渲染 | `vueComponent.vue` |

**页面类型判断规则：**
1. `functionKvid` 以 `.vue` 结尾 → Vue 组件
2. 其他情况 → WebView（iframe）

**打开方式统一为：**
```typescript
// 所有类型都可以通过这种方式打开
kivii.openTab.open('/analysis/overview');
kivii.openTab.openPath('/content/article');
```

## 注意事项

- `register()` 之后所有 `openTab` 调用都会使用自定义实现
- 自定义实现需要继承 `IOpenTab` 并实现所有方法
- 方法返回值 `true` 表示成功，`false` 表示失败
- 内部路径会自动添加到标签页列表

## 菜单系统集成

项目中的所有页面打开入口都已集成 `kivii.openTab`：

| 组件 | 位置 | 打开方式 |
|------|------|----------|
| 侧边栏菜单 | `src/layouts/modules/global-menu/index.vue` | `openPath()` |
| 顶部菜单 | `src/layouts/modules/global-menu/GlobalTopMenu.vue` | `openPath()` |
| 面包屑导航 | `src/layouts/modules/global-breadcrumb/index.vue` | `openPath()` |
| 标签页切换 | `src/layouts/modules/global-tab/index.vue` | `openPath()` |

**使用场景示例：**
```typescript
// 在 Vue 组件中使用
import { useKiviiOpenTab } from '@/composables/useKiviiOpenTab'

const { openPath, openByKvid } = useKiviiOpenTab()

// 点击菜单打开页面
await openPath('/analysis/overview')

// 通过 kvid 打开
await openByKvid('analysis_overview')
```

## 在 IframePage 中使用

### 1. WebView 中使用

在 `webview.vue` 加载的页面中，可以通过 `window.kivii` 调用：

```typescript
// 在 iframe 内部的页面中
// 打开外部链接
window.kivii.openTab.open('https://example.com');

// 打开内部路径
window.kivii.openTab.openPath('/dashboard');
```

### 2. Vue 组件中使用

在远程 Vue 组件中使用：

```typescript
// 打开路径
(window as any).kivii.openTab.openPath('/analysis/report');

// 通过 kvid 打开
(window as any).kivii.openTab.openByKvid ?
  (window as any).kivii.openTab.openByKvid('analysis_overview') :
  false;
```

### 3. 项目内部使用

使用 composable 统一管理：

```typescript
import { useKiviiOpenTab } from '@/composables/useKiviiOpenTab'

const { openTab, openPath, openByKvid, openMenuItem } = useKiviiOpenTab()

// 打开路径
await openPath('/dashboard')

// 打开菜单项
await openMenuItem(menuItem)

// 通过 kvid 打开
await openByKvid('analysis_overview')
```

## 内部实现原理

```
┌─────────────────────────────────────────────────────────┐
│                      主窗口                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │  window.kivii                                   │   │
│  │  ├── openTab                                   │   │
│  │  │   ├── open(url, options)                    │   │
│  │  │   ├── openPath(path, options)               │   │
│  │  │   └── openByKvid(kvid, options)            │   │
│  │  └── register(impl)                            │   │
│  └─────────────────────────────────────────────────┘   │
│                        ↓                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  KiviiOpenTab (自定义实现)                      │   │
│  │  ├── router.push(path)                         │   │
│  │  └── menuStore.addTab(menuItem)                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  IframePage (webview / extjs / vue)                     │
└─────────────────────────────────────────────────────────┘
```
