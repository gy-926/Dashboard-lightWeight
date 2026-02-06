<script setup lang="ts">
  defineOptions({ inheritAttrs: false });
  import {
    ref,
    shallowRef,
    computed,
    onMounted,
    onUnmounted,
    watch,
    h,
    reactive,
    nextTick,
  } from 'vue';
  import * as Vue from 'vue';
  import { useTeleportManager, type PageType } from '@/store/modules/teleport-manager';
  import { loadModule } from 'vue3-sfc-loader';

  const props = defineProps<{
    url: string;
    pageId: string;
    kvid?: string;
    functionKvid?: string;
    routeQuery?: Record<string, string>;
    backendOrigin?: string;
  }>();

  const emit = defineEmits<{
    (e: 'ready'): void;
    (e: 'cleanup'): void;
  }>();

  const { shouldShowPage, updatePageStatus, debouncedRequestActivation } = useTeleportManager();

  const dynamicComponent = shallowRef<any>(null);
  const componentError = ref<string | null>(null);
  const isLoading = ref(true);

  // 是否显示
  const shouldRender = computed(() => shouldShowPage(props.pageId));

  // 远程组件的 URL（支持从 props.url 或 props.functionKvid 获取）
  const componentUrl = computed(() => {
    const origin = props.backendOrigin || '';
    // 优先使用 functionKvid（远程组件路径），其次使用 kvid，最后使用 url
    const url = props.url || '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${origin}${url}`;
  });

  // 内部组件映射（可选）
  const internalComponents: Record<string, any> = {
    // 可以在这里注册内置组件
    // 'SampleComponent': SampleComponent,
  };

  // 加载远程组件
  async function loadRemoteComponent() {
    isLoading.value = true;
    componentError.value = null;

    try {
      // 检查是否是内部组件
      const componentName = props.url.split('/').pop()?.replace('.vue', '') || '';
      if (internalComponents[componentName]) {
        dynamicComponent.value = internalComponents[componentName];
        isLoading.value = false;
        updatePageStatus(props.pageId, 'ready');
        emit('ready');
        return;
      }

      // 使用 vue3-sfc-loader 加载远程组件
      // 提取路径部分用于代理请求（避免 CORS 问题）
      const getProxyUrl = (fullUrl: string) => {
        // 如果是绝对 URL，提取路径部分
        if (fullUrl.startsWith('http')) {
          const url = new URL(fullUrl);
          return url.pathname;
        }
        return fullUrl;
      };

      const options = {
        moduleCache: {
          vue: Vue,
        },
        async getFile(url: string) {
          // 使用代理路径请求
          const proxyUrl = getProxyUrl(url);
          const response = await fetch(proxyUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${proxyUrl}: ${response.statusText}`);
          }
          return response.text();
        },
        addStyle(textContent: string) {
          const style = Object.assign(document.createElement('style'), { textContent });
          const ref = document.head.getElementsByTagName('style')[0] || null;
          document.head.insertBefore(style, ref);
        },
      };

      dynamicComponent.value = await loadModule(componentUrl.value, options);
      isLoading.value = false;
      updatePageStatus(props.pageId, 'ready');
      emit('ready');
    } catch (e: any) {
      componentError.value = `加载组件失败: ${e.message}`;
      isLoading.value = false;
      updatePageStatus(props.pageId, 'ready');
    }
  }

  // 监听显示状态
  watch(
    () => shouldShowPage(props.pageId),
    show => {
      if (show) {
        debouncedRequestActivation(props.pageId);
        updatePageStatus(props.pageId, 'active');
      } else {
        updatePageStatus(props.pageId, 'hidden');
      }
    },
    { immediate: true }
  );

  // 清理函数
  function cleanup() {
    dynamicComponent.value = null;
    emit('cleanup');
  }

  onMounted(() => {
    updatePageStatus(props.pageId, 'loading');
    loadRemoteComponent();
  });

  onUnmounted(() => {
    cleanup();
  });

  // 简单的 Vue 加载器（如果 vue3-sfc-loader 不可用时）
  function loadModuleFallback() {
    // 备用方案：直接返回渲染函数
    return h('div', { class: 'vue-component-fallback' }, [
      h('p', '动态组件加载功能需要 vue3-sfc-loader 库'),
      h('p', `URL: ${componentUrl.value}`),
    ]);
  }

  // 动态导入 Vue（用于 sfc-loader）
  // 使用完整的 Vue 模块，确保所有 API 可用

  defineExpose({
    cleanup,
  });
</script>

<template>
  <Teleport to="#global-content-teleport-target">
    <div
      v-show="shouldRender"
      class="vue-component-container"
      :data-page-id="pageId"
    >
      <!-- 加载状态 -->
      <div
        v-if="isLoading"
        class="vue-loading"
      >
        <span>加载中...</span>
      </div>

      <!-- 错误状态 -->
      <div
        v-else-if="componentError"
        class="vue-error"
      >
        <p>{{ componentError }}</p>
        <p>URL: {{ componentUrl }}</p>
      </div>

      <!-- 动态组件 -->
      <component
        v-else-if="dynamicComponent"
        :is="dynamicComponent"
        class="vue-component-content"
      />

      <!-- 空状态 -->
      <div
        v-else
        class="vue-empty"
      >
        <p>组件不存在</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
  .vue-component-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .vue-component-content {
    width: 100%;
    height: 100%;
  }

  .vue-loading,
  .vue-error,
  .vue-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #909399;
    font-size: 14px;
  }

  .vue-error {
    color: #f56c6c;
  }
</style>
