<script setup lang="ts">
  import { ref, shallowRef, computed, onMounted, watch } from 'vue';
  import * as Vue from 'vue';
  import { useTeleportManager, generateComponentCacheKey } from '@/store/modules/teleport-manager';
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

  const {
    shouldShowPage,
    updatePageStatus,
    debouncedRequestActivation,
    getVueComponent,
    setVueComponent,
    hasVueComponent,
    getVueComponentLoading,
    setVueComponentLoading,
    deleteVueComponentLoading,
  } = useTeleportManager();

  const dynamicComponent = shallowRef<any>(null);
  const componentError = ref<string | null>(null);
  const isLoading = ref(true);

  // 缓存键只基于 URL 和 kvid（不要基于 pageId，因为 pageId 每次都会变）
  const cacheKey = computed(() =>
    generateComponentCacheKey(props.url, props.kvid || '', props.backendOrigin)
  );

  // 是否显示
  const shouldRender = computed(() => shouldShowPage(props.pageId));

  // 远程组件的 URL
  const componentUrl = computed(() => {
    const origin = props.backendOrigin || '';
    const url = props.url || '';
    if (url.startsWith('http')) {
      return url;
    }
    return `${origin}${url}`;
  });

  // 内部组件映射
  const internalComponents: Record<string, any> = {
    // 'SampleComponent': SampleComponent,
  };

  // 加载远程组件
  async function loadRemoteComponent() {
    const key = cacheKey.value;

    // 检查全局缓存 - 有缓存就直接用
    if (hasVueComponent(key)) {
      const cached = getVueComponent(key);
      // 缓存结构: { component: 组件定义 }
      dynamicComponent.value = cached?.component || cached;
      isLoading.value = false;
      updatePageStatus(props.pageId, 'ready');
      emit('ready');
      return;
    }

    // 检查是否正在加载
    const loadingPromise = getVueComponentLoading(key);
    if (loadingPromise) {
      await loadingPromise;
      const cached = getVueComponent(key);
      dynamicComponent.value = cached?.component || cached;
      isLoading.value = false;
      updatePageStatus(props.pageId, 'ready');
      emit('ready');
      return;
    }

    isLoading.value = true;
    componentError.value = null;

    // 创建加载 Promise
    const loadPromise = (async () => {
      try {
        // 检查内部组件
        const componentName = props.url.split('/').pop()?.replace('.vue', '') || '';
        if (internalComponents[componentName]) {
          const comp = internalComponents[componentName];
          setVueComponent(key, { component: comp });
          return comp;
        }

        // 使用 vue3-sfc-loader 加载远程组件
        const getProxyUrl = (fullUrl: string) => {
          if (fullUrl.startsWith('http')) {
            const url = new URL(fullUrl);
            return url.pathname;
          }
          return fullUrl;
        };

        const options = {
          moduleCache: { vue: Vue },
          async getFile(url: string) {
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

        const component = await loadModule(componentUrl.value, options);
        setVueComponent(key, { component }); // 缓存组件定义
        return component;
      } catch (e: any) {
        componentError.value = `加载组件失败: ${e.message}`;
        throw e;
      }
    })();

    setVueComponentLoading(key, loadPromise);

    try {
      const component = await loadPromise;
      dynamicComponent.value = component;
    } finally {
      isLoading.value = false;
      deleteVueComponentLoading(key);
      updatePageStatus(props.pageId, 'ready');
      emit('ready');
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

  onMounted(() => {
    updatePageStatus(props.pageId, 'loading');
    loadRemoteComponent();
  });

  // 暴露 reload 方法
  defineExpose({
    reload: () => {
      loadRemoteComponent();
    },
  });
</script>

<template>
  <Teleport to="#extjs-root">
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
    pointer-events: auto;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
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
