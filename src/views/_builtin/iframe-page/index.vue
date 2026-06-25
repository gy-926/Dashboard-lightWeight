<script setup lang="ts">
  defineOptions({ name: 'IframePage' });
  import { ref, onMounted, onUnmounted, onActivated, computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { useEventBus } from '@vueuse/core';
  import {
    useTeleportManager,
    generatePageId,
    type PageType,
  } from '@/store/modules/teleport-manager';
  import WebviewComponent from './webview.vue';
  import VueComponent from './vueComponent.vue';
  import UmdComponentPage from '../umd-component/index.vue';

  // 路由 props
  const props = defineProps<{
    url: string;
    kvid?: string;
    functionKvid?: string;
    handler?: string; // 关联函数的 handler，由路由层直接传入，无需再调接口
    type?: PageType;
    routeQuery?: Record<string, string>;
    backendOrigin?: string;
  }>();

  const route = useRoute();
  const { registerPage, unregisterPage, updatePageStatus, requestActivation, forceActivate } =
    useTeleportManager();

  const pageId = ref<string>('');
  const cleanupCallbacks = ref<(() => void)[]>([]);

  // 动态渲染类型（由接口决定）
  const dynamicRenderType = ref<PageType>('webview');
  const dynamicHandler = ref<string>('');
  const dynamicUmdTag = ref<string>('');
  const isLoading = ref(true);

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

  // 根据 Handler 判断渲染类型
  function determineRenderTypeByHandler(handler: string): PageType {
    if (!handler) return 'webview';

    // 以 .vue 结尾的为 Vue 组件
    if (handler.endsWith('.vue')) {
      return 'vue';
    }

    // 以组件标签形式配置的按 UMD 组件处理
    if (handler.startsWith('<') && handler.includes('>')) {
      return 'umd';
    }

    return 'webview';
  }

  // 从类似 <SmartStandardLibrary> 的标签中提取组件名
  function extractComponentName(tag: string): string {
    if (!tag) return '';
    const match = tag.match(/<([a-zA-Z0-9-]+)[^>]*>/);
    return match ? match[1] : tag;
  }
  // 将 handler 字符串解析并应用到响应式状态
  function applyHandler(handler: string) {
    if (!handler) return;
    const resolvedType = determineRenderTypeByHandler(handler);
    dynamicRenderType.value = resolvedType;

    if (resolvedType === 'umd') {
      dynamicHandler.value = extractComponentName(handler);
      dynamicUmdTag.value = handler;
    } else if (handler.startsWith('http')) {
      dynamicHandler.value = handler;
    } else {
      dynamicHandler.value = 'https://datav.kivii.org' + handler;
    }
  }

  // 兜底：通过接口查询 handler（仅 handler prop 不存在时使用）
  async function fetchFunctionAccess() {
    if (!props.kvid) {
      isLoading.value = false;
      return;
    }

    try {
      const response = await fetch(
        `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${props.kvid}`
      );
      const data = await response.json();

      if (data?.Results && data.Results.length > 0) {
        const handler = data.Results[0].Handler;
        if (handler) applyHandler(handler);
      }
    } catch (error) {
      console.error('[IframePage] 获取功能权限失败:', error);
    } finally {
      isLoading.value = false;
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
      // 这里的 renderUrl.value 应该已经是通过 extractComponentName 处理过的组件名
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

  // 清理所有资源
  function cleanupAll() {
    cleanupCallbacks.value.forEach(cb => {
      try {
        cb();
      } catch (e) {
        // 忽略清理错误
      }
    });
    cleanupCallbacks.value = [];

    if (pageId.value) {
      unregisterPage(pageId.value);
    }
  }

  // 监听标签关闭事件
  const tabCloseBus = useEventBus<string>('tab-close');
  onMounted(async () => {
    // 优先使用路由层传入的 handler，避免接口调用
    if (props.handler) {
      applyHandler(props.handler);
      isLoading.value = false;
    } else {
      await fetchFunctionAccess();
    }

    registerCurrentPage();
    handleCustomRouteParams();

    // 监听标签关闭
    tabCloseBus.on(closedPath => {
      if (closedPath === route.path && pageId.value) {
        cleanupAll();
      }
    });
  });

  // 激活时更新状态
  onActivated(() => {
    if (pageId.value) {
      forceActivate(pageId.value);
    }
  });

  onUnmounted(() => {
    cleanupAll();
  });

  // 路由参数变化时更新
  watch(
    () => [props.url, props.kvid, props.type, props.handler],
    async () => {
      isLoading.value = true;
      dynamicHandler.value = '';
      dynamicUmdTag.value = '';
      dynamicRenderType.value = 'webview';

      if (props.handler) {
        applyHandler(props.handler);
        isLoading.value = false;
      } else {
        await fetchFunctionAccess();
      }

      cleanupAll();
      registerCurrentPage();
      handleCustomRouteParams();
    },
    { deep: true }
  );
</script>

<template>
  <div class="iframe-page-entry">
    <!-- 加载中状态 -->
    <div
      v-if="isLoading"
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
