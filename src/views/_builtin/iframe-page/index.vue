<script setup lang="ts">
  import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
  import { useRoute } from 'vue-router';
  import { useEventBus } from '@vueuse/core';
  import {
    useTeleportManager,
    generatePageId,
    type PageType,
  } from '@/store/modules/teleport-manager';
  import WebviewComponent from './webview.vue';
  import ExtJsComponent from './extJs.vue';
  import VueComponent from './vueComponent.vue';

  // 路由 props
  const props = defineProps<{
    url: string;
    kvid?: string;
    functionKvid?: string;
    type?: PageType;
    routeQuery?: Record<string, string>;
    backendOrigin?: string;
  }>();

  const route = useRoute();
  const { registerPage, unregisterPage, updatePageStatus, getPage, requestActivation } =
    useTeleportManager();

  const pageId = ref<string>('');
  const currentComponent = ref<any>(null);
  const cleanupCallbacks = ref<(() => void)[]>([]);

  // 动态渲染类型（由接口决定）
  const dynamicRenderType = ref<PageType>('webview');
  const dynamicHandler = ref<string>('');
  const isLoading = ref(true);

  // 最终渲染类型（优先使用动态类型，否则使用 props.type）
  const renderType = computed((): PageType => {
    if (dynamicRenderType.value !== 'webview') {
      return dynamicRenderType.value;
    }
    const type = props.type?.toLowerCase() as PageType;
    if (type === 'extjs' || type === 'vue') {
      return type;
    }
    // 如果 URL 以 .vue 结尾，识别为 Vue 组件
    if (props.url?.endsWith('.vue') || props.functionKvid?.endsWith('.vue')) {
      return 'vue';
    }
    if (props.functionKvid?.startsWith('ExtJS.')) {
      return 'extjs';
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

    // App 开头的为 ExtJS
    if (handler.startsWith('App')) {
      return 'extjs';
    }

    // 以 .vue 结尾的为 Vue 组件
    if (handler.endsWith('.vue')) {
      return 'vue';
    }

    return 'webview';
  }

  // 获取功能访问权限并决定渲染方式
  async function fetchFunctionAccess() {
    if (!props.kvid) {
      isLoading.value = false;
      return;
    }

    try {
      console.log('[IframePage] 获取功能权限:', props.kvid);
      const response = await fetch(
        `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${props.kvid}`
      );
      const data = await response.json();
      console.log('[IframePage] Access API 完整响应:', JSON.stringify(data, null, 2));
      const origin = 'https://datav.kivii.org';
      console.log('[IframePage] 接口返回:', data);

      if (data?.Results && data.Results.length > 0) {
        const handler = data.Results[0].Handler;
        console.log('[IframePage] Handler:', handler);

        if (handler) {
          // 如果 handler 已经是绝对路径，直接使用；否则拼接 origin
          if (handler.startsWith('http')) {
            dynamicHandler.value = handler;
          } else {
            dynamicHandler.value = origin + handler;
          }
          dynamicRenderType.value = determineRenderTypeByHandler(handler);
          console.log('[IframePage] 渲染类型:', dynamicRenderType.value);
        }
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
        // 将路由参数写入全局管理器
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
    switch (renderType.value) {
      case 'extjs':
        return ExtJsComponent;
      case 'vue':
        return VueComponent;
      default:
        return WebviewComponent;
    }
  });

  // 组件就绪回调
  function handleComponentReady() {
    requestActivation(pageId.value);
  }

  // 组件清理回调
  function handleComponentCleanup() {
    // 移除自定义路由参数
    if (isCustomRoute.value && (window as any).customRouteParamsManager) {
      delete (window as any).customRouteParamsManager[route.fullPath];
    }
  }

  // 清理所有资源
  function cleanupAll() {
    // 调用所有子组件的清理函数
    cleanupCallbacks.value.forEach(cb => {
      try {
        cb();
      } catch (e) {
        // 忽略清理错误
      }
    });
    cleanupCallbacks.value = [];

    // 注销页面
    if (pageId.value) {
      unregisterPage(pageId.value);
    }
  }

  // 监听标签关闭事件
  const tabCloseBus = useEventBus<string>('tab-close');
  onMounted(async () => {
    console.log('[IframePage] 组件 props:', props);

    // 获取功能权限并决定渲染方式
    await fetchFunctionAccess();

    console.log('[IframePage] 渲染类型:', renderType.value);
    console.log('[IframePage] 渲染 URL:', renderUrl.value);

    registerCurrentPage();
    handleCustomRouteParams();

    // 监听标签关闭
    tabCloseBus.on(closedPath => {
      if (closedPath === route.path && pageId.value) {
        cleanupAll();
      }
    });
  });

  onUnmounted(() => {
    cleanupAll();
  });

  // 路由参数变化时更新
  watch(
    () => [props.url, props.kvid, props.type],
    async () => {
      isLoading.value = true;
      dynamicHandler.value = '';
      dynamicRenderType.value = 'webview';

      await fetchFunctionAccess();

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
      :url="renderUrl"
      :kvid="kvid"
      :function-kvid="functionKvid"
      :page-id="pageId"
      :route-query="routeQuery"
      :backend-origin="backendOrigin"
      :render-type="renderType"
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
