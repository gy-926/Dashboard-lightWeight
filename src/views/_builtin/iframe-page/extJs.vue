<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import { useTeleportManager, type PageType } from '@/store/modules/teleport-manager'

const props = defineProps<{
  url: string
  pageId: string
  kvid?: string
  functionKvid?: string
  routeQuery?: Record<string, string>
  backendOrigin?: string
}>()

const emit = defineEmits<{
  (e: 'ready'): void
  (e: 'cleanup'): void
}>()

const { shouldShowPage, updatePageStatus, debouncedRequestActivation } = useTeleportManager()

const containerRef = ref<HTMLElement | null>(null)
const extPanel = ref<any>(null)
const isReady = ref(false)
const error = ref<string | null>(null)

// 是否显示
const shouldRender = computed(() => shouldShowPage(props.pageId))

// ExtJS 组件名称（从 URL 中提取）
const componentName = computed(() => {
  // URL 格式: ExtJS.XXX.XXX 或直接是组件名
  const url = props.url
  if (url.startsWith('ExtJS.')) {
    return url
  }
  return url
})

// 监听显示状态
watch(() => shouldShowPage(props.pageId), (show) => {
  if (show) {
    debouncedRequestActivation(props.pageId)
    updatePageStatus(props.pageId, 'active')
  } else {
    updatePageStatus(props.pageId, 'hidden')
  }
}, { immediate: true })

// 创建 ExtJS 组件
async function createExtComponent() {
  if (!containerRef.value || typeof window.Ext === 'undefined') {
    error.value = 'ExtJS 未加载或容器不存在'
    return
  }

  try {
    // 销毁旧的组件
    if (extPanel.value) {
      try {
        extPanel.value.destroy()
      } catch (e) {
        // 忽略销毁错误
      }
      extPanel.value = null
    }

    // 清空容器
    containerRef.value.innerHTML = ''

    // 创建新的 ExtJS 面板
    const panelConfig = {
      renderTo: containerRef.value,
      title: 'ExtJS 组件',
      width: '100%',
      height: '100%',
      layout: 'fit',
      items: [],
    }

    // 如果有具体的组件名称，尝试创建
    if (componentName.value && window.Ext.create) {
      try {
        const component = window.Ext.create(componentName.value, {
          renderTo: containerRef.value,
          width: '100%',
          height: '100%',
        })
        extPanel.value = component
      } catch (e) {
        // 回退到默认面板
        extPanel.value = window.Ext.create('Ext.panel.Panel', panelConfig)
      }
    } else {
      extPanel.value = window.Ext.create('Ext.panel.Panel', panelConfig)
    }

    isReady.value = true
    updatePageStatus(props.pageId, 'ready')
    emit('ready')
  } catch (e: any) {
    error.value = `创建 ExtJS 组件失败: ${e.message}`
    updatePageStatus(props.pageId, 'ready')
  }
}

// 清理函数
function cleanup() {
  if (extPanel.value) {
    try {
      extPanel.value.destroy()
    } catch (e) {
      // 忽略销毁错误
    }
    extPanel.value = null
  }
  emit('cleanup')
}

onMounted(async () => {
  updatePageStatus(props.pageId, 'loading')

  // 等待 ExtJS 加载完成
  await nextTick()

  // 检查 ExtJS 是否可用
  if (typeof window.Ext === 'undefined') {
    // ExtJS 尚未加载完成，延迟尝试
    const checkExt = setInterval(() => {
      if (typeof window.Ext !== 'undefined') {
        clearInterval(checkExt)
        createExtComponent()
      }
    }, 100)

    // 10秒后超时
    setTimeout(() => {
      clearInterval(checkExt)
      if (!isReady.value) {
        error.value = 'ExtJS 加载超时'
        updatePageStatus(props.pageId, 'ready')
      }
    }, 10000)
  } else {
    createExtComponent()
  }
})

onUnmounted(() => {
  cleanup()
})

defineExpose({
  cleanup,
})
</script>

<template>
  <Teleport to="#global-content-teleport-target">
    <div
      v-show="shouldRender"
      ref="containerRef"
      class="extjs-container"
      :data-page-id="pageId"
    >
      <div v-if="error" class="extjs-error">
        <p>{{ error }}</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.extjs-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.extjs-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #f56c6c;
  font-size: 14px;
}
</style>
