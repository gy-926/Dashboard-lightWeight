<template>
  <div v-if="menuLoadError && $route.path !== '/login'" class="app-loading-overlay" role="alert">
    <div class="app-loading-content">
      <p class="text-lg font-medium text-gray-800">菜单加载失败</p>
      <p class="app-loading-text my-4">{{ menuLoadError }}</p>
      <button type="button" class="rounded bg-blue-600 px-5 py-2 text-white disabled:opacity-50" :disabled="retrying" @click="retryMenus">{{ retrying ? '重试中...' : '重新加载菜单' }}</button>
    </div>
  </div>
  <!-- 加载遮罩层：动态路由加载完成前显示，但登录页除外 -->
  <div v-else-if="!isReady && $route.path !== '/login'" class="app-loading-overlay">
    <div class="app-loading-content">
      <div class="app-loading-spinner"></div>
      <p class="app-loading-text">加载中...</p>
    </div>
  </div>
  <!-- 主应用内容 -->
  <RouterView v-else />
  <!-- KVID 动态页面的永久宿主，位于 router-view 外以保留真实页面实例。 -->
  <PageHostPilot />
  <PageHostCapacityNotice />
  <!-- 登录过期弹窗 -->
  <ReLoginDialog v-if="reLoginVisible && !['/login', '/update-password'].includes(route.path)" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { waitForRoutesReady, reloadDynamicRoutes } from '@/router'
import { menuLoadError } from '@/router/load-state'
import { useReLogin } from '@/composables/useReLogin'
import ReLoginDialog from '@/components/ReLoginDialog.vue'
import PageHostPilot from '@/runtime/page-host/PageHostPilot.vue'
import { usePageHostPilotStore } from '@/runtime/page-host/pilot-store'
import { toPageHostRoute } from '@/runtime/page-host/route'
import PageHostCapacityNotice from '@/runtime/page-host/PageHostCapacityNotice.vue'
import { getGlobalConfig } from '@/router/routes'
import { getPageHostPilotDecision } from '@/runtime/page-host/pilot-config'
import { pageHostDiagnostics } from '@/runtime/page-host/diagnostics'

const { visible: reLoginVisible } = useReLogin()
const route = useRoute()
const pageHostPilot = usePageHostPilotStore()

const isReady = ref(false)
const retrying = ref(false)
async function retryMenus() {
  if (retrying.value) return
  retrying.value = true
  isReady.value = false
  try { await reloadDynamicRoutes() }
  finally { isReady.value = true; retrying.value = false }
}

watch(
  () => route.fullPath,
  () => {
    const pageRoute = toPageHostRoute(route)
    const decision = getPageHostPilotDecision(getGlobalConfig(), pageRoute.kvid)
    if (!decision.eligible) {
      pageHostDiagnostics.record({
        event: 'skipped',
        path: pageRoute.path,
        kvid: pageRoute.kvid,
        skipReason: decision.reason,
      })
    }
    if (pageHostPilot.prepareRoute(pageRoute, decision.eligible)) {
      void pageHostPilot.resolveRoute(pageRoute)
    }
  },
  { immediate: true, flush: 'sync' }
)

onMounted(() => {
  waitForRoutesReady().then(() => {
    isReady.value = true
  })
})
</script>

<style scoped>
.app-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.app-loading-content {
  text-align: center;
}

.app-loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.app-loading-text {
  color: #909399;
  font-size: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
