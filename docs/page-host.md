# PageHost 页面保活

PageHost 是后端菜单 KVID 动态页的默认承载层。它把页面实例放在应用根级、`router-view` 之外，使标签切换只改变激活状态和可见性，不卸载正在填写的表单、iframe 文档或远程组件实例。

## 为什么需要 PageHost

原动态页由 `router-view` 创建，再通过 Teleport 把 DOM 投射到内容区。Teleport 只改变渲染位置，源组件一旦随路由卸载，投射内容也会销毁；组件定义缓存只能减少远程代码的重复下载和编译，不能保存表单、DOM 与组件内部响应式状态。

PageHost 将“路由当前显示什么”与“标签实例是否继续存在”分开：

```text
菜单与标签状态
      ↓
路由选择当前标签
      ↓
应用根级 PageHost
├── 当前页：active，可见
├── 其他已打开页：inactive，实例保留
└── 已关闭/已刷新页：destroy，实例移除
```

## 当前接管范围

PageHost 默认尝试接管所有带 KVID 的后端菜单动态页，不需要在打包时预知 KVID，也不需要配置白名单。Nest 运行时菜单返回的 `Handler` 和 UMD `source_url` 会由路由直接交给 PageHost，不再请求旧的 `Function/Access.json`；只有未携带“已解析”标记的兼容数据源才会使用旧接口兜底。Handler 当前可解析为：

- `webview`：iframe 或历史 Web 页面；
- `vue`：运行时加载的远程 Vue SFC；
- `umd`：按需加载并完成全局注册的 UMD 组件。

以下页面仍使用原有链路：

- 本地 Vue 路由；
- `/custom_`、`/bridge_` 和内置 iframe 兼容入口；
- 从 UMD 清单直接生成、没有 KVID 的 `/umd/<library>/<component>` 路由；
- 明确排除或解析失败后安全回退的 KVID 页面。

直接 UMD 路由与 KVID Handler 解析出的 Hosted UMD 不是同一条链路。前者继续由 `RouterView + KeepAlive` 管理，后者才会产生 PageHost 的 `hosted`、`destroy` 等诊断事件。

## 页面身份与生命周期

实例键由稳定标签身份、路径、KVID 和规范化 query 生成，不使用时间戳或随机数。同一路径的不同 query 可以形成独立实例；关闭某个标签路径时，会清理该路径关联的 PageHost 实例。

生命周期语义如下：

| 用户操作 | PageHost 行为 | 页面状态 |
| --- | --- | --- |
| 切换到其他标签 | `deactivate` | 实例和表单状态保留，仅隐藏 |
| 切回标签 | `activate` | 显示原实例，不重新挂载 |
| 关闭/批量关闭 | `destroy(close)` | 卸载对应实例 |
| 刷新当前标签 | `destroy(refresh)` 后重建 | 明确获得全新实例 |
| 正常退出或会话重建 | `destroy(logout)` | 清空用户级页面实例 |

刷新采用互斥事务：先完成临时导航，再销毁旧实例并恢复原标签位置及完整 `fullPath`。异步解析期间会预留渲染权，避免 PageHost 与旧动态页同时请求功能访问接口；关闭或重新打开产生的新代次会让旧响应失效。

远程 Vue 和 Hosted UMD 可选择注入生命周期上下文：

```ts
import { inject } from 'vue'

const lifecycle = inject(Symbol.for('kivii.page-host.lifecycle'))
lifecycle?.onDeactivate(() => pauseBackgroundWork())
lifecycle?.onActivate(() => resumeBackgroundWork())
lifecycle?.onDestroy(reason => releasePageResources(reason))
```

iframe 可监听父窗口发送的同语义消息：

```ts
window.addEventListener('message', event => {
  if (event.data?.type !== 'kivii:page-host-lifecycle') return
  // event.data.event: activate | deactivate | destroy
  // event.data.reason: close | refresh | logout | lru | replace（destroy 时存在）
})
```

生命周期协议是可选的。未接入协议的页面仍能保活，但隐藏后自身的轮询、动画或媒体不会自动暂停。

## 配置与回退

PageHost 默认启用。配置项位于 `window.uiGlobalConfig.Parameters`，`Parameters` 可以是对象或 JSON 字符串。

全局回退到旧链路：

```json
{
  "PageHostEnabled": false
}
```

仅排除暂未兼容的页面：

```json
{
  "PageHostExcludedKvids": [
    "需要使用旧链路的 KVID"
  ]
}
```

排除名单精确匹配且区分大小写；空值会被忽略、重复值会去重。历史字段 `PageHostPilotEnabled: false` 仍可关闭 PageHost，但新部署应使用 `PageHostEnabled`。历史白名单字段不再限制接管范围。

解析结果为空、功能访问请求失败或 UMD 未注册时，页面会自动释放 PageHost 预留并回退旧动态页，不会把错误页面永久占为 Hosted 实例。

## 资源边界

PageHost 区分以下资源：

| 资源 | 当前策略 |
| --- | --- |
| 标签级 Vue/iframe/UMD 页面实例 | 保留到关闭、刷新或退出登录 |
| 远程 Vue 组件定义与注入样式 | 按 KVID 清理，并用加载代次阻止旧任务回写 |
| UMD 脚本、全局注册和共享样式 | 应用级常驻，不随单个标签关闭 |
| 业务查询结果、草稿和用户偏好 | 由业务模块自行决定，不由 PageHost 代管 |

阶段 6 的驻留数量上限、LRU 淘汰和内存预算当前明确暂缓。因此 PageHost 不会因标签数量自动淘汰后台实例；长时间打开大量重型页面时，仍需主动关闭不再使用的标签。`activatedAt` 和 `lru` 销毁原因只是为未来能力预留，不代表 LRU 已启用。

## 诊断与验证

浏览器 Console 提供只读诊断入口：

```js
window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.configuration()
window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.summary()
window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.snapshot()
console.table(window.__KIVII_PAGE_HOST_DIAGNOSTICS__?.snapshot())
```

- `configuration()`：当前实际生效的总开关和排除名单；
- `hosted`：成功接管或重新命中已有实例；
- `skipped`：因 `disabled`、`missing-kvid` 或 `excluded-kvid` 未进入 PageHost；
- `fallback`：解析失败后回退旧链路；
- `cancelled`：异步结果因切换、关闭或新代次而失效；
- `destroy`：页面因关闭、刷新或退出登录被销毁。

诊断历史最多保留最近 100 条，只记录路径、KVID、页面类型、结果、耗时和生命周期原因，不记录 query、页面 URL、表单内容、接口响应或错误正文。`summary()` 是这 100 条保留事件的计数，不是当前实例数量。

自动化验证命令：

```bash
pnpm test
pnpm test:e2e
pnpm type-check
pnpm build-only
```

Playwright 当前覆盖 iframe、远程 Vue、Hosted UMD 的切换保活与关闭销毁，以及刷新、关闭全部、正常退出和 401 重登录后的会话重建。

## 与原方案对比

| 对比项 | 原有动态页链路 | PageHost |
| --- | --- | --- |
| 实例归属 | `router-view` 页面树 | 应用根级永久 Host |
| Teleport 职责 | 容易同时承担布局与保活预期 | 只负责位置，实例存续由 Host 决定 |
| 标签切换 | 受路由卸载、KeepAlive 名称与包装规则影响 | 明确执行显隐和 `activate/deactivate` |
| 表单状态 | 可能因重新挂载而清空 | 切换后保留原实例状态 |
| 刷新 | 依赖路由和缓存的间接失效 | 明确销毁一次并重建一次 |
| 关闭与退出 | 多处清理入口，较难证明实例已释放 | 统一进入带原因的 `destroy` |
| 异步请求 | 旧响应可能与新页面时序竞争 | 预留、请求代次和取消结果统一管理 |
| Handler 来源 | 动态页通常再次请求旧 Access 接口 | 优先复用菜单已关联的 Handler，兼容数据源才回退旧接口 |
| 页面类型 | 各入口可能重复解析 Handler | iframe、远程 Vue、Hosted UMD 共用规范化解析 |
| 可观测性 | 主要依赖 Network 与人工判断 | 提供有限、只读、无业务数据的诊断历史 |
| 回退 | 修改渲染逻辑或逐页排查 | 全局开关、精确排除名单和解析失败自动回退 |

PageHost 的核心优势不是“缓存更多”，而是把页面实例身份和生命周期变成明确协议：切换不等于销毁，刷新必然重建，关闭和退出必然清理。这使页面保活从依赖 Vue 路由缓存细节的偶然行为，升级为可测试、可诊断、可回退的工作台能力。

## 相关实现

- `src/runtime/page-host/`
- `src/router/page-route.ts`
- `src/layouts/modules/global-content/index.vue`
- `src/layouts/modules/global-menu/store.ts`
- `tests/page-host-*.spec.ts`
- `tests/e2e/page-host.spec.ts`

迁移过程与各阶段验收记录见 [PageHost 渐进迁移计划](page-host-migration-plan.md)。
