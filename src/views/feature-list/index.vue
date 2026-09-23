<script setup lang="ts">
import { usePermissionAdmin } from '@/composables/usePermissionAdmin';
defineOptions({ name: 'FeatureListPage' });
const {
  functions, loading, error, isModalOpen, isSaving, editingKvid,
  ordinaryRole, functionRoleDrafts, departments, functionDepartmentDrafts, expandedFunctionId, savingFunctionId,
  featureSearch, permissionLoading, permissionError, form, parametersText, renderTypeLabel, filteredFeatures,
  departmentTree, roleIdsForFunction, departmentIdsForFunction, functionHasChanges, toggleFunctionExpanded, toggleFunctionRole,
  toggleFunctionDepartment, saveFunctionAccess, openCreate, openEdit, closeModal, saveFunction,
  deleteFunction, toggleEnabled, refreshAll,
} = usePermissionAdmin('functions');
</script>

<template>
  <div class="feature-page space-y-5">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-slate-900 dark:text-white">功能列表</h1>
        <p class="mt-1 text-sm text-slate-500">设置普通用户和部门的功能访问权限</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-xs text-slate-500">{{ `${functions.length} 项功能` }}</span>
        <button class="secondary-button" :disabled="loading || permissionLoading" @click="refreshAll"><i class="fas fa-rotate-right" />刷新</button>
      </div>
    </header>
    <div v-if="error" class="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{{ error }}</div>
    <section class="admin-list-panel">
      <div class="admin-list-header">
        <div>
          <h2 class="font-bold text-slate-900 dark:text-white">功能列表</h2>
          <p class="mt-1 text-xs text-slate-500">普通用户须同时获得功能授权和部门授权；管理员可访问全部功能</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input v-model="featureSearch" type="search" placeholder="搜索功能" aria-label="搜索功能列表" class="form-input w-44 text-sm" />
          <button class="btn-primary rounded-lg px-4 py-2 text-sm font-semibold" @click="openCreate"><i class="fas fa-plus mr-1" />新增功能</button>
        </div>
      </div>
      <div v-if="permissionError" class="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600 dark:bg-red-900/20">{{ permissionError }}</div>
      <div v-if="loading || permissionLoading" class="p-12 text-center text-sm text-slate-500">加载中...</div>
      <div v-else-if="functions.length === 0 && !error" class="p-12 text-center text-sm text-slate-500">暂无功能，可从 UMD 模块管理导入或手动新增。</div>
      <div v-else-if="filteredFeatures.length === 0" class="p-12 text-center text-sm text-slate-500">没有匹配的功能。</div>
      <div v-else class="divide-y divide-slate-100 dark:divide-slate-700">
        <div v-for="item in filteredFeatures" :key="item.kvid">
          <div class="admin-list-row">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20"><i :class="item.icon || 'fas fa-puzzle-piece'" /></span>
            <div class="min-w-[180px] flex-1">
              <div class="truncate text-sm font-semibold text-slate-800 dark:text-white">{{ item.title || item.handler }}</div>
              <div class="truncate text-xs text-slate-500" :title="item.source_url || item.handler">{{ renderTypeLabel[item.render_type] }} · {{ item.source_component || item.handler }}</div>
            </div>
            <div class="flex min-w-[110px] items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <i class="fas fa-user-shield text-slate-400" />普通用户：{{ roleIdsForFunction(item.kvid).length ? '已授权' : '未授权' }}
            </div>
            <div class="flex min-w-[110px] items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
              <i class="fas fa-sitemap text-slate-400" />{{ departmentIdsForFunction(item.kvid).length }} 个部门
            </div>
            <div class="admin-list-actions">
              <button class="admin-list-action" :class="item.is_active ? 'admin-list-action-neutral' : 'admin-list-action-danger'" :aria-label="`${item.is_active ? '停用' : '启用'} ${item.title || item.handler}`" @click="toggleEnabled(item)"><i class="fas" :class="item.is_active ? 'fa-circle-check' : 'fa-circle-pause'" />{{ item.is_active ? '已启用' : '已停用' }}</button>
              <button class="admin-list-action admin-list-action-primary" :aria-expanded="expandedFunctionId === item.kvid" @click="toggleFunctionExpanded(item.kvid)"><i class="fas fa-shield-halved" />{{ expandedFunctionId === item.kvid ? '收起授权' : '设置授权' }}</button>
              <button class="admin-list-action admin-list-action-neutral" @click="openEdit(item)"><i class="fas fa-pen" />编辑</button>
              <button class="admin-list-action admin-list-action-danger" @click="deleteFunction(item)"><i class="fas fa-trash-can" />删除</button>
            </div>
          </div>
          <div v-if="expandedFunctionId === item.kvid" class="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900/30">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-slate-800 dark:text-white">{{ item.title || item.handler }} · 访问权限</p>
                <p class="mt-1 text-xs text-slate-500">普通用户需同时获得功能和部门授权；子部门继承上级授权，管理员始终可访问<span v-if="functionHasChanges(item.kvid)" class="ml-2 text-amber-600">· 待保存</span></p>
              </div>
              <button class="btn-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" :disabled="!ordinaryRole || !functionHasChanges(item.kvid) || savingFunctionId === item.kvid" @click="saveFunctionAccess(item.kvid)">{{ savingFunctionId === item.kvid ? '保存中...' : '保存授权' }}</button>
            </div>
            <h4 class="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">普通用户</h4>
            <p v-if="!ordinaryRole" class="mb-4 text-sm text-red-600">普通用户授权配置缺失，请先运行数据库迁移。</p>
            <label v-else class="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm" :class="(functionRoleDrafts[item.kvid] ?? roleIdsForFunction(item.kvid)).includes(ordinaryRole.kvid) ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800'">
              <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" :checked="(functionRoleDrafts[item.kvid] ?? roleIdsForFunction(item.kvid)).includes(ordinaryRole.kvid)" @change="toggleFunctionRole(item.kvid, ordinaryRole.kvid)" />允许普通用户访问
            </label>
            <h4 class="mb-2 text-xs font-bold text-slate-700 dark:text-slate-300">授权组织部门 · {{ (functionDepartmentDrafts[item.kvid] ?? departmentIdsForFunction(item.kvid)).length }} 个</h4>
            <p v-if="departments.length === 0" class="text-sm text-slate-500">暂无组织部门，请先到“组织机构”创建。</p>
            <div v-else class="flex flex-wrap gap-2">
              <label v-for="department in departmentTree" :key="department.id" class="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm" :class="(functionDepartmentDrafts[item.kvid] ?? departmentIdsForFunction(item.kvid)).includes(department.id) ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800'">
                <input type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" :checked="(functionDepartmentDrafts[item.kvid] ?? departmentIdsForFunction(item.kvid)).includes(department.id)" @change="toggleFunctionDepartment(item.kvid, department.id)" />{{ '— '.repeat(department.depth) }}{{ department.name }}<span v-if="!department.is_active" class="text-xs text-slate-400">（已停用）</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
        @click.self="closeModal"
      >
        <div
          class="animate-fade-in-up w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i class="fas fa-list-alt text-blue-600" />
              {{ editingKvid ? '编辑功能' : '新增功能' }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              @click="closeModal"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  功能名称 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="请输入功能名称"
                  class="w-full form-input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  图标
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="form.icon"
                    type="text"
                    placeholder="fas fa-star"
                    class="flex-1 form-input"
                  />
                  <div
                    class="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <i
                      :class="form.icon || 'fas fa-question'"
                      class="text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  渲染类型
                </label>
                <select
                  v-model="form.render_type"
                  class="w-full form-input"
                >
                  <option value="webview">WebView</option>
                  <option value="vue">Vue</option>
                  <option value="umd">UMD</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  来源类型
                </label>
                <select
                  v-model="form.source_type"
                  class="w-full form-input"
                >
                  <option value="manual">手工维护</option>
                  <option value="umd">UMD 导入</option>
                  <option value="system">系统功能</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  排序
                </label>
                <input
                  v-model.number="form.sort_order"
                  type="number"
                  min="0"
                  class="w-full form-input"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Handler <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.handler"
                type="text"
                placeholder="<MyUmdComponent> / /path/to/page.vue / https://example.com"
                class="w-full form-input font-mono"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  来源模块
                </label>
                <input
                  v-model="form.source_module"
                  type="text"
                  placeholder="如 gavinyin-hub-umd-standards"
                  class="w-full form-input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  组件名
                </label>
                <input
                  v-model="form.source_component"
                  type="text"
                  placeholder="如 SmartStandardLibrary"
                  class="w-full form-input font-mono"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                来源地址
              </label>
              <input
                v-model="form.source_url"
                type="text"
                placeholder="UMD 类型建议填写可访问脚本地址"
                class="w-full form-input font-mono"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                备注
              </label>
              <input
                v-model="form.remark"
                type="text"
                placeholder="补充说明或兼容旧字段"
                class="w-full form-input"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                扩展参数 (JSON)
              </label>
              <textarea
                v-model="parametersText"
                rows="5"
                spellcheck="false"
                class="w-full form-input font-mono text-xs resize-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                启用状态
              </label>
              <div
                class="flex items-center gap-3 cursor-pointer select-none"
                @click="form.is_active = !form.is_active"
              >
                <div
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="form.is_active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="form.is_active ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ form.is_active ? '已启用' : '已禁用' }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl"
          >
            <button
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              @click="closeModal"
            >
              取消
            </button>
            <button
              :disabled="!form.title.trim() || !form.handler.trim() || isSaving"
              class="btn-primary flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              @click="saveFunction"
            >
              <i
                class="fas fa-save"
                :class="{ 'animate-spin fa-spinner': isSaving }"
              />
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
          </div>
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
