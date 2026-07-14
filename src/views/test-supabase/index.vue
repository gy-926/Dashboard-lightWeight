<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCurrentUserRoles, type AuthRoleRecord } from '@/api/dashboard-admin'

// 定义数据类型
// 响应式状态
const roles = ref<AuthRoleRecord[]>([])
const loading = ref(true)
const errorMessage = ref('')

// 获取数据函数
const testEdgeApi = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    
    roles.value = await getCurrentUserRoles()
  } catch (error: any) {
    console.error('Error fetching users:', error)
    errorMessage.value = error.message || '连接 Edge API 失败'
  } finally {
    loading.value = false
  }
}

// 页面挂载时请求数据
onMounted(() => {
  testEdgeApi()
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
        @click="testEdgeApi"
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
      <p class="text-gray-500">正在验证 Supabase 登录和 dashboard-admin Edge API...</p>
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
              <li>dashboard-admin Edge Function 尚未部署</li>
              <li>当前登录状态已经过期</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="roles.length === 0" class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center">
      <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
      <p class="text-gray-500">连接成功，当前用户没有绑定数据库角色</p>
    </div>

    <!-- 数据展示 -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
              <th v-for="key in Object.keys(roles[0] || {})" :key="key" class="p-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ key }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(role, index) in roles" :key="index" class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td v-for="key in Object.keys(role)" :key="key" class="p-4 text-sm text-gray-700 dark:text-gray-300">
                <span>{{ role[key as keyof AuthRoleRecord] }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-4 bg-gray-50 dark:bg-gray-700/30 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 text-right">
        当前用户共 {{ roles.length }} 个数据库角色
      </div>
    </div>
  </div>
</template>
