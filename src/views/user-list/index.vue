<script setup lang="ts">
import { usePermissionAdmin } from '@/composables/usePermissionAdmin';
defineOptions({ name: 'UserListPage' });
const {
  userDirectory, userSearch, permissionLoading, permissionError, savingUserId,
  assigningUserId, filteredUsers, departmentTree, setUserAppRole, setUserDepartment,
  refreshAll,
} = usePermissionAdmin('users');
</script>

<template>
  <div class="feature-page space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">用户列表</h1>
        <p class="mt-1 text-sm text-slate-500">设置普通用户或管理员，并分配所属部门</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500">{{ `${userDirectory.length} 位用户` }}</span>
        <button class="secondary-button" :disabled="permissionLoading" @click="refreshAll"><i class="fas fa-rotate-right" />刷新</button>
      </div>
    </header>
    <section class="admin-list-panel">
      <div class="admin-list-header">
        <div>
          <h2 class="font-bold text-slate-900 dark:text-white">用户列表</h2>
          <p class="mt-1 text-xs text-slate-500">管理员可管理系统功能；普通用户按功能与部门授权访问</p>
        </div>
        <input v-model="userSearch" type="search" placeholder="搜索用户邮箱" aria-label="搜索用户" class="form-input w-56 text-sm" />
      </div>
      <div v-if="permissionError" class="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600 dark:bg-red-900/20">{{ permissionError }}</div>
      <div v-if="permissionLoading" class="p-12 text-center text-sm text-slate-500">加载用户中...</div>
      <div v-else-if="userDirectory.length === 0" class="p-12 text-center text-sm text-slate-500">暂无用户。</div>
      <div v-else-if="filteredUsers.length === 0" class="p-12 text-center text-sm text-slate-500">没有匹配的用户。</div>
      <div v-else class="divide-y divide-slate-100 dark:divide-slate-700">
        <div v-for="user in filteredUsers" :key="user.user_id">
          <div class="admin-list-row">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-700"><i class="fas fa-user" /></span>
            <div class="min-w-[180px] flex-1">
              <div class="truncate text-sm font-semibold text-slate-800 dark:text-white">{{ user.email || user.user_id }}</div>
              <div class="text-xs text-slate-500">{{ user.name || user.user_id }}</div>
            </div>
            <div class="admin-list-actions">
              <label class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">所属部门
                <select class="admin-list-select w-48" :value="user.department_id ?? ''" :disabled="assigningUserId === user.user_id" :aria-label="`设置 ${user.email || user.user_id} 的部门`" @change="setUserDepartment(user, $event)">
                  <option value="">未分配部门</option>
                  <option v-for="department in departmentTree" :key="department.id" :value="department.id">{{ '— '.repeat(department.depth) }}{{ department.name }}</option>
                </select>
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">账号权限
                <select class="admin-list-select w-32" :value="user.app_role === 'admin' ? 'super_admin' : 'user'" :disabled="savingUserId === user.user_id" :aria-label="`设置 ${user.email || user.user_id} 的权限`" @change="setUserAppRole(user, $event)">
                  <option value="user">普通用户</option>
                  <option value="super_admin">管理员</option>
                </select>
              </label>
              <span v-if="savingUserId === user.user_id" class="text-xs text-slate-500">保存中...</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
  .secondary-button {
    @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white;
  }

</style>
