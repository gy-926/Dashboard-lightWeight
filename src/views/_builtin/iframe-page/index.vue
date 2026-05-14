<script setup lang="ts">
  defineOptions({ name: 'IframePage' });
  import { ref, onMounted, onUnmounted, onActivated, computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import {
    useTeleportManager,
    generatePageId,
    type PageType,
  } from '@/store/modules/teleport-manager';
  import WebviewComponent from './webview.vue';
  import VueComponent from './vueComponent.vue';
  // [MOCK MODE] 已注释掉后端请求依赖
  // import { kivii } from '@kivii.com/bridge';
  import { getGlobalConfig } from '@/router/routes';

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
  const { registerPage, unregisterPage, updatePageStatus, requestActivation, forceActivate } =
    useTeleportManager();

  const pageId = ref<string>('');
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

    return 'webview';
  }

  // 获取功能访问权限并决定渲染方式
  async function fetchFunctionAccess() {
    if (!props.kvid) {
      isLoading.value = false;
      return;
    }

    // [MOCK MODE] 返回本地演示页面，跳过后端权限请求
    // 恢复后端连接时，注释掉下面的 mock 逻辑，取消注释下方原始请求代码
    dynamicHandler.value = window.location.origin + '/mock-demo.html';
    dynamicRenderType.value = 'webview';
    isLoading.value = false;
    return;

    // ── 原始后端请求（恢复时取消注释）──
    // try {
    //   const response = await kivii.request.get<any>(
    //     `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${props.kvid}`
    //   );
    //   const data = response.data;
    //
    //   const config = getGlobalConfig();
    //   let origin = config.Origin || '';
    //   if (!origin && config.UseWindowOrigin) {
    //     origin = window.location.origin;
    //   }
    //
    //   if (data?.Results && data.Results.length > 0) {
    //     const handler = data.Results[0].Handler;
    //     if (handler) {
    //       if (handler.startsWith('http')) {
    //         dynamicHandler.value = handler;
    //       } else {
    //         dynamicHandler.value = origin + handler;
    //       }
    //       dynamicRenderType.value = determineRenderTypeByHandler(handler);
    //     }
    //   }
    // } catch (error) {
    //   console.error('[IframePage] 获取功能权限失败:', error);
    // } finally {
    //   isLoading.value = false;
    // }
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
        if (!window.customRouteParamsManager) {
          window.customRouteParamsManager = {};
        }
        window.customRouteParamsManager[route.fullPath] = {
          params: routeQuery,
          routeId: pageId.value,
          timestamp: Date.now(),
        };
        window.currentCustomRouteKey = route.fullPath;
      }
    }
  }

  // 选择渲染组件
  const CurrentComponent = computed(() => {
    return renderType.value === 'vue' ? VueComponent : WebviewComponent;
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

  onMounted(async () => {
    await fetchFunctionAccess();
    registerCurrentPage();
    handleCustomRouteParams();
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
