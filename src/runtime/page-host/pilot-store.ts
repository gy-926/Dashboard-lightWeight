import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { createPageInstanceKey } from './identity';
import type { PageDescriptor, PageDestroyReason, PageIdentityQuery } from './types';
import { resolveFunctionAccessPayload } from './function-access';
import {
  destroyHostedPageLifecycle,
  setHostedPageLifecycleActive,
} from './lifecycle';
import { pageHostDiagnostics } from './diagnostics';

export interface PageHostPilotRoute {
  path: string;
  name?: string | symbol | null;
  kvid?: string;
  query?: PageIdentityQuery;
}

export interface HostedPilotPageRecord {
  instanceKey: string;
  descriptor: PageDescriptor;
  src: string;
  componentTag?: string;
  scriptPath?: string;
  active: boolean;
  createdAt: number;
  activatedAt: number;
}

export interface PageHostBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type UmdRegistrationBridge = (
  componentName: string,
  scriptPath?: string
) => Promise<boolean>;

export const usePageHostPilotStore = defineStore('page-host-pilot', () => {
  const pages = ref<Map<string, HostedPilotPageRecord>>(new Map());
  const activeInstanceKey = ref<string | null>(null);
  const claimedPath = ref<string | null>(null);
  const resolvingPath = ref<string | null>(null);
  const resolvingInstanceKey = ref<string | null>(null);
  const bounds = ref<PageHostBounds>({ top: 0, left: 0, width: 0, height: 0 });
  let resolveGeneration = 0;
  let umdRegistrationBridge: UmdRegistrationBridge | null = null;
  let currentRouteResolution: { path: string; promise: Promise<boolean> } | null = null;

  const allPages = computed(() => Array.from(pages.value.values()));

  function createDescriptorBase(route: PageHostPilotRoute): PageDescriptor {
    return {
      tabKey: String(route.name || route.path),
      path: route.path,
      type: 'webview',
      url: '',
      kvid: route.kvid,
      query: route.query,
    };
  }

  /** 在异步解析开始前同步预留实例身份，避免旧链路与 PageHost 同时渲染。 */
  function prepareRoute(route: PageHostPilotRoute, eligible: boolean): void {
    if (!eligible) {
      resolvingPath.value = null;
      resolvingInstanceKey.value = null;
      deactivateAll();
      return;
    }

    const instanceKey = createPageInstanceKey(createDescriptorBase(route));
    const existing = pages.value.get(instanceKey);
    if (existing) {
      resolvingPath.value = null;
      resolvingInstanceKey.value = null;
      activate(instanceKey, route.path);
      return;
    }

    deactivateAll();
    resolvingPath.value = route.path;
    resolvingInstanceKey.value = instanceKey;
  }

  function deactivateAll(): void {
    pages.value.forEach(page => {
      page.active = false;
      setHostedPageLifecycleActive(page.instanceKey, false);
    });
    activeInstanceKey.value = null;
    claimedPath.value = null;
  }

  function activate(instanceKey: string, path: string, now = Date.now()): void {
    pages.value.forEach((page, key) => {
      page.active = key === instanceKey;
      setHostedPageLifecycleActive(key, key === instanceKey);
    });
    const page = pages.value.get(instanceKey);
    if (!page) return;
    page.activatedAt = now;
    activeInstanceKey.value = instanceKey;
    claimedPath.value = path;
  }

  function hostResolvedPage(
    descriptor: PageDescriptor,
    src: string,
    now = Date.now(),
    details: Pick<HostedPilotPageRecord, 'componentTag' | 'scriptPath'> = {}
  ): string {
    const instanceKey = createPageInstanceKey(descriptor);
    const existing = pages.value.get(instanceKey);

    pages.value.set(instanceKey, {
      instanceKey,
      descriptor: { ...descriptor, url: src },
      src,
      componentTag: details.componentTag,
      scriptPath: details.scriptPath,
      active: true,
      createdAt: existing?.createdAt ?? now,
      activatedAt: now,
    });
    activate(instanceKey, descriptor.path, now);
    return instanceKey;
  }

  function diagnosticBase(route: PageHostPilotRoute) {
    return {
      path: route.path,
      kvid: route.kvid,
    };
  }

  function setUmdRegistrationBridge(bridge: UmdRegistrationBridge): void {
    umdRegistrationBridge = bridge;
  }

  async function ensureUmdRegistered(
    componentName: string,
    scriptPath?: string
  ): Promise<boolean> {
    if (!umdRegistrationBridge) return false;
    return umdRegistrationBridge(componentName, scriptPath);
  }

  async function resolveRouteRequest(route: PageHostPilotRoute): Promise<boolean> {
    const generation = ++resolveGeneration;
    const descriptorBase = createDescriptorBase(route);
    const requestedInstanceKey = createPageInstanceKey(descriptorBase);
    const startedAt = Date.now();
    try {
      const [{ getGlobalConfig }, { shouldPilotPageHostKvid }, { kivii }] = await Promise.all([
        import('@/router/routes'),
        import('./pilot-config'),
        import('@kivii.com/bridge'),
      ]);
      if (generation !== resolveGeneration) return false;
      const config = getGlobalConfig();

      if (!shouldPilotPageHostKvid(config, route.kvid)) {
        deactivateAll();
        return false;
      }

      pageHostDiagnostics.record({
        ...diagnosticBase(route),
        event: 'resolve-start',
        timestamp: startedAt,
      });

      const existing = pages.value.get(requestedInstanceKey);
      if (existing) {
        activate(requestedInstanceKey, route.path);
        pageHostDiagnostics.record({
          ...diagnosticBase(route),
          event: 'hosted',
          pageType: existing.descriptor.type,
          durationMs: Date.now() - startedAt,
          cacheHit: true,
        });
        return true;
      }

      const response = await kivii.request.get<any>(
        `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${route.kvid}`
      );
      if (generation !== resolveGeneration) {
        pageHostDiagnostics.record({
          ...diagnosticBase(route),
          event: 'cancelled',
          durationMs: Date.now() - startedAt,
        });
        return false;
      }

      const resolved = resolveFunctionAccessPayload(
        response.data,
        config,
        window.location.origin
      );
      if (!resolved) {
        pageHostDiagnostics.record({
          ...diagnosticBase(route),
          event: 'fallback',
          durationMs: Date.now() - startedAt,
          fallbackReason: 'empty-handler',
        });
        deactivateAll();
        return false;
      }
      const src = resolved.url;
      const descriptor = { ...descriptorBase, url: src };

      if (resolved.type === 'umd') {
        const registered = await ensureUmdRegistered(src, resolved.scriptPath);
        if (generation !== resolveGeneration) {
          pageHostDiagnostics.record({
            ...diagnosticBase(route),
            event: 'cancelled',
            pageType: resolved.type,
            durationMs: Date.now() - startedAt,
          });
          return false;
        }
        if (!registered) {
          pageHostDiagnostics.record({
            ...diagnosticBase(route),
            event: 'fallback',
            pageType: resolved.type,
            durationMs: Date.now() - startedAt,
            fallbackReason: 'umd-not-registered',
          });
          deactivateAll();
          return false;
        }
        hostResolvedPage(
          { ...descriptor, type: resolved.type },
          src,
          Date.now(),
          {
            componentTag: resolved.componentTag,
            scriptPath: resolved.scriptPath,
          }
        );
        pageHostDiagnostics.record({
          ...diagnosticBase(route),
          event: 'hosted',
          pageType: resolved.type,
          durationMs: Date.now() - startedAt,
          cacheHit: false,
        });
        return true;
      }

      hostResolvedPage({ ...descriptor, type: resolved.type }, src);
      pageHostDiagnostics.record({
        ...diagnosticBase(route),
        event: 'hosted',
        pageType: resolved.type,
        durationMs: Date.now() - startedAt,
        cacheHit: false,
      });
      return true;
    } catch (error) {
      if (generation === resolveGeneration) {
        pageHostDiagnostics.record({
          ...diagnosticBase(route),
          event: 'fallback',
          durationMs: Date.now() - startedAt,
          fallbackReason: 'request-error',
        });
        console.warn('[PageHostPilot] 动态页面解析失败，继续使用旧页面链路:', error);
        deactivateAll();
      }
      return false;
    } finally {
      if (
        generation === resolveGeneration &&
        resolvingInstanceKey.value === requestedInstanceKey
      ) {
        resolvingPath.value = null;
        resolvingInstanceKey.value = null;
      }
    }
  }

  function resolveRoute(route: PageHostPilotRoute): Promise<boolean> {
    const resolution = resolveRouteRequest(route);
    currentRouteResolution = { path: route.path, promise: resolution };
    void resolution.finally(() => {
      if (currentRouteResolution?.promise === resolution) {
        currentRouteResolution = null;
      }
    });
    return resolution;
  }

  function waitForRouteResolution(path: string): Promise<boolean> {
    return currentRouteResolution?.path === path
      ? currentRouteResolution.promise
      : Promise.resolve(isClaimedPath(path));
  }

  function removeByPath(path: string, reason: PageDestroyReason = 'close'): void {
    resolveGeneration++;
    const records = Array.from(pages.value.entries())
      .filter(([, page]) => page.descriptor.path === path)
    const keys = records.map(([key]) => key);
    records.forEach(([key, page]) => {
      pageHostDiagnostics.record({
        event: 'destroy',
        path: page.descriptor.path,
        kvid: page.descriptor.kvid,
        pageType: page.descriptor.type,
        destroyReason: reason,
      });
      destroyHostedPageLifecycle(key, reason);
      pages.value.delete(key);
    });
    if (claimedPath.value === path || (activeInstanceKey.value && keys.includes(activeInstanceKey.value))) {
      activeInstanceKey.value = null;
      claimedPath.value = null;
    }
    if (resolvingPath.value === path) {
      resolvingPath.value = null;
      resolvingInstanceKey.value = null;
    }
  }

  function clear(reason: PageDestroyReason = 'logout'): void {
    resolveGeneration++;
    pages.value.forEach(page => {
      pageHostDiagnostics.record({
        event: 'destroy',
        path: page.descriptor.path,
        kvid: page.descriptor.kvid,
        pageType: page.descriptor.type,
        destroyReason: reason,
      });
      destroyHostedPageLifecycle(page.instanceKey, reason);
    });
    pages.value.clear();
    activeInstanceKey.value = null;
    claimedPath.value = null;
    resolvingPath.value = null;
    resolvingInstanceKey.value = null;
    currentRouteResolution = null;
  }

  function isClaimedPath(path: string): boolean {
    return claimedPath.value === path;
  }

  function isReservedPath(path: string): boolean {
    return claimedPath.value === path || resolvingPath.value === path;
  }

  function setBounds(nextBounds: PageHostBounds): void {
    bounds.value = { ...nextBounds };
  }

  function clearBounds(): void {
    bounds.value = { top: 0, left: 0, width: 0, height: 0 };
  }

  return {
    pages,
    allPages,
    activeInstanceKey,
    claimedPath,
    resolvingPath,
    resolvingInstanceKey,
    bounds,
    resolveRoute,
    waitForRouteResolution,
    prepareRoute,
    hostResolvedPage,
    setUmdRegistrationBridge,
    ensureUmdRegistered,
    deactivateAll,
    removeByPath,
    clear,
    isClaimedPath,
    isReservedPath,
    setBounds,
    clearBounds,
  };
});
