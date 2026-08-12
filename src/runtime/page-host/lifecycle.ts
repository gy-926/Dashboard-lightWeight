import {
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  readonly,
  ref,
  watch,
  type InjectionKey,
} from 'vue';
import type {
  PageDescriptor,
  PageDestroyReason,
  PageHostContext,
  PageHostDestroyCallback,
  PageHostLifecycleCallback,
  PageHostLifecycleContext,
} from './types';

// Symbol.for 允许可信远程组件无需导入宿主源码，也能用同一个 key 执行 inject。
export const PAGE_HOST_LIFECYCLE_KEY = Symbol.for(
  'kivii.page-host.lifecycle'
) as InjectionKey<PageHostLifecycleContext>;

interface PageHostLifecycleController {
  context: PageHostLifecycleContext;
  mount(): void;
  setActive(active: boolean): void;
  destroy(reason: PageDestroyReason): void;
}

const mountedControllers = new Map<string, PageHostLifecycleController>();

function invokeSafely(
  callbacks: Iterable<(...args: any[]) => void | Promise<void>>,
  args: any[],
  eventName: string
): void {
  for (const callback of callbacks) {
    try {
      void Promise.resolve(callback(...args)).catch(error => {
        console.warn(`[PageHost] ${eventName} 生命周期回调失败:`, error);
      });
    } catch (error) {
      console.warn(`[PageHost] ${eventName} 生命周期回调失败:`, error);
    }
  }
}

export function createPageHostLifecycleController(
  hostContext: PageHostContext,
  initiallyActive: boolean
): PageHostLifecycleController {
  const active = ref(initiallyActive);
  const activateCallbacks = new Set<PageHostLifecycleCallback>();
  const deactivateCallbacks = new Set<PageHostLifecycleCallback>();
  const destroyCallbacks = new Set<PageHostDestroyCallback>();
  let mounted = false;
  let destroyed = false;
  const descriptorSnapshot: Readonly<PageDescriptor> = Object.freeze({
    ...hostContext.descriptor,
    query: hostContext.descriptor.query
      ? Object.fromEntries(
          Object.entries(hostContext.descriptor.query).map(([key, value]) => [
            key,
            Array.isArray(value) ? [...value] : value,
          ])
        )
      : undefined,
  });
  const stableHostContext: PageHostContext = Object.freeze({
    instanceKey: hostContext.instanceKey,
    descriptor: descriptorSnapshot,
  });

  const context: PageHostLifecycleContext = {
    ...stableHostContext,
    active: readonly(active),
    onActivate(callback) {
      activateCallbacks.add(callback);
      if (mounted && !destroyed && active.value) {
        invokeSafely([callback], [stableHostContext], 'activate');
      }
      return () => activateCallbacks.delete(callback);
    },
    onDeactivate(callback) {
      deactivateCallbacks.add(callback);
      if (mounted && !destroyed && !active.value) {
        invokeSafely([callback], [stableHostContext], 'deactivate');
      }
      return () => deactivateCallbacks.delete(callback);
    },
    onDestroy(callback) {
      destroyCallbacks.add(callback);
      return () => destroyCallbacks.delete(callback);
    },
  };

  function emitCurrentState(): void {
    const callbacks = active.value ? activateCallbacks : deactivateCallbacks;
    invokeSafely(callbacks, [stableHostContext], active.value ? 'activate' : 'deactivate');
  }

  return {
    context,
    mount() {
      if (mounted || destroyed) return;
      mounted = true;
      emitCurrentState();
    },
    setActive(nextActive) {
      if (destroyed || active.value === nextActive) return;
      active.value = nextActive;
      if (mounted) emitCurrentState();
    },
    destroy(reason) {
      if (destroyed) return;
      destroyed = true;
      invokeSafely(destroyCallbacks, [reason, stableHostContext], 'destroy');
      activateCallbacks.clear();
      deactivateCallbacks.clear();
      destroyCallbacks.clear();
    },
  };
}

export function provideHostedPageLifecycle(props: {
  instanceKey: string;
  descriptor: PageDescriptor;
  active: boolean;
}): PageHostLifecycleContext {
  const controller = createPageHostLifecycleController(
    {
      instanceKey: props.instanceKey,
      descriptor: props.descriptor,
    },
    props.active
  );

  mountedControllers.set(props.instanceKey, controller);
  provide(PAGE_HOST_LIFECYCLE_KEY, controller.context);

  watch(
    () => props.active,
    active => controller.setActive(active)
  );
  onMounted(() => controller.mount());
  onBeforeUnmount(() => {
    controller.destroy('close');
    if (mountedControllers.get(props.instanceKey) === controller) {
      mountedControllers.delete(props.instanceKey);
    }
  });

  return controller.context;
}

export function usePageHostLifecycle(): PageHostLifecycleContext | undefined {
  return inject(PAGE_HOST_LIFECYCLE_KEY, undefined);
}

export function setHostedPageLifecycleActive(instanceKey: string, active: boolean): void {
  mountedControllers.get(instanceKey)?.setActive(active);
}

export function destroyHostedPageLifecycle(
  instanceKey: string,
  reason: PageDestroyReason
): void {
  mountedControllers.get(instanceKey)?.destroy(reason);
}
