# 项目缺陷修复清单

> 按优先级排列，从高到低依次执行。每完成一项请勾选对应复选框。
> 最后更新：2026-02-26

---

## 🔴 P0 — 安全级别（必须优先修复）

### [ ] 1. 登录权限鉴定机制缺失

**文件：** `src/router/guards.ts`、`src/views/login/index.vue`

**问题：**
- 路由守卫只对 `/login` 做放行，其余所有页面无需认证即可访问
- 登录成功后未存储任何认证凭证（token / cookie）
- 认证检查是被动的（等 401 才跳转），而非每次路由切换主动校验

**修复目标：**
- 登录成功后将 token 写入 `localStorage` 或 `sessionStorage`
- `guards.ts` 在每次 `beforeEach` 中主动读取 token，无 token 则重定向 `/login`
- 已登录用户访问 `/login` 时自动跳转到首页或 `redirect` 参数指向的页面

---

### [ ] 2. Tab 持久化用户数据隔离失效

**文件：** `src/layouts/modules/global-menu/store.ts`

**问题：**
- `tabsList` 实时写入 `localStorage('kivii-tabs')`，但登出/重置时未清除
- `resetState()` 只清空内存，不清除 `localStorage`
- 项目完全缺少登出流程，用户切换后会恢复上一个用户的标签历史（数据泄露）

**修复目标：**
- 补充完整登出函数，调用时同步清除 `localStorage.removeItem('kivii-tabs')`
- `resetState()` 内部增加清除本地存储的逻辑
- 登录成功后（`reloadDynamicRoutes` 前）先调用登出清理函数

---

### [ ] 3. 路由缓存 UserCode 硬编码导致权限隔离失效

**文件：** `src/router/routes/index.ts`

**问题：**
- `defaultGlobalConfig.UserCode` 写死为 `'admin'`，缓存的用户隔离校验形同虚设
- 不同权限的用户会共享同一份路由缓存，权限变更后缓存不失效

**修复目标：**
- 登录成功后，从接口响应中获取真实 `UserCode`，调用 `setGlobalConfig({ UserCode: realUserCode })` 更新
- 确保 `setGlobalConfig` 在 `reloadDynamicRoutes` 之前执行，使缓存隔离生效

---

## 🟠 P1 — 功能级别（核心功能缺陷）

### [ ] 4. UMD 动态组件与菜单标签绑定机制缺失

**文件：** `src/router/routes/index.ts`、`src/views/_builtin/iframe-page/index.vue`、`src/utils/remoteComponentLoader.ts`

**问题：**
- UMD 组件通过 `app.component(name, comp)` 全局注册，与菜单 `FunctionKvid` 字段无映射关系
- `iframe-page/index.vue` 只区分 `vue`（SFC 加载）和 `webview`（iframe），无法渲染已全局注册的 UMD 组件
- 两套体系（UMD 全局注册 vs vue3-sfc-loader 远程加载）互不相通

**修复目标：**
- 在路由生成逻辑中增加第三种渲染类型（如 `component`），用于标识 UMD 全局组件
- 约定 `FunctionKvid` 命名规则（如 `UMD:ComponentName`）以区分 UMD 类型
- `iframe-page/index.vue` 增加对 `component` 类型的分支，通过 `resolveComponent(name)` 渲染已注册的全局组件
- 菜单 Tab 添加时携带渲染类型信息，保证标签切换时能正确激活对应组件

---

### [ ] 5. 硬编码后端 origin 导致多环境部署失败

**文件：** `src/views/_builtin/iframe-page/index.vue`，第 95 行

**问题：**
- `const origin = 'https://datav.kivii.org'` 硬编码，在测试/私有部署环境中所有 webview 加载失败

**修复目标：**
- 从配置文件（`vite.config.ts` 的环境变量 `import.meta.env.VITE_BACKEND_ORIGIN`）或 `globalConfig` 中读取 `backendOrigin`
- 兜底使用 `window.location.origin`，移除硬编码字符串

---

### [ ] 6. 关闭标签时 kvid 未传递导致 Vue 组件缓存无法清理（内存泄漏）

**文件：** `src/layouts/modules/global-menu/types.ts`（`transformRouteToMenu`）

**问题：**
- `transformRouteToMenu` 转换路由时未提取 `route.props.kvid` 到 `MenuItem`
- `removeTab` 调用 `removeComponentCacheByPath(path, tab.kvid)` 时 `tab.kvid` 永远为 `undefined`
- 缓存精确匹配（策略1）永远不触发，关闭标签后 Vue 组件缓存不释放

**修复目标：**
- `transformRouteToMenu` 中增加对 `route.props` 的提取：`kvid: (route.props as any)?.kvid`
- 验证关闭标签后 `vueComponentCache` 中对应条目被正确删除

---

### [ ] 7. `extractComponentName` 逻辑不完整导致路由缓存恢复后页面空白

**文件：** `src/router/routes/index.ts`，第 70-74 行

**问题：**
- 缓存路由时仅能识别 `iframe-page` 和 `base-layout` 两种组件
- 新增视图（如 `home.vue`、`dashboard/index.vue`）从缓存恢复时 `component` 为 `undefined`，页面空白

**修复目标：**
- 扩展 `extractComponentName` 的识别列表，覆盖所有 `views/` 下的已知视图
- 或改为在 `views` 映射表中注册所有已知视图，缓存时存储视图 key 而非解析函数字符串

---

## 🟡 P2 — 体验级别（影响使用流程）

### [ ] 8. 双重登录验证竞态 + 已登录不跳转问题

**文件：** `src/router/index.ts`、`src/router/guards.ts`、`src/views/login/index.vue`

**问题：**
- `setTimeout(() => initRoutes(), 100)` 与 `waitForRoutesReady → initRoutes()` 存在竞态窗口，`targetNavigation` 赋值时机不稳定
- 已登录用户访问 `/login` 不会自动跳转到首页

**修复目标：**
- 移除 `setTimeout` 触发，改为在路由守卫的 `waitForRoutesReady` 中统一触发初始化
- `guards.ts` 中对 `/login` 路由增加已登录检测：若 token 有效则 `next(redirect || '/')`

---

### [ ] 9. 缺少完整的登出（Logout）流程

**文件：** 全局（当前无登出功能）

**问题：**
- 系统没有任何登出入口和对应逻辑
- 无登出意味着 token 过期、权限变更后用户无法主动刷新身份

**修复目标：**
- 实现登出函数，依次执行：
  1. 调用后端登出接口（如有）
  2. 清除 `localStorage`（token、kivii-tabs、kivii-theme、DYNAMIC_ROUTES_CACHE）
  3. 调用 `menuStore.resetState()`
  4. 重置 `dynamicRoutesLoaded = false`，清除动态路由
  5. 跳转至 `/login`
- 在 Header 组件中增加登出按钮

---

## 🟢 P3 — 代码质量（不影响功能，影响可维护性）

### [ ] 10. `PathInfo` 接口在同文件中重复定义

**文件：** `src/bridge/kivii-open-tab.ts`，第 16-23 行 和 第 46-59 行

**问题：** 同一文件内 `interface PathInfo` 定义了两次，字段相同，存在维护混乱风险

**修复目标：** 删除第一处定义（第 16-23 行），保留第 46-59 行的完整版本

---

### [ ] 11. `canClose` 函数逻辑与注释不符

**文件：** `src/layouts/modules/global-tab/index.vue`，第 22-24 行

**问题：** 注释说"至少保留一个标签"，但函数无条件返回 `true`，保护逻辑未实现

**修复目标：** 根据业务需求选择一种策略：
- 方案 A：当 `tabsList.length <= 1` 时返回 `false`，禁止关闭最后一个标签
- 方案 B：保持当前行为（允许关闭所有标签，空时跳 `/blank`），删除误导性注释

---

### [ ] 12. 远程加载的 CSS 样式注入无安全校验

**文件：** `src/views/_builtin/iframe-page/vueComponent.vue`，第 121-124 行

**问题：** `vue3-sfc-loader` 的 `addStyle` 回调直接将远程组件的 `<style>` 内容注入 `document.head`，无任何过滤

**修复目标：**
- 评估实际风险（内部可信源 vs 外部不可信源）
- 若来源不可信，考虑使用 Shadow DOM 或 CSS 沙箱隔离样式，避免全局污染

---

### [ ] 13. `webview.vue` 中 `pointer-events` 重复声明

**文件：** `src/views/_builtin/iframe-page/webview.vue`，第 196-204 行

**问题：** `.webview-container` 中 `pointer-events: auto` 写了两次

**修复目标：** 删除重复的 `pointer-events: auto` 声明

---

## 进度追踪

| 优先级 | 总计 | 已完成 |
|--------|------|--------|
| 🔴 P0  | 3    | 0      |
| 🟠 P1  | 4    | 0      |
| 🟡 P2  | 2    | 0      |
| 🟢 P3  | 4    | 0      |
| **合计** | **13** | **0** |

---

> **执行建议：** P0 → P1 → P2 → P3 按序推进。P0 和 P1 中的第 4、6 项（UMD绑定 + kvid传递）存在关联，建议同步处理。
