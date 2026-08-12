# PageHost 渐进迁移计划

本文记录 PageHost 内核升级的阶段、决策与验收结果。当前正式使用说明见 [PageHost 页面保活](page-host.md)。迁移期间必须保持菜单协议、路由地址、标签交互、Bridge 接口和远程资源协议兼容。

## 核心目标

- 切换标签只停用页面，不清空表单、滚动位置和组件内部状态。
- 关闭、刷新和退出登录能够确定销毁真实页面实例；LRU 淘汰保留为阶段 6 可选能力。
- 区分远程库、页面实例和业务数据缓存。
- 第一轮只接管后端 KVID 动态页面，普通本地页面继续使用现有 `router-view + KeepAlive`。

## 不变量

每个阶段都必须满足：

- 现有路由 URL 与后端菜单数据不变。
- `openByKvid()` 和现有标签操作入口不变。
- 未被 PageHost 接管的页面继续走原渲染链路。
- 新链路必须可通过功能开关明确关闭。
- 关闭标签与退出登录不得遗留用户级实例。

## 阶段 0：身份与协议基线

当前阶段不改变任何运行时渲染行为。

- 定义可序列化的 `PageDescriptor`。
- 定义 `mount/activate/deactivate/destroy` 生命周期协议。
- 使用路由/标签身份、KVID 和规范化 query 生成稳定实例键。
- 禁止使用时间戳和随机值作为稳定标签身份。
- 用单元测试覆盖刷新稳定性、query 顺序和多实例隔离。

完成标准：现有页面行为零变化，新增身份测试全部通过。

## 阶段 1：旁路注册表

- [x] 新建 PageHost Observer Store，维护描述、状态、创建时间和最近激活时间。
- [x] 从现有动态页挂载与标签关闭链路生成诊断快照，但不创建或销毁组件。
- [x] 使用 observation ID 防止旧组件延迟卸载时误删重新打开后的新记录。
- [x] 在路由重建、标签批量关闭和菜单状态重置时同步清理诊断记录。

完成标准：注册表与标签状态一致，关闭、刷新和批量关闭的预期事件可测试，渲染仍完全由旧链路负责。当前已达到该静态与单元测试标准，后续浏览器回归继续核对真实路由时序。

## 阶段 2：单一 iframe 试点

- [x] 增加默认关闭的 PageHost 功能开关。
- [x] 只允许配置中的一个精确 KVID，并在解析确认是普通 iframe 后接管；Vue、UMD、空 Handler 和请求失败均回退旧链路。
- [x] PageHost 的 DOM 直接属于应用根级并位于 `router-view` 外部；内容区只同步挂载区域的屏幕矩形，布局重建不会卸载 iframe，标签切换只显示/隐藏实例。
- [x] 单个和批量关闭、刷新及会话清理会移除 Host 记录；iframe 组件卸载前切换到 `about:blank`。

阶段 2 曾使用单 KVID 白名单进行试点。阶段 5C 起白名单已退出运行时准入逻辑：KVID 由菜单接口在运行时产生，不要求打包时预知。阶段 5D 起 PageHost 默认启用，无需部署配置；如需整体回退旧链路，明确设置：

```json
{
  "PageHostEnabled": false
}
```

默认情况下，所有带 KVID 的菜单动态页面都会尝试由 PageHost 解析和接管；普通本地路由及没有 KVID 的直接 UMD 路由不进入 PageHost。个别尚未兼容的页面可放入可选排除名单：

```json
{
  "PageHostExcludedKvids": [
    "需要暂时回到旧链路的 KVID"
  ]
}
```

`PageHostExcludedKvids` 只接受字符串数组，匹配精确且区分大小写；空值会被忽略，重复项会去重。历史字段 `PageHostPilotKvid` 和 `PageHostPilotKvids` 不再限制接管范围。`PageHostEnabled: false` 是正式回退开关，同时兼容历史 `PageHostPilotEnabled: false`；其他值不会意外关闭 PageHost。功能访问解析为空、请求失败或 UMD 未注册时仍会自动回退旧链路。

完成标准：页面表单或页面状态切换后保留，关闭后实例与页面登记消失；关闭开关可恢复旧链路。代码、单元测试、人工浏览器回归，以及 iframe、远程 Vue、Hosted UMD、批量关闭和认证会话 E2E 已完成，PageHost 现为默认链路。

## 阶段 3：远程 Vue 与按需 UMD

- [x] 阶段 3A：抽取统一功能访问解析器，旧动态页与 PageHost 共用 Handler 类型、Origin、UMD 标签和脚本路径规范化。
- [x] 阶段 3B：接管菜单 KVID 解析出的远程 Vue 实例；复用现有 SFC 渲染器、组件定义缓存、加载 Promise 去重、加载代次与样式清理。
- [x] 阶段 3C：接管 KVID 按需 UMD 页面实例；注册前完成脚本按需加载，关闭标签只卸载 Hosted 实例，UMD 脚本、全局注册与共享样式继续作为应用级常驻资源。
- [x] 阶段 3D：为远程 Vue 与 UMD 后代组件提供可选的激活、停用和销毁上下文；iframe 使用同语义 `postMessage`。未接入协议的页面保持原行为。

Vue/UMD 页面可通过 `inject(Symbol.for('kivii.page-host.lifecycle'))` 获取上下文，并注册 `onActivate`、`onDeactivate`、`onDestroy` 回调。`onDestroy` 会收到 `close`、`refresh`、`logout`、`lru` 或 `replace` 原因。iframe 监听以下消息：

```ts
window.addEventListener('message', event => {
  if (event.data?.type !== 'kivii:page-host-lifecycle') return
  // event.data.event: activate | deactivate | destroy
  // event.data.reason: destroy 时存在
})
```

生命周期是性能协作协议，不改变保活本身：页面隐藏后实例和表单状态仍驻留，只建议在 `deactivate` 中暂停轮询、动画或媒体，在 `activate` 中恢复。

完成标准：三种 KVID 页面在切换时保留状态，关闭后只销毁实例级资源，不误删共享库。

## 阶段 4：统一标签生命周期

- [x] 阶段 4A：单个关闭、关闭其他、关闭左右、关闭全部统一以 `close` 原因进入 PageHost；刷新标签明确执行 `destroy(reason: 'refresh')` 后沿用现有链路重新挂载；会话重建和退出登录明确使用 `logout`。
- [x] 阶段 4B：统一刷新重建事务；先确认空白页导航成功再销毁旧实例，恢复原标签位置和完整 `fullPath`，阻止并发重复刷新，并在清理或返回导航失败时保留可再次进入的标签。
- [x] 阶段 4C：命中试点 KVID 后同步预留 PageHost 渲染权，异步解析期间不挂载旧动态页，消除刷新时旧链路与 PageHost 同时请求 `Access.json` 的双请求窗口；刷新互斥持续到 PageHost 解析结束，快速连点不会启动重叠 Access 请求；解析失败才释放给旧链路回退。
- [x] 阶段 4D：预留状态升级为稳定实例身份；加载中关闭会同时失效请求代次和预留，旧响应不能写回；立即重开建立新的有效解析；同路径不同 query 使用独立实例，关闭路径时统一销毁该标签的全部 query 实例。

完成标准：所有标签操作都有自动化生命周期断言，不再依赖从 `KeepAlive include` 移除来间接销毁动态实例。

## 阶段 5：浏览器回归与默认启用

- [x] 阶段 5A：从单 KVID 扩展为显式 KVID 白名单，兼容旧单值配置；默认关闭，不接受通配符或字符串形式的数组，继续逐页验收和快速回退。
- [x] 阶段 5B：增加有界灰度诊断历史，记录解析、接管、缓存命中、回退、取消、耗时和销毁原因；不记录 query、页面 URL、表单内容、接口响应或错误正文，并通过浏览器只读入口提供快照。
- [x] 阶段 5C：移除运行时 KVID 白名单限制；总开关启用后自动接管所有菜单 KVID 动态页，保留精确排除名单和解析失败回退，适配打包时无法预知 KVID 的部署方式。
- [x] 阶段 5D：PageHost 切换为正式默认链路，无配置时自动启用；保留 `PageHostEnabled: false` 一键回退能力。
- [x] 人工验证菜单 KVID 页面的打开、切换、刷新、关闭及诊断事件，确认 `hosted` 与 `destroy` 正常记录。
- [x] 建立 Playwright 浏览器测试基线；通过受控菜单、Access 和 iframe 响应覆盖打开、切换保活、刷新重建、关闭销毁及诊断事件。
- [x] 覆盖 Hosted UMD 的按需脚本加载、注册、切换保活和关闭销毁，并通过公开标签右键菜单验证“关闭所有”批量销毁。
- [x] 覆盖远程 Vue SFC 下载、运行时编译、样式注入、切换保活、关闭销毁和 KVID 级样式清理。
- [x] 覆盖正常退出登录的全部 PageHost 实例销毁、标签清理与认证状态更新。
- [x] 覆盖业务请求 401、重新登录、旧持久化状态清理、整页刷新和当前 PageHost 页面重建。
- [x] PageHost 已默认启用，同时保留 `PageHostEnabled: false` 和 KVID 排除名单作为快速回退能力。

当前状态：阶段 5 的核心人工回归和自动化覆盖均已完成，PageHost 已成为 KVID 动态页默认链路。阶段 6 的驻留上限、LRU 与资源治理按当前决策暂不实施。

浏览器 Console 可执行：

```js
window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.summary()
window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.configuration()
window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.snapshot()
console.table(window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.snapshot())
```

历史最多保留最近 100 条。`configuration()` 显示应用内部当前真正生效的总开关和排除名单。`skipped` 会解释没有进入 PageHost 的原因：`disabled`、`missing-kvid` 或 `excluded-kvid`；`hosted` 表示成功接管，`fallback` 表示已安全回退旧链路，`cancelled` 表示旧请求因切换、关闭或更新代次而失效，`destroy` 包含关闭、刷新、退出或淘汰原因。入口只返回数据副本，不提供修改 Store、销毁实例或清空记录的能力。

这里需要区分两类 UMD 页面：功能访问接口返回组件标签的 KVID 动态页已经由 PageHost 接管；`generateUmdRoutes()` 从已加载 UMD 文件直接生成的 `/umd/<library>/<component>` 标签没有 KVID，当前仍由 RouterView + KeepAlive 管理，不会产生 `hosted` 或 PageHost `destroy` 事件。它会在新诊断中显示为 `skipped`，后续必须作为独立迁移范围验收，不能用直接 UMD 标签代替 KVID Hosted UMD 的 PageHost 验收。

## 阶段 6：资源治理

> 当前决策：暂缓，不属于本轮 PageHost 交付范围。现有代码不会自动执行 LRU 淘汰。

- [ ] 设置重型页面驻留上限，初始建议 8～12 个。
- [ ] 使用 `activatedAt` 实现 LRU，记录淘汰原因。
- [ ] 通过协议暂停轮询、动画、媒体和 iframe 后台任务。
- [ ] 增加诊断面板与共享样式/远程库引用策略。

完成标准：长时间使用的资源规模可解释，淘汰不会误伤当前页面或共享库。

## 每阶段验证命令

```bash
pnpm test
pnpm test:e2e
pnpm type-check
pnpm build-only
```

涉及真实页面生命周期的阶段还必须执行浏览器回归，不能只依赖单元测试和构建通过。
