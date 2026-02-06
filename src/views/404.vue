<script setup lang="ts">
import { onMounted, onUnmounted,ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const countdown = ref(5)
let countTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 获取原始请求路径
  const originalPath = route.path

  // 如果是 /404 本身，停止倒计时
  if (originalPath === '/404') {
    return
  }

  // 倒计时后刷新页面（只执行一次）
  countTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (countTimer) {
        clearInterval(countTimer)
        countTimer = null
      }
      // 使用 location.reload() 刷新
      window.location.reload()
    }
  }, 1000)
})

// 组件卸载时清理
onUnmounted(() => {
  if (countTimer) {
    clearInterval(countTimer)
    countTimer = null
  }
})
</script>

<template>
  <div class="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
    <div class="text-center">
      <p class="text-base font-semibold text-indigo-600">404</p>
      <h1 class="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">Page not found</h1>
      <p class="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">Sorry, we couldn't find the page you're looking for.</p>
      <p class="mt-4 text-sm text-gray-400 animate-pulse">
        正在加载动态路由，{{ countdown }}秒后刷新页面...
      </p>
    </div>
  </div>
</template>
