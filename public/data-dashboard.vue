<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 模拟数据
const stats = ref([
  { label: '今日访问', value: 0, target: 1234, icon: '👁️', color: '#3b82f6' },
  { label: '新增用户', value: 0, target: 89, icon: '👤', color: '#10b981' },
  { label: '订单数量', value: 0, target: 156, icon: '📦', color: '#f59e0b' },
  { label: '收入金额', value: 0, target: 8960, icon: '💰', color: '#ef4444' }
])

const activities = ref([
  { time: '09:15', user: '张三', action: '提交了订单 #20240203001', type: 'order' },
  { time: '09:32', user: '李四', action: '完成了用户认证', type: 'auth' },
  { time: '10:05', user: '王五', action: '上传了新文档', type: 'upload' },
  { time: '10:28', user: '赵六', action: '发起了退款申请', type: 'refund' },
  { time: '11:00', user: '系统', action: '自动备份完成', type: 'system' }
])

const chartData = ref<number[]>([])
const currentTime = ref(new Date().toLocaleTimeString())

// 动画计数器
let animationTimer: number | null = null
let timeTimer: number | null = null

function animateNumbers() {
  const duration = 1500
  const steps = 60
  const interval = duration / steps
  let step = 0

  animationTimer = window.setInterval(() => {
    step++
    const progress = step / steps
    const easeOut = 1 - Math.pow(1 - progress, 3)

    stats.value.forEach(stat => {
      stat.value = Math.round(stat.target * easeOut)
    })

    if (step >= steps) {
      if (animationTimer) clearInterval(animationTimer)
    }
  }, interval)
}

function generateChartData() {
  chartData.value = Array.from({ length: 12 }, () => Math.floor(Math.random() * 80) + 20)
}

function updateTime() {
  currentTime.value = new Date().toLocaleTimeString()
}

onMounted(() => {
  animateNumbers()
  generateChartData()
  timeTimer = window.setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (animationTimer) clearInterval(animationTimer)
  if (timeTimer) clearInterval(timeTimer)
})

const maxChartValue = computed(() => Math.max(...chartData.value, 100))
</script>

<template>
  <div class="data-dashboard">
    <!-- 头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1>📊 数据仪表盘</h1>
        <p>实时数据监控面板</p>
      </div>
      <div class="header-right">
        <span class="live-indicator">🔴 LIVE</span>
        <span class="current-time">{{ currentTime }}</span>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ '--accent-color': stat.color }"
      >
        <div class="stat-icon">{{ stat.icon }}</div>
        <div class="stat-info">
          <div class="stat-value">{{ stat.value.toLocaleString() }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        <div class="stat-bar">
          <div
            class="stat-bar-fill"
            :style="{ width: `${(stat.value / stat.target) * 100}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <div class="chart-card">
        <h3>📈 今日趋势</h3>
        <div class="chart-container">
          <div class="chart-bars">
            <div
              v-for="(value, index) in chartData"
              :key="index"
              class="chart-bar"
              :style="{ height: `${(value / maxChartValue) * 100}%` }"
            >
              <span class="bar-tooltip">{{ value }}</span>
            </div>
          </div>
          <div class="chart-labels">
            <span v-for="i in 12" :key="i">{{ i + 8 }}:00</span>
          </div>
        </div>
      </div>

      <!-- 活动列表 -->
      <div class="activity-card">
        <h3>🕐 最近活动</h3>
        <div class="activity-list">
          <div
            v-for="(activity, index) in activities"
            :key="index"
            class="activity-item"
          >
            <span class="activity-time">{{ activity.time }}</span>
            <span class="activity-user">{{ activity.user }}</span>
            <span class="activity-action">{{ activity.action }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="dashboard-footer">
      <span>数据更新于: {{ currentTime }}</span>
      <button class="refresh-btn" @click="generateChartData">🔄 刷新数据</button>
    </div>
  </div>
</template>

<style scoped>
.data-dashboard {
  padding: 24px;
  min-height: 100%;
  background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.header-left h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
}

.header-left p {
  margin: 0;
  opacity: 0.7;
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.live-indicator {
  animation: pulse 2s infinite;
  font-size: 12px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.current-time {
  font-size: 20px;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent-color);
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 4px;
}

.stat-bar {
  margin-top: 12px;
  height: 4px;
  background: rgba(255,255,255,0.2);
  border-radius: 2px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: var(--accent-color);
  border-radius: 2px;
  transition: width 0.5s ease-out;
}

.chart-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card, .activity-card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
}

.chart-card h3, .activity-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.chart-container {
  height: 200px;
  display: flex;
  flex-direction: column;
}

.chart-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding-bottom: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.5s ease-out;
  cursor: pointer;
}

.chart-bar:hover {
  background: linear-gradient(to top, #2563eb, #3b82f6);
}

.bar-tooltip {
  position: absolute;
  top: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e3a5f;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  opacity: 0;
  transition: opacity 0.2s;
}

.chart-bar:hover .bar-tooltip {
  opacity: 1;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  opacity: 0.6;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background: rgba(255,255,255,0.05);
  border-radius: 8px;
  font-size: 13px;
}

.activity-time {
  color: #60a5fa;
  font-family: monospace;
  min-width: 50px;
}

.activity-user {
  color: #10b981;
  min-width: 50px;
}

.activity-action {
  opacity: 0.9;
  flex: 1;
}

.dashboard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 13px;
  opacity: 0.7;
}

.refresh-btn {
  background: rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.5);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: rgba(59, 130, 246, 0.5);
  transform: scale(1.05);
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-section {
    grid-template-columns: 1fr;
  }
}
</style>
