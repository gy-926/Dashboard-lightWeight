# 动态路由获取与路由树重组说明

本说明总结 `/src/router/routes/index.ts` 中的“动态路由获取 + 菜单树重组 + 路由融合与转换”完整流程，并给出与 IframePage 的搭配用法及跨项目移植步骤。

## 模块目标
- 从后端按用户/系统配置获取菜单数据
- 将菜单数据重组为树形结构
- 依据树形结构生成符合前端路由的路由树
- 与静态/自定义路由融合为最终的“常量 + 认证”路由集合
- 输出为 Vue Router 可用的路由记录，并与 IframePage 组件协同渲染

## 数据来源与初始化
- 等待全局配置：`waitForGlobalConfig()` 等待 `window.uiGlobalConfig.InternalCode` 就绪
- API 构造：`/Restful/Kivii.Basic.Entities.Menu/Show.json?RootInternalCode=${InternalCode}`
- 拉取根菜单：`getRootMenu(apiUrl)`，结果包含 `MenusMain.Results` 与 `MenuRoot`
- 代码参考：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L200-L358)

## 缓存策略
- 缓存路由：`cacheDynamicRoutes(routes, globalConfig)` 将生成的路由、时间戳、用户信息写入 localStorage
- 尝试恢复：`restoreDynamicRoutesFromCache()` 校验 24 小时有效期、用户一致性、InternalCode 一致性
- 清除缓存：`clearDynamicRoutesCache()`
- 启动时恢复：模块加载时即尝试恢复；若失败则稍后主动生成
- 代码参考：
  - 写入缓存：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L225-L262)
  - 恢复缓存：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L264-L318)
  - 启动恢复：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L779-L795)

## 菜单到树：getMenuThree
- 输入：`MenusMain.Results` 扁平菜单数组
- 根节点识别：`ParentKvid` 为 null/undefined 或未在数据集中出现的项
- 递归构建：`buildChildren(parentKvid)`，为每个父项填充 `children`
- 统计分析：最大深度、总节点、叶子/容器/功能节点计数，便于调试与监控
- 代码参考：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L419-L540)

## 路由生成：generateRoutes
- 输入：树形菜单数据（根数组）
- 根级路由：
  - `name`: 如果 `Type === 'System'`，用类型；否则用 `Kvid`
  - `path`: `Type === 'System'` → `/${Type}`；否则 `/${Kvid}`
  - `component`: `layout.base`（布局）
  - `meta`: `{ title, icon, order, keepAlive: true }`
- 子路由：`generateChildRoutes(children, parentPath, parentName)`
  - 生成 `routeName` / `routePath`
    - `Type === 'System'`：按 `Remark`（首斜杠剔除）拼接父路径与父名
    - 其他：使用 `Kvid`
  - 容器 vs 页面：
    - 容器（有 `children`）：`component: 'layout.base'`，继续递归生成子路由
    - 页面（有 `FunctionKvid` 或叶子节点）：`component: 'view.iframe-page'`
  - 容器兼页面（既有 children 又有 FunctionKvid）：
    - 在 children 数组头部添加一个“默认子页面”：
      - `path: ''` 默认子路由
      - `component: 'view.iframe-page'`
      - `props: { url, kvid, functionKvid, type }`
      - `meta.type = 'iframe'`
  - 页面 props（用于 IframePage 渲染）：
    - `url`: `Type === 'System'` 用 `Remark`；否则为空由后续查询填充
    - `kvid`, `functionKvid`, `type`
    - `meta.type = 'iframe'`
- 代码参考：
  - 根级生成：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L656-L692)
  - 子级生成与默认子页面：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L551-L654)

## 自定义路由融合：getDynamicCustomRoutes
- 来源：`window.uiGlobalConfig.customRouteManager.getRoutes()`
- 生成规则：
  - `name: custom_${routeId}`
  - `path: config.path`
  - `component: 'layout.base'`
  - 子路由命名：`custom_${routeId}_detail`
  - 子路由 `component: 'view.iframe-page'`
  - `props: { url: config.handler, kvid: routeId, type: config.type, ...config.props }`
  - 统一 `meta.keepAlive` 与 `meta.type = config.type`
- 代码参考：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L694-L739)

## 路由集合与转换
- 组合路由：`createStaticRoutes()`
  - `dynamicCustomRoutes + dynamicMenuRoutes + generatedRoutes` → 分拣为常量路由与认证路由
  - 返回 `{ constantRoutes, authRoutes }`
- 转换为 Vue 路由记录：`getAuthVueRoutes(routes)`
  - 使用 `transformElegantRoutesToVueRoutes(routes, layouts, views)` 完成组件映射与结构转换
  - `layouts/views` 定义位置：[router/elegant/imports.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/elegant/imports.ts)
- 代码参考：
  - 路由集合：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L741-L759)
  - 路由转换：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L766-L768)

## 生成时机与刷新策略
- 启动时：
  - 先尝试从缓存恢复；失败则稍后生成（延迟 500ms，等待 `uiGlobalConfig` 更充分初始化）
- 首次生成后的刷新：
  - 通过 `sessionStorage.hasReloadedAfterRouteGen` 避免无限刷新
  - 首次生成后延迟触发 `window.location.reload()`，确保路由挂载与权限上下文一致
- 代码参考：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts#L396-L408)

## 与 IframePage 的搭配
- IframePage 入口视图按 `type` 渲染：
  - `webview`：拼接 `routeQuery` 到 URL，iframe 渲染
  - `extjs`：使用 `url` 作为 `Ext.create()` 的名称渲染 ExtJS 组件
  - `vue`：通过 `vue3-sfc-loader` 加载远程 `.vue`，或映射为本地内置组件
- 路由 props 对应关系：
  - `url/kvid/functionKvid/type` 直接由动态路由生成逻辑注入
  - 自定义路由还会传递 `config.props` 给子视图，可在 IframePage 中转交
- TeleportManager 协作：
  - IframePage 为每个页面实例生成唯一 ID，注册与激活，控制显示与清理
- 参考文件：
  - IframePage 入口：[iframe-page/[url].vue](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/views/_builtin/iframe-page/%5Burl%5D.vue)
  - TeleportManager：[teleport-manager.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/store/modules/teleport-manager.ts)

## 跨项目移植步骤
1. 复制核心逻辑：
   - `routes/index.ts` 中的 `waitForGlobalConfig`、`generateDynamicRoutes`、`getMenuThree`、`generateRoutes`、`getDynamicCustomRoutes`、`createStaticRoutes`、`getAuthVueRoutes`
2. 调整服务端 API：
   - 校准 `getRootMenu` 与后端返回结构（至少包含 `MenusMain.Results`）
3. 合并静态路由：
   - 你的项目的静态路由（常量）合并到 `generatedRoutes`；或替换为你自己的生成方式
4. 映射布局与视图：
   - 在你的项目中提供 `layouts` 与 `views` 的组件映射（对应 `layout.base` 与 `view.iframe-page` 等）
5. 接入 IframePage：
   - 使用本文档的 IframePage 模块说明，按 `props` 注入与 `type` 分支渲染
6. 设置缓存策略（可选）：
   - 根据业务调整 `localStorage` 的封存/恢复策略与时效
7. 启动生成与刷新（可选）：
   - 若首屏需要依赖动态路由，保留“首次生成后刷新”策略，或改为路由层重载

## 常见问题
- 菜单 Remark 的前导斜杠：已在生成逻辑中剔除（`/^\\//`），确保路径拼接正确
- 容器节点兼页面：通过默认子路由 `path: ''` 承载页面，避免丢失功能入口
- 自定义路由管理器：当 `customRouteManager` 不可用时自动降级到静态 `customRoutes`

## 参考代码位置
- 动态路由总览：[routes/index.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/routes/index.ts)
- 布局与视图映射：[elegant/imports.ts](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/src/router/elegant/imports.ts)
- IframePage 搭配文档：[iframe-page-module.md](file:///Users/_suesusan/kivii/Kivii2024Project/Vue-Dashboard/docs/iframe-page-module.md)
