import type { Ref } from 'vue';

export type HostedPageType = 'webview' | 'vue' | 'umd';

export type PageIdentityQueryValue = string | string[] | null | undefined;
export type PageIdentityQuery = Record<string, PageIdentityQueryValue>;

/** PageHost 使用的稳定页面描述；不包含组件实例或其他不可序列化状态。 */
export interface PageDescriptor {
  /** 稳定标签身份，优先使用路由名，缺少时使用规范化路径。 */
  tabKey: string;
  /** 标签对应的项目路由路径。 */
  path: string;
  type: HostedPageType;
  url: string;
  kvid?: string;
  query?: PageIdentityQuery;
}

export type HostedPageStatus =
  | 'mounting'
  | 'active'
  | 'inactive'
  | 'destroying'
  | 'destroyed'
  | 'error';

export type PageDestroyReason = 'close' | 'refresh' | 'logout' | 'lru' | 'replace';

export interface PageHostContext {
  instanceKey: string;
  descriptor: Readonly<PageDescriptor>;
}

export type PageHostLifecycleCallback = (
  context: PageHostContext
) => void | Promise<void>;

export type PageHostDestroyCallback = (
  reason: PageDestroyReason,
  context: PageHostContext
) => void | Promise<void>;

/** 远程页面可选注入的生命周期上下文；未使用该协议的页面保持原行为。 */
export interface PageHostLifecycleContext extends PageHostContext {
  active: Readonly<Ref<boolean>>;
  onActivate(callback: PageHostLifecycleCallback): () => void;
  onDeactivate(callback: PageHostLifecycleCallback): () => void;
  onDestroy(callback: PageHostDestroyCallback): () => void;
}

export interface PageInstance {
  readonly instanceKey: string;
}

/**
 * 目标生命周期协议。阶段 0 只固定契约，不接管当前 router-view 的渲染行为。
 */
export interface PageAdapter<TInstance extends PageInstance = PageInstance> {
  match(page: PageDescriptor): boolean;
  mount(context: PageHostContext): Promise<TInstance>;
  activate(instance: TInstance): void | Promise<void>;
  deactivate(instance: TInstance): void | Promise<void>;
  destroy(instance: TInstance, reason: PageDestroyReason): void | Promise<void>;
}

export interface HostedPageRecord {
  instanceKey: string;
  descriptor: PageDescriptor;
  status: HostedPageStatus;
  createdAt: number;
  activatedAt?: number;
  error?: string;
}
