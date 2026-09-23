<script setup lang="ts">
import { usePermissionAdmin } from '@/composables/usePermissionAdmin';
import OrganizationChart from './OrganizationChart.vue';
defineOptions({ name: 'OrganizationPage' });
const {
  departments, userDirectory, permissionLoading, permissionError, departmentForm,
  departmentSaving, departmentEditorOpen, addTarget, personnelTarget, personnelSearch, selectedPersonnelIds,
  personnelSaving, filteredAssignableUsers, availableParentDepartments, departmentName, newDepartment, editDepartment,
  openAddMenu, createChildFromMenu, openPersonnelPicker, togglePersonnel, savePersonnel, saveDepartment,
  removeDepartment, refreshAll,
} = usePermissionAdmin('departments');
</script>

<template>
  <div class="feature-page flex min-h-0 flex-1 flex-col gap-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">组织机构</h1>
        <p class="mt-1 text-sm text-slate-500">维护部门层级与人员归属</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500">{{ `${departments.length} 个组织部门` }}</span>
        <button class="secondary-button" :disabled="permissionLoading" @click="refreshAll"><i class="fas fa-rotate-right" />刷新</button>
      </div>
    </header>
    <div v-if="permissionError" class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{{ permissionError }}</div>
    <div v-if="permissionLoading" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">加载组织中...</div>
    <OrganizationChart
      v-if="!permissionLoading"
      class="min-h-0 flex-1"
      :departments="departments"
      :users="userDirectory"
      @create="newDepartment"
      @add="openAddMenu"
      @add-users="openPersonnelPicker"
      @edit="editDepartment"
      @remove="removeDepartment"
    />

    <Teleport to="body">
      <div v-if="addTarget" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4" @click.self="addTarget = null">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800" role="dialog" aria-modal="true" aria-labelledby="organization-add-title">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 id="organization-add-title" class="text-lg font-bold text-slate-900 dark:text-white">添加到 {{ addTarget.name }}</h3>
              <p class="mt-1 text-sm text-slate-500">选择要添加的内容</p>
            </div>
            <button class="text-slate-400 hover:text-slate-700" aria-label="关闭" @click="addTarget = null"><i class="fas fa-xmark" /></button>
          </div>
          <div class="mt-5 grid gap-3">
            <button class="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:hover:bg-blue-900/20" @click="createChildFromMenu">
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30"><i class="fas fa-sitemap" /></span>
              <span><strong class="block text-sm text-slate-800 dark:text-white">新建子部门</strong><small class="text-slate-500">在当前节点下创建部门</small></span>
            </button>
            <button class="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:hover:bg-indigo-900/20" @click="openPersonnelPicker(addTarget)">
              <span class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30"><i class="fas fa-user-plus" /></span>
              <span><strong class="block text-sm text-slate-800 dark:text-white">添加人员</strong><small class="text-slate-500">从用户列表选择已有用户</small></span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="personnelTarget" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4" @click.self="personnelTarget = null">
        <div class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800" role="dialog" aria-modal="true" aria-labelledby="personnel-picker-title">
          <div class="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <div>
              <h3 id="personnel-picker-title" class="text-lg font-bold text-slate-900 dark:text-white">添加人员到 {{ personnelTarget.name }}</h3>
              <p class="mt-1 text-xs text-slate-500">从用户列表选择；选择其他部门的用户会调整其所属部门。</p>
            </div>
            <button class="text-slate-400 hover:text-slate-700" aria-label="关闭" @click="personnelTarget = null"><i class="fas fa-xmark" /></button>
          </div>
          <div class="min-h-0 flex-1 px-6 py-4">
            <label class="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-400 dark:border-slate-600">
              <i class="fas fa-magnifying-glass" />
              <input v-model="personnelSearch" type="search" class="w-full bg-transparent text-sm text-slate-800 outline-none dark:text-white" placeholder="搜索姓名或邮箱" aria-label="搜索用户" />
            </label>
            <p class="mt-3 text-xs text-slate-500">已选择 {{ selectedPersonnelIds.length }} 人</p>
            <div class="mt-2 max-h-[45vh] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <p v-if="filteredAssignableUsers.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">没有匹配的可添加用户</p>
              <label v-for="user in filteredAssignableUsers" :key="user.user_id" class="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30">
                <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" :checked="selectedPersonnelIds.includes(user.user_id)" @change="togglePersonnel(user.user_id)" />
                <span class="min-w-0 flex-1">
                  <strong class="block truncate text-sm font-medium text-slate-800 dark:text-white">{{ user.name || user.email || user.user_id }}</strong>
                  <small class="block truncate text-slate-500">{{ user.email || user.user_id }}</small>
                </span>
                <span class="max-w-28 truncate text-xs text-slate-400">{{ departmentName(user.department_id) }}</span>
              </label>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
            <button class="secondary-button justify-center" @click="personnelTarget = null">取消</button>
            <button class="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50" :disabled="!selectedPersonnelIds.length || personnelSaving" @click="savePersonnel">{{ personnelSaving ? '保存中...' : `添加 ${selectedPersonnelIds.length} 人` }}</button>
          </div>
        </div>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="departmentEditorOpen" class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4" @click.self="departmentEditorOpen = false">
        <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-800" role="dialog" aria-modal="true" aria-labelledby="department-editor-title">
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
            <h3 id="department-editor-title" class="text-xl font-bold text-slate-900 dark:text-white">{{ departmentForm.id ? `编辑${departmentForm.kind === 'organization' ? '组织' : '部门'}` : departmentForm.parent_id ? '新建部门' : '新建顶层机构' }}</h3>
            <button class="text-xl text-slate-400 hover:text-slate-700" aria-label="关闭" @click="departmentEditorOpen = false"><i class="fas fa-xmark" /></button>
          </div>
          <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="saveDepartment">
            <div class="space-y-5 overflow-y-auto px-6 py-5">
              <div v-if="departmentForm.kind === 'organization'" class="grid gap-4 sm:grid-cols-2">
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">机构简称 <span class="text-red-500">*</span>
                  <input v-model="departmentForm.name" required maxlength="255" type="text" class="form-input mt-2 w-full" placeholder="例如：事业发展科" />
                </label>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">机构全称 <span class="text-red-500">*</span>
                  <input v-model="departmentForm.full_name" required maxlength="255" type="text" class="form-input mt-2 w-full" placeholder="例如：Kivii测试平台事业发展科" />
                </label>
              </div>
              <label v-else class="block text-sm font-semibold text-slate-700 dark:text-slate-200">部门名称 <span class="text-red-500">*</span>
                <input v-model="departmentForm.name" required maxlength="255" type="text" class="form-input mt-2 w-full" placeholder="例如：事业发展科" />
              </label>
              <label v-if="departmentForm.kind === 'organization'" class="block text-sm font-semibold text-slate-700 dark:text-slate-200">机构地址
                <input v-model="departmentForm.address" maxlength="500" type="text" class="form-input mt-2 w-full" placeholder="可选" />
              </label>
              <div v-if="departmentForm.kind === 'department'" class="grid gap-4 sm:grid-cols-2">
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">部门负责人
                  <select v-model="departmentForm.manager_user_id" class="form-input mt-2 w-full">
                    <option :value="null">未指定负责人</option>
                    <option v-for="user in userDirectory" :key="user.user_id" :value="user.user_id">{{ user.name ? `${user.name} · ${user.email || user.user_id}` : user.email || user.user_id }}</option>
                  </select>
                </label>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">部门楼层
                  <input v-model="departmentForm.floor" maxlength="100" type="text" class="form-input mt-2 w-full" placeholder="例如：3 楼" />
                </label>
              </div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">内部编码
                <input v-model="departmentForm.internal_code" maxlength="100" pattern="[A-Za-z0-9][A-Za-z0-9._-]*" type="text" class="form-input mt-2 w-full" placeholder="可选，填写后必须唯一" />
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-200">上级机构
                  <select v-if="departmentForm.kind === 'department' && departmentForm.id" v-model="departmentForm.parent_id" class="form-input mt-2 w-full">
                    <option v-for="department in availableParentDepartments" :key="department.id" :value="department.id">{{ '— '.repeat(department.depth) }}{{ department.name }}</option>
                  </select>
                  <input v-else :value="departmentForm.parent_id ? departmentName(departmentForm.parent_id) : '顶层机构'" class="form-input mt-2 w-full" disabled />
                </label>
                <label class="flex items-end gap-2 pb-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><input v-model="departmentForm.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />启用机构</label>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
              <button type="button" class="secondary-button justify-center" @click="departmentEditorOpen = false">取消</button>
              <button type="submit" class="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50" :disabled="departmentSaving">{{ departmentSaving ? '保存中...' : '保存' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
  .form-input {
    @apply rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white;
  }

  .secondary-button {
    @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white;
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.25s ease-out forwards;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>
