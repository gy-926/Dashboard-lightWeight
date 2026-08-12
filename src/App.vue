<template>
  <!-- 加载遮罩层：动态路由加载完成前显示，但登录页除外 -->
  <div v-if="!isReady && $route.path !== '/login' && $route.path !== '/SpringLogin'" class="app-loading-overlay">
    <div class="app-loading-content">
      <div class="app-loading-spinner"></div>
      <p class="app-loading-text">加载中...</p>
    </div>
  </div>
  <!-- 主应用内容 -->
  <RouterView v-else />
  <!-- KVID 动态页面的永久宿主，位于 router-view 外以保留真实页面实例。 -->
  <PageHostPilot />
  <!-- 登录过期弹窗 -->
  <ReLoginDialog v-if="reLoginVisible" />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { waitForRoutesReady } from '@/router'
import { useReLogin } from '@/composables/useReLogin'
import ReLoginDialog from '@/components/ReLoginDialog.vue'
import PageHostPilot from '@/runtime/page-host/PageHostPilot.vue'
import { usePageHostPilotStore } from '@/runtime/page-host/pilot-store'
import type { PageIdentityQuery } from '@/runtime/page-host/types'
import { getGlobalConfig } from '@/router/routes'
import { getPageHostPilotDecision } from '@/runtime/page-host/pilot-config'
import { pageHostDiagnostics } from '@/runtime/page-host/diagnostics'

const { visible: reLoginVisible } = useReLogin()
const route = useRoute()
const pageHostPilot = usePageHostPilotStore()

const isReady = ref(false)

function normalizeRouteQuery(): PageIdentityQuery {
  return Object.entries(route.query).reduce<PageIdentityQuery>((result, [key, value]) => {
    if (Array.isArray(value)) {
      result[key] = value.filter((item): item is string => typeof item === 'string')
    } else {
      result[key] = value
    }
    return result
  }, {})
}

watch(
  () => route.fullPath,
  () => {
    const pageRoute = {
      path: route.path,
      name: route.name,
      kvid:
        (typeof route.meta?.kvid === 'string' && route.meta.kvid) ||
        (typeof route.query.kvid === 'string' && route.query.kvid) ||
        undefined,
      query: normalizeRouteQuery(),
    }
    const decision = getPageHostPilotDecision(getGlobalConfig(), pageRoute.kvid)
    if (!decision.eligible) {
      pageHostDiagnostics.record({
        event: 'skipped',
        path: pageRoute.path,
        kvid: pageRoute.kvid,
        skipReason: decision.reason,
      })
    }
    pageHostPilot.prepareRoute(pageRoute, decision.eligible)
    void pageHostPilot.resolveRoute(pageRoute)
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
