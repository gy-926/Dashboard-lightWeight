# IframePage 模块与路由集成说明

本说明文档总结 `/src/views/_builtin/iframe-page/` 整个模块的架构、路由搭配用法、状态管理与资源回收策略，并提供在其他项目中实现该复杂功能的移植步骤与示例。

## 模块概览
- 统一承载三种页面形态：
  - Webview：使用 iframe 加载任意 URL
  - ExtJS：使用全局 `Ext` 创建并渲染 ExtJS 组件
  - Vue 动态组件：通过远程加载 `.vue` 文件或内部映射动态渲染
- 核心入口视图：IframePage，根据路由参数决定渲染分支
- 全局挂载点：通过 Teleport 将内容渲染到布局中的 `#extjs-root`
- 路由形态兼容：静态内置路由、后端菜单驱动的动态路由、自定义/桥接路由

## 文件职责
- 入口视图：[iframe-page/[url].vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/%5Burl%5D.vue)
  - 接收路由 props：`url`、`kvid`、`type`、`routeQuery`
  - 根据 `type` 选择渲染器：webview、extjs、vue
  - 自定义路由场景中，将 `routeQuery` 写入 `window.customRouteParamsManager`（key 为 `route.fullPath`），供子组件读取
  - 使用 `useTeleportManager` 生成页面实例 ID，注册、激活、切换显示，监听标签关闭事件触发清理
  - 支持使用 `vue3-sfc-loader` 远程加载 `.vue` 组件
- Webview 渲染器：[webview.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/webview.vue)
  - 延迟渲染 iframe，支持更新 `src` 与彻底销毁，避免闪烁和残留活动
  - 与 TeleportManager 协作，状态上报与显示控制
- ExtJS 渲染器：[extJs.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/extJs.vue)
  - 依赖全局 `Ext`，创建 `Ext.panel.Panel` 并动态替换 `items`，提供完全清理的 `destroy`
- 动态 Vue 渲染器：[vueComponent.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/vueComponent.vue)
  - 通过 `component :is` 渲染远程或映射的组件，提供加载/错误态
  - 使用 Naive UI 的 `NConfigProvider` 接入全局主题，兼容暗色与主题覆盖

## 布局挂载点
- 布局文件：[base-layout/index.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/layouts/base-layout/index.vue#L137)
- 关键容器：
  ```html
  <div id="extjs-root" style="width: 100%; height: 100%"></div>
  ```
- 三类渲染器均通过 `<Teleport to="#extjs-root">` 将自身 DOM 渲染到该挂载点，保证与布局统一协调

## 路由搭配使用
- 静态内置路由（由 elegant 生成）：
  - 声明位置：[router/elegant/routes.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/elegant/routes.ts#L46-L61)
  - 形态：`name: 'iframe-page'`, `path: '/iframe-page/:url'`, `component: 'layout.base$view.iframe-page'`, `props: true`, `meta.keepAlive: true`
- 动态菜单路由（后端菜单驱动）：
  - 生成逻辑：[router/routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L585-L654)
  - 为页面子路由统一承载 `view.iframe-page`，并注入 `props: { url, kvid, functionKvid, type }`，`meta.type = 'iframe'`
- 自定义/桥接路由：
  - 自定义管理器：[custom-route-manager.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/utils/custom-route-manager.ts#L254-L297)
  - 桥接适配器：[bridge-router-adapter.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/utils/bridge-router-adapter.ts#L109-L144)
  - 子路由统一命名为 `*_detail`，props 注入 `handler/url`、`kvid`、`type` 与路由查询参数

## 渲染流程（入口视图）
1. 路由命中 IframePage，注入 `{ url, kvid, type, routeQuery }`
2. 生成页面实例 ID 并注册到 TeleportManager
3. 判断是否自定义路由（`custom_*` 或 `bridge_*`）：
   - `webview`：将 `routeQuery` 拼接到 URL，选择 `WebviewComponent` 延迟渲染 iframe
   - `extjs`：使用 `url` 作为 `Ext.create` 的组件名称，选择 `ExtJsComponent`
   - `vue`：使用 `vue3-sfc-loader` 按 `backendOrigin + url` 动态加载 `.vue` 文件，选择 `VueComponent`
4. 资源回收：在标签关闭或组件卸载时调用各子组件的 `cleanup`，清理 DOM、定时器与实例

## TeleportManager（状态与切换）
- 文件位置：[store/modules/teleport-manager.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/store/modules/teleport-manager.ts)
- 核心方法：
  - `generatePageId(url, kvid, type)`：生成唯一页面实例 ID
  - `registerPage(id, type, url)` / `unregisterPage(id)`：注册/注销页面
  - `requestActivation(id)` / `debouncedRequestActivation(id)`：请求激活页面（带互斥锁与队列）
  - `shouldShowPage(id)`：判定当前实例是否显示
  - `updatePageStatus(id, status)`：上报 `pending/loading/ready/active/hidden`
  - `getActivePage()`：获取当前活动页面信息
- 设计要点：
  - 切换互斥锁 + 队列，避免并发切换引起的竞态
  - 组件侧通过 `watchEffect` 观察激活状态，延迟渲染避免闪烁

## 参数传递（自定义路由场景）
- 在 `type === 'vue'`、自定义路由场景下：
  - 将 `routeQuery` 写入 `window.customRouteParamsManager[route.fullPath] = { params, routeId, timestamp }`
  - 设置 `window.currentCustomRouteKey = route.fullPath`
  - 子组件可通过工具读取当前路由参数（建议在目标项目中实现一个 `getCurrentRouteParams()` 助手）

## 远程组件加载（Vue 动态渲染）
- 使用 `vue3-sfc-loader` 通过 URL 加载远程 `.vue` 文件并渲染：
  - 入口实现参照：[iframe-page/[url].vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/%5Burl%5D.vue#L153-L185)
- 内部组件映射（可选）：
  - `internalComponents` 对象可注册内置组件名，优先加载本地以减少网络依赖

## 集成到其他项目（移植步骤）
1. 复制渲染器与入口视图：
   - 复制以下文件至目标项目并修正路径别名：
     - `src/views/_builtin/iframe-page/[url].vue`
     - `src/views/_builtin/iframe-page/webview.vue`
     - `src/views/_builtin/iframe-page/extJs.vue`
     - `src/views/_builtin/iframe-page/vueComponent.vue`
2. 在布局中加入全局挂载点：
   - 在你的基础布局加入：
     ```html
     <div id="extjs-root" style="width: 100%; height: 100%"></div>
     ```
   - 所有渲染器将通过 `<Teleport to="#extjs-root">` 渲染内容
3. 引入并注册 TeleportManager：
   - 复制 `src/store/modules/teleport-manager.ts` 并在 Pinia 中注册
   - 组件通过 `useTeleportManager()` 与其协作
4. 路由配置形态：
   - 静态内置路由：
     ```ts
     // 示例（Vue Router）
     {
       name: 'iframe-page',
       path: '/iframe-page/:url',
       component: BaseLayout, // 你的基础布局
       children: [
         {
           name: 'iframe-page-detail',
           path: 'detail',
           component: IframePage, // 即 [url].vue
           props: route => ({ url: route.params.url as string, kvid: '', type: 'webview', routeQuery: route.query }),
           meta: { keepAlive: true }
         }
       ]
     }
     ```
   - 动态菜单路由（后端驱动）的页面节点统一承载到 IframePage，并按需注入 `props`
   - 自定义/桥接路由可参考本项目的管理器实现，核心是 `layout + IframePage + props`
5. 远程组件加载：
   - 安装 `vue3-sfc-loader`，并在入口视图中沿用 `loadModule(url, options)` 加载远程 `.vue`
6. 可选增强：PDF 预览
   - 如需在页面内一并提供 PDF 预览能力，可参考本项目插件：
     - 插件位置：[src/plugins/pdfjs-preview.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/plugins/pdfjs-preview.ts)
     - 在 `main.ts` 安装后可通过 `window.$pdfjsPreview.quickPreview(el, url)` 调用

## 事件与资源回收
- 标签关闭事件：入口视图通过 `useEventBus('tab-close')` 监听，并仅在关闭的标签对应当前实例时触发清理
- 统一清理：各渲染器暴露 `cleanup()`，入口在卸载与场景切换时调用，确保释放 DOM/定时器与外部实例
- Webview 特殊处理：销毁前先将 `iframe.src = 'about:blank'` 再移除，降低残留网络活动

## 依赖与前置条件
- 必需：Vue3、Pinia、@vueuse/core（事件总线）、（可选）Naive UI（主题承载）
- 自定义路由参数：建议实现 `customRouteParamsManager` 与读取助手，避免多标签场景下参数混乱
- ExtJS 分支：需要在目标项目中确保全局 `Ext` 可用

## 最小接入示例（Webview 场景）
```ts
// 路由
{
  name: 'iframe-page',
  path: '/iframe-page/:url',
  component: BaseLayout,
  children: [
    {
      name: 'iframe-page_detail',
      path: 'detail',
      component: IframePage,
      props: r => ({ url: r.params.url as string, type: 'webview', routeQuery: r.query }),
      meta: { keepAlive: true }
    }
  ]
}
```
```vue
<!-- 布局中加入挂载点 -->
<div id="extjs-root" style="width: 100%; height: 100%"></div>
```

## 参考代码位置
- IframePage 入口：[iframe-page/[url].vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/%5Burl%5D.vue)
- Webview 渲染器：[webview.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/webview.vue)
- ExtJS 渲染器：[extJs.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/extJs.vue)
- Vue 动态渲染器：[vueComponent.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/vueComponent.vue)
- 布局挂载点：[base-layout/index.vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/layouts/base-layout/index.vue#L137)
- TeleportManager：[teleport-manager.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/store/modules/teleport-manager.ts)
