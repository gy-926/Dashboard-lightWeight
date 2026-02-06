<template>
  <!-- 加载遮罩层：动态路由加载完成前显示 -->
  <div v-if="!isReady" class="app-loading-overlay">
    <div class="app-loading-content">
      <div class="app-loading-spinner"></div>
      <p class="app-loading-text">加载中...</p>
    </div>
  </div>
  <!-- 主应用内容 -->
  <RouterView v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { isDynamicRoutesReady } from '@/router'

const isReady = ref(false)

onMounted(async () => {
  // 等待动态路由加载完成
  if (!isDynamicRoutesReady()) {
    // 动态路由还在加载中，等待完成
    // isReady 保持 false，显示遮罩层
  } else {
    // 动态路由已经加载完成
    isReady.value = true
  }

  // 监听动态路由加载完成
  const checkReady = () => {
    if (isDynamicRoutesReady()) {
      isReady.value = true
    }
  }

  // 轮询检查（作为备用方案）
  const pollInterval = setInterval(checkReady, 50)

  // 清理轮询
  return () => {
    clearInterval(pollInterval)
  }
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
