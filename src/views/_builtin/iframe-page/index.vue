<script setup lang="ts">
  defineOptions({ name: 'IframePage' });
  import { ref, onMounted, onUnmounted, onActivated, computed, getCurrentInstance, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import {
    useTeleportManager,
    generatePageId,
    type PageType,
  } from '@/store/modules/teleport-manager';
  import WebviewComponent from './webview.vue';
  import VueComponent from './vueComponent.vue';
  import UmdComponentPage from '../umd-component/index.vue';
  import { loadUmdOnDemand } from '@/utils/remoteComponentLoader';
  import { getGlobalConfig } from '@/router/routes/config';
  import {
    resolveFunctionAccessPayload,
    resolveFunctionPageType as determineRenderTypeByHandler,
  } from '@/runtime/page-host/function-access';

  // 路由 props
  const props = defineProps<{
    url: string;
    kvid?: string;
    functionKvid?: string;
    handler?: string; // 关联函数的 handler，由路由层直接传入，无需再调接口
    handlerResolved?: boolean; // 即使 handler 为空，也表示菜单数据已完成解析
    scriptPath?: string; // UMD 文件地址，供未启用 PageHost 的兼容路径使用
    type?: PageType;
    routeQuery?: Record<string, string>;
    backendOrigin?: string;
  }>();

  const route = useRoute();
  const instance = getCurrentInstance();
  const { registerPage, unregisterPage, updatePageStatus, requestActivation, forceActivate } =
    useTeleportManager();

  const pageId = ref<string>('');

  // 动态渲染类型（由接口决定）
  const dynamicRenderType = ref<PageType>('webview');
  const dynamicHandler = ref<string>('');
  const dynamicUmdTag = ref<string>('');
  const isLoading = ref(true);
  const loadError = ref('');
  let isDisposed = false;
  let functionAccessRequestId = 0;

  // 最终渲染类型（优先使用动态类型，否则使用 props.type）
  const renderType = computed((): PageType => {
    if (dynamicRenderType.value !== 'webview') {
      return dynamicRenderType.value;
    }
    const type = props.type?.toLowerCase() as PageType;
    if (type === 'vue') {
      return type;
    }
    // 如果 URL 以 .vue 结尾，识别为 Vue 组件
    if (props.url?.endsWith('.vue') || props.functionKvid?.endsWith('.vue')) {
      return 'vue';
    }
    return 'webview';
  });

  // 最终 URL（优先使用动态 Handler，否则使用 props.url）
  const renderUrl = computed(() => {
    if (dynamicHandler.value) {
      return dynamicHandler.value;
    }
    return props.url || '';
  });

  // 是否为自定义路由场景
  const isCustomRoute = computed(() => {
    const path = route.path;
    return path.startsWith('/custom_') || path.startsWith('/bridge_');
  });

  // 获取后端 origin
  const backendOrigin = computed(() => {
    return props.backendOrigin || '';
  });

  // 与 PageHost 共用地址解析，默认跟随当前站点，允许显式指定后端地址。
  function applyHandler(handler: string) {
    const config = getGlobalConfig();
    const resolved = resolveFunctionAccessPayload(
      { Results: [{ Handler: handler }] },
      { ...config, Origin: props.backendOrigin || config.Origin },
      window.location.origin
    );
    if (!resolved) return;
    dynamicRenderType.value = resolved.type;
    dynamicHandler.value = resolved.url;
    dynamicUmdTag.value = resolved.componentTag || '';
  }

  async function applyHandlerWithScript(handler: string, scriptPath?: string) {
    applyHandler(handler);
    if (
      determineRenderTypeByHandler(handler) === 'umd' &&
      scriptPath &&
      instance?.appContext.app
    ) {
      await loadUmdOnDemand(instance.appContext.app, scriptPath);
    }
  }

  // 兜底：通过接口查询 handler（仅 handler prop 不存在时使用）
  async function fetchFunctionAccess(): Promise<boolean> {
    const requestId = ++functionAccessRequestId;
    const requestKvid = props.kvid;
    const isCurrentRequest = () => !isDisposed && requestId === functionAccessRequestId;

    if (!requestKvid) {
      if (isCurrentRequest()) {
        isLoading.value = false;
      }
      return isCurrentRequest();
    }

    try {
      const response = await fetch(
        `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${requestKvid}`
      );
      const data = await response.json();
      if (!isCurrentRequest()) return false;

      if (data?.Results && data.Results.length > 0) {
        const handler = data.Results[0].Handler;
        if (handler) await applyHandlerWithScript(handler, data.Results[0].Remark);
      }

      if (!isCurrentRequest()) return false;
      return true;
    } catch (error) {
      if (isCurrentRequest()) {
        loadError.value = error instanceof Error ? error.message : '页面加载失败，请重试';
        console.error('[IframePage] 获取功能权限失败:', error);
      }
      return isCurrentRequest();
    } finally {
      if (isCurrentRequest()) {
        isLoading.value = false;
      }
    }
  }

  async function applyRouteHandler(handler: string): Promise<boolean> {
    functionAccessRequestId++;
    if (isDisposed) return false;
    try {
      await applyHandlerWithScript(handler, props.scriptPath);
      return !isDisposed;
    } catch (error) {
      if (!isDisposed) loadError.value = error instanceof Error ? error.message : '页面加载失败，请重试';
      return false;
    } finally {
      if (!isDisposed) isLoading.value = false;
    }
  }

  // 生成页面实例 ID
  function initPageId() {
    const url = renderUrl.value || (route.params.url as string) || '';
    const kvid = props.kvid || (route.query.kvid as string) || '';
    pageId.value = generatePageId(url, kvid, renderType.value);
  }

  // 注册页面
  function registerCurrentPage() {
    if (isDisposed) return;
    initPageId();
    registerPage(pageId.value, renderType.value, renderUrl.value, props.kvid);
    updatePageStatus(pageId.value, 'pending');
  }

  // 处理自定义路由参数
  function handleCustomRouteParams() {
    if (isCustomRoute.value && renderType.value === 'vue') {
      const routeQuery = props.routeQuery;
      if (routeQuery) {
        if (!(window as any).customRouteParamsManager) {
          (window as any).customRouteParamsManager = {};
        }
        (window as any).customRouteParamsManager[route.fullPath] = {
          params: routeQuery,
          routeId: pageId.value,
          timestamp: Date.now(),
        };
        (window as any).currentCustomRouteKey = route.fullPath;
      }
    }
  }

  // 选择渲染组件
  const CurrentComponent = computed(() => {
    if (renderType.value === 'vue') {
      return VueComponent;
    }
    if (renderType.value === 'umd') {
      return UmdComponentPage;
    }
    return WebviewComponent;
  });

  // UMD 组件参数处理
  const umdComponentProps = computed(() => {
    if (renderType.value === 'umd') {
      // 这里的 renderUrl.value 应该已经是解析过的组件名
      const compName = renderUrl.value;
      return {
        componentName: compName,
        componentTag: dynamicUmdTag.value || undefined,
      };
    }
    return {};
  });

  // 组件就绪回调
  function handleComponentReady() {
    requestActivation(pageId.value);
  }

  // 组件清理回调
  function handleComponentCleanup() {
    if (isCustomRoute.value && (window as any).customRouteParamsManager) {
      delete (window as any).customRouteParamsManager[route.fullPath];
    }
  }

  // 注销当前页面；子渲染器的资源清理由各自的 onUnmounted 负责
  function unregisterCurrentPage() {
    if (pageId.value) {
      unregisterPage(pageId.value);
    }
  }

  async function initializePage() {
    loadError.value = '';
    isLoading.value = true;
    // 路由层明确完成解析后，不再回退调用旧 Function Access 接口。
    const shouldInitialize = props.handlerResolved || !!props.handler
      ? await applyRouteHandler(props.handler || '')
      : await fetchFunctionAccess();
    if (!shouldInitialize) return;

    registerCurrentPage();
    handleCustomRouteParams();
  }
  onMounted(initializePage);

  // 激活时更新状态
  onActivated(() => {
    if (pageId.value) {
      forceActivate(pageId.value);
    }
  });

  onUnmounted(() => {
    isDisposed = true;
    functionAccessRequestId++;
    unregisterCurrentPage();
  });

  // 路由参数变化时更新
  watch(
    () => [props.url, props.kvid, props.type, props.handler, props.handlerResolved, props.scriptPath],
    async () => {
      loadError.value = '';
      isLoading.value = true;
      dynamicHandler.value = '';
      dynamicUmdTag.value = '';
      dynamicRenderType.value = 'webview';

      const shouldInitialize = props.handlerResolved || !!props.handler
        ? await applyRouteHandler(props.handler || '')
        : await fetchFunctionAccess();
      if (!shouldInitialize) return;

      unregisterCurrentPage();
      registerCurrentPage();
      handleCustomRouteParams();
    },
    { deep: true }
  );
</script>

<template>
  <div class="iframe-page-entry">
    <div v-if="loadError" role="alert" class="pointer-events-auto p-6 text-center text-sm text-gray-600 dark:text-gray-300">
      <p>{{ loadError }}</p>
      <button type="button" class="mt-4 rounded bg-primary px-4 py-2 text-white" @click="initializePage">重新加载页面</button>
    </div>
    <!-- 加载中状态 -->
    <div
      v-else-if="isLoading"
      class="loading-state"
    >
      <i class="fas fa-spinner fa-spin" />
      <span>加载中...</span>
    </div>

    <!-- 渲染组件 -->
    <component
      v-else
      :is="CurrentComponent"
      ref="currentComponent"
      v-bind="umdComponentProps"
      :url="renderUrl"
      :kvid="kvid"
      :function-kvid="functionKvid"
      :page-id="pageId"
      :route-query="routeQuery"
      :backend-origin="backendOrigin"
      @ready="handleComponentReady"
      @cleanup="handleComponentCleanup"
    />
  </div>
</template>

<style scoped>
  .iframe-page-entry {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 14px;
    gap: 12px;
  }

  .loading-state i {
    font-size: 24px;
  }
</style>
