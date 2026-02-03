<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useEventBus } from '@vueuse/core'
import { useTeleportManager, generatePageId, type PageType } from '@/store/modules/teleport-manager'
import WebviewComponent from './webview.vue'
import ExtJsComponent from './extJs.vue'
import VueComponent from './vueComponent.vue'

// 路由 props
const props = defineProps<{
  url: string
  kvid?: string
  functionKvid?: string
  type?: PageType
  routeQuery?: Record<string, string>
  backendOrigin?: string
}>()

const route = useRoute()
const {
  registerPage,
  unregisterPage,
  updatePageStatus,
  getPage,
  requestActivation,
} = useTeleportManager()

const pageId = ref<string>('')
const currentComponent = ref<any>(null)
const cleanupCallbacks = ref<(() => void)[]>([])

// 确定渲染类型
const renderType = computed((): PageType => {
  const type = props.type?.toLowerCase() as PageType
  if (type === 'extjs' || type === 'vue') {
    return type
  }
  // 如果 URL 以 .vue 结尾，识别为 Vue 组件
  if (props.url?.endsWith('.vue') || props.functionKvid?.endsWith('.vue')) {
    return 'vue'
  }
  if (props.functionKvid?.startsWith('ExtJS.')) {
    return 'extjs'
  }
  return 'webview'
})

// 是否为自定义路由场景
const isCustomRoute = computed(() => {
  const path = route.path
  return path.startsWith('/custom_') || path.startsWith('/bridge_')
})

// 获取后端 origin
const backendOrigin = computed(() => {
  return props.backendOrigin || ''
})

// 生成页面实例 ID
function initPageId() {
  const url = props.url || route.params.url as string || ''
  const kvid = props.kvid || route.query.kvid as string || ''
  pageId.value = generatePageId(url, kvid, renderType.value)
}

// 注册页面
function registerCurrentPage() {
  initPageId()
  registerPage(pageId.value, renderType.value, props.url, props.kvid)
  updatePageStatus(pageId.value, 'pending')
}

// 处理自定义路由参数
function handleCustomRouteParams() {
  if (isCustomRoute.value && props.type === 'vue') {
    const routeQuery = props.routeQuery
    if (routeQuery) {
      // 将路由参数写入全局管理器
      if (!(window as any).customRouteParamsManager) {
        (window as any).customRouteParamsManager = {}
      }
      ;(window as any).customRouteParamsManager[route.fullPath] = {
        params: routeQuery,
        routeId: pageId.value,
        timestamp: Date.now(),
      }
      ;(window as any).currentCustomRouteKey = route.fullPath
    }
  }
}

// 选择渲染组件
const CurrentComponent = computed(() => {
  switch (renderType.value) {
    case 'extjs':
      return ExtJsComponent
    case 'vue':
      return VueComponent
    default:
      return WebviewComponent
  }
})

// 组件就绪回调
function handleComponentReady() {
  requestActivation(pageId.value)
}

// 组件清理回调
function handleComponentCleanup() {
  // 移除自定义路由参数
  if (isCustomRoute.value && (window as any).customRouteParamsManager) {
    delete (window as any).customRouteParamsManager[route.fullPath]
  }
}

// 清理所有资源
function cleanupAll() {
  // 调用所有子组件的清理函数
  cleanupCallbacks.value.forEach(cb => {
    try {
      cb()
    } catch (e) {
      // 忽略清理错误
    }
  })
  cleanupCallbacks.value = []

  // 注销页面
  if (pageId.value) {
    unregisterPage(pageId.value)
  }
}

// 监听标签关闭事件
const tabCloseBus = useEventBus<string>('tab-close')
onMounted(() => {
  registerCurrentPage()
  handleCustomRouteParams()

  // 监听标签关闭
  tabCloseBus.on((closedPath) => {
    if (closedPath === route.path && pageId.value) {
      cleanupAll()
    }
  })
})

onUnmounted(() => {
  cleanupAll()
})

// 路由参数变化时更新
watch(() => [props.url, props.kvid, props.type], () => {
  cleanupAll()
  registerCurrentPage()
  handleCustomRouteParams()
}, { deep: true })
</script>

<template>
  <div class="iframe-page-entry">
    <component
      :is="CurrentComponent"
      ref="currentComponent"
      :url="url"
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
</style>
