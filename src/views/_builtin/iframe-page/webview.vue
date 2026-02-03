<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useTeleportManager } from '@/store/modules/teleport-manager'

const props = defineProps<{
  url: string
  pageId: string
  routeQuery?: Record<string, string>
  kvid?: string
  functionKvid?: string
  backendOrigin?: string
}>()

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'cleanup'): void
}>()

const { shouldShowPage, updatePageStatus } = useTeleportManager()

const iframeRef = ref<HTMLIFrameElement | null>(null)
const isReady = ref(false)
const error = ref<string | null>(null)

// 完整 URL（处理路由参数拼接）
const fullUrl = computed(() => {
  if (!props.url) return ''
  if (!props.routeQuery || Object.keys(props.routeQuery).length === 0) {
    return props.url
  }
  const params = new URLSearchParams(props.routeQuery)
  const separator = props.url.includes('?') ? '&' : '?'
  return `${props.url}${separator}${params.toString()}`
})

// 是否有有效的 URL
const hasValidUrl = computed(() => {
  return fullUrl.value && (fullUrl.value.startsWith('http') || fullUrl.value.startsWith('/'))
})

// 是否显示
const shouldRender = computed(() => shouldShowPage(props.pageId))

// iframe 加载完成
function handleIframeLoad() {
  isReady.value = true
  updatePageStatus(props.pageId, 'ready')
  emit('ready')
}

function handleIframeError() {
  error.value = '页面加载失败'
  updatePageStatus(props.pageId, 'ready')
}

// 清理函数
function cleanup() {
  if (iframeRef.value) {
    iframeRef.value.src = 'about:blank'
  }
  emit('cleanup')
}

onMounted(() => {
  updatePageStatus(props.pageId, 'active')
})

onUnmounted(() => {
  cleanup()
  updatePageStatus(props.pageId, 'hidden')
})

defineExpose({
  cleanup,
})
</script>

<template>
  <Teleport to="#global-content-teleport-target">
    <!-- 有效 URL 的 iframe 渲染 -->
    <div
      v-if="hasValidUrl && shouldRender"
      class="webview-container"
      :data-page-id="pageId"
    >
      <iframe
        v-if="!error"
        ref="iframeRef"
        :src="fullUrl"
        class="webview-iframe"
        @load="handleIframeLoad"
        @error="handleIframeError"
      />
      <div v-else class="webview-error">
        <p>{{ error }}</p>
        <p>URL: {{ fullUrl }}</p>
      </div>
    </div>

    <!-- 无有效 URL 时的占位内容（直接显示在页面中） -->
    <div
      v-else-if="shouldRender"
      class="webview-placeholder"
      :data-page-id="pageId"
    >
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <i class="fas fa-puzzle-piece" />
        </div>
        <h3 class="placeholder-title">{{ kvid || functionKvid || '页面' }}</h3>
        <p class="placeholder-desc">
          <template v-if="functionKvid">
            <template v-if="functionKvid.startsWith('http')">
              外部链接页面
            </template>
            <template v-else-if="functionKvid.endsWith('.vue')">
              远程 Vue 组件
            </template>
            <template v-else-if="functionKvid.startsWith('ExtJS.')">
              ExtJS 组件
            </template>
            <template v-else>
              功能模块
            </template>
          </template>
          <template v-else>
            占位页面（未配置 URL）
          </template>
        </p>
        <p v-if="url" class="placeholder-url">URL: {{ url }}</p>
        <p v-else class="placeholder-hint">请在菜单配置中设置页面地址</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.webview-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: auto;
}

.webview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background-color: #fff;
}

.webview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #f56c6c;
  font-size: 14px;
}

.webview-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: #f5f7fa;
  pointer-events: auto;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.placeholder-icon i {
  font-size: 36px;
  color: #909399;
}

.placeholder-title {
  font-size: 24px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 12px 0;
}

.placeholder-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.placeholder-url {
  font-size: 12px;
  color: #c0c4cc;
  word-break: break-all;
  margin: 0;
}

.placeholder-hint {
  font-size: 13px;
  color: #e6a23c;
  margin: 0;
}
</style>
