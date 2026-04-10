<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

// 定义数据类型
interface User {
  id: string | number
  [key: string]: any
}

// 响应式状态
const users = ref<User[]>([])
const loading = ref(true)
const errorMessage = ref('')

// 获取数据函数
const fetchUsers = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    // 查询 users 表的所有数据
    const { data, error } = await supabase.from('users').select('*').limit(10)
    
    if (error) {
      throw error
    }
    
    users.value = data || []
  } catch (error: any) {
    console.error('Error fetching users:', error)
    errorMessage.value = error.message || '获取数据失败，请检查数据库配置和表是否存在'
  } finally {
    loading.value = false
  }
}

// 页面挂载时请求数据
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
        <i class="fas fa-database text-green-500"></i>
        Supabase 连接测试
      </h1>
      <button 
        @click="fetchUsers" 
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        :disabled="loading"
      >
        <i class="fas fa-sync-alt" :class="{ 'animate-spin': loading }"></i>
        刷新数据
      </button>
    </div>

    <!-- 状态展示 -->
    <div v-if="loading" class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
      <p class="text-gray-500">正在连接 Supabase 并获取 users 表数据...</p>
    </div>

    <div v-else-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-600 dark:text-red-400">
      <div class="flex items-start gap-3">
        <i class="fas fa-exclamation-circle text-xl mt-0.5"></i>
        <div>
          <h3 class="font-bold mb-1">连接或查询失败</h3>
          <p class="text-sm">{{ errorMessage }}</p>
          <div class="mt-4 text-sm opacity-80 space-y-1">
            <p>可能的原因：</p>
            <ul class="list-disc pl-5">
              <li>.env 中的 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 不正确</li>
              <li>数据库中不存在 <code>users</code> 表</li>
              <li>Row Level Security (RLS) 策略阻止了匿名访问（请在 Supabase 控制台检查该表的 RLS 设置）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="users.length === 0" class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center">
      <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">连接成功，但 <code>users</code> 表中暂无数据</p>
    </div>

    <!-- 数据展示 -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th v-for="key in Object.keys(users[0] || {})" :key="key" class="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="index" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td v-for="key in Object.keys(user)" :key="key" class="p-4 text-sm text-gray-700 dark:text-gray-300">
                <span v-if="typeof user[key] === 'object'" class="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded">
                  {{ JSON.stringify(user[key]).substring(0, 30) }}{{ JSON.stringify(user[key]).length > 30 ? '...' : '' }}
                </span>
                <span v-else>
                  {{ user[key] }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-gray-700/30 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 text-right">
        显示最新 {{ users.length }} 条记录
      </div>
    </div>
  </div>
</template>
