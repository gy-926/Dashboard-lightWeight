<script setup lang="ts">
import { ref } from 'vue'

// 组件内部状态
const count = ref(0)
const message = ref('欢迎使用远程 Vue 组件！')

// 方法
function increment() {
  count.value++
}

function decrement() {
  count.value--
}

function reset() {
  count.value = 0
}
</script>

<template>
  <div class="remote-vue-component">
    <div class="component-header">
      <h2>🧩 远程 Vue 组件测试</h2>
      <p>这是一个从远程加载的 Vue 3 组件</p>
    </div>

    <div class="component-content">
      <!-- 消息显示 -->
      <div class="message-box">
        <p>{{ message }}</p>
      </div>

      <!-- 计数器示例 -->
      <div class="counter-section">
        <h3>计数器示例</h3>
        <div class="counter-display">
          <span class="count">{{ count }}</span>
        </div>
        <div class="counter-controls">
          <button @click="decrement" class="btn btn-danger">- 减少</button>
          <button @click="reset" class="btn btn-secondary">重置</button>
          <button @click="increment" class="btn btn-primary">+ 增加</button>
        </div>
      </div>

      <!-- 功能演示区 -->
      <div class="feature-section">
        <h3>组件功能演示</h3>
        <ul class="feature-list">
          <li>✅ 远程组件动态加载</li>
          <li>✅ Vue 3 Composition API</li>
          <li>✅ 响应式状态管理</li>
          <li>✅ 事件处理</li>
        </ul>
      </div>

      <!-- 数据展示 -->
      <div class="data-section">
        <h3>实时数据</h3>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">当前计数：</span>
            <span class="value">{{ count }}</span>
          </div>
          <div class="data-item">
            <span class="label">消息长度：</span>
            <span class="value">{{ message.length }}</span>
          </div>
          <div class="data-item">
            <span class="label">时间戳：</span>
            <span class="value">{{ Date.now() }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="component-footer">
      <p>组件加载时间: {{ new Date().toLocaleTimeString() }}</p>
    </div>
  </div>
</template>

<style scoped>
.remote-vue-component {
  padding: 24px;
  min-height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.component-header {
  text-align: center;
  margin-bottom: 32px;
}

.component-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.component-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.component-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  color: #333;
}

.component-content h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.message-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 24px;
}

.message-box p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.counter-section {
  margin-bottom: 24px;
}

.counter-display {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  margin-bottom: 16px;
}

.count {
  font-size: 64px;
  font-weight: bold;
  color: #667eea;
  text-shadow: 2px 2px 4px rgba(102, 126, 234, 0.3);
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.feature-section {
  margin-bottom: 24px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  padding: 8px 0;
  font-size: 14px;
  color: #495057;
}

.data-section {
  margin-bottom: 16px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.data-item {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.data-item .label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 4px;
}

.data-item .value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
}

.component-footer {
  margin-top: 24px;
  text-align: center;
  opacity: 0.8;
  font-size: 12px;
}
</style>
