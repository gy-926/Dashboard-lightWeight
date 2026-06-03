<script setup lang="ts">
  defineOptions({ name: 'IframePage' });
  import {
    ref,
    onMounted,
    onUnmounted,
    onActivated,
    computed,
    watch,
    getCurrentInstance,
  } from 'vue';
  import { useRoute } from 'vue-router';
  import {
    useTeleportManager,
    generatePageId,
    type PageType,
  } from '@/store/modules/teleport-manager';
  import WebviewComponent from './webview.vue';
  import VueComponent from './vueComponent.vue';
  import UmdComponentPage from '../umd-component/index.vue';
  import { kivii } from '@kivii.com/bridge';
  import { getGlobalConfig } from '@/router/routes';
  import { loadUmdOnDemand } from '@/utils/remoteComponentLoader';
  import { adminSupabase } from '@/utils/supabase-admin';

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
  const instance = getCurrentInstance();
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
    if (type === 'vue' || type === 'umd') {
      return type;
    }
    // 如果 URL 以 .vue 结尾，识别为 Vue 组件
    if (props.url?.endsWith('.vue') || props.functionKvid?.endsWith('.vue')) {
      return 'vue';
    }
    // 如果 URL 是以 < 开头且包含 > 的标签形式，识别为 UMD 组件
    if (props.url?.startsWith('<') && props.url?.includes('>')) {
      return 'umd';
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

    // 包含 < 和 > 的标签形式，作为 UMD 组件
    if (handler.startsWith('<') && handler.includes('>')) {
      return 'umd';
    }

    return 'webview';
  }

  function normalizeRenderType(
    renderType?: string | null,
    handler?: string | null
  ): PageType {
    if (renderType === 'umd' || renderType === 'vue' || renderType === 'webview') {
      return renderType;
    }
    return determineRenderTypeByHandler(handler || '');
  }

  // 从类似 <SmartStandardLibrary> 的标签中提取组件名
  function extractComponentName(tag: string): string {
    if (!tag) return '';
    const match = tag.match(/<([a-zA-Z0-9-]+)[^>]*>/);
    return match ? match[1] : tag;
  }

  async function applyFunctionDefinition(definition: {
    handler?: string | null;
    remark?: string | null;
    renderType?: string | null;
    sourceUrl?: string | null;
  }) {
    const handler = definition.handler || '';
    if (!handler) return;

    const config = getGlobalConfig();
    let origin = config.Origin || '';
    if (!origin && config.UseWindowOrigin) {
      origin = window.location.origin;
    }

    dynamicRenderType.value = normalizeRenderType(definition.renderType, handler);

    if (handler.startsWith('http')) {
      dynamicHandler.value = handler;
      return;
    }

    if (dynamicRenderType.value === 'umd') {
      const compName = extractComponentName(handler);
      dynamicHandler.value = compName;

      const scriptPath = definition.sourceUrl || definition.remark || '';
      if (scriptPath && instance) {
        const isRegistered = Object.prototype.hasOwnProperty.call(
          instance.appContext.components,
          compName
        );
        if (!isRegistered) {
          await loadUmdOnDemand(instance.appContext.app, scriptPath);
        }
      }
      return;
    }

    dynamicHandler.value = handler.startsWith('/') ? origin + handler : handler;
  }

  async function fetchFunctionDefinitionFromSupabase(): Promise<boolean> {
    if (!props.functionKvid) return false;

    const { data, error } = await adminSupabase
      .from('functions')
      .select('handler, remark, render_type, source_url, is_active')
      .eq('kvid', props.functionKvid)
      .single();

    if (error || !data || data.is_active === false) {
      return false;
    }

    await applyFunctionDefinition({
      handler: data.handler,
      remark: data.remark,
      renderType: data.render_type,
      sourceUrl: data.source_url,
    });

    return true;
  }

  async function fetchLegacyFunctionAccess(): Promise<void> {
    if (!props.kvid) return;

    const response = await kivii.request.get<any>(
      `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${props.kvid}`
    );
    const data = response.data;

    if (data?.Results && data.Results.length > 0) {
      await applyFunctionDefinition({
        handler: data.Results[0].Handler,
        remark: data.Results[0].Remark,
      });
    }
  }

  // 获取功能访问权限并决定渲染方式
  async function fetchFunctionAccess() {
    if (!props.kvid && !props.functionKvid) {
      isLoading.value = false;
      return;
    }

    try {
      const loadedFromSupabase = await fetchFunctionDefinitionFromSupabase();
      if (!loadedFromSupabase) {
        await fetchLegacyFunctionAccess();
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
        // 这里可以继续向下透传需要的参数
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
      v-bind="umdComponentProps"
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
