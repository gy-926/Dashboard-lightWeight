<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import {
    deleteDashboardFunction,
    listDashboardFunctions,
    saveDashboardFunction,
    updateDashboardFunction,
    type DashboardFunctionRecord,
  } from '@/api/dashboard-functions';
  import {
    deleteRoleRecord,
    getPermissionConfig,
    replaceRoleFunctions,
    replaceUserRoles,
    saveRole as saveRoleRecord,
  } from '@/api/dashboard-admin';

  defineOptions({ name: 'FeatureListPage' });

  type RenderType = 'webview' | 'vue' | 'umd';
  type SourceType = 'manual' | 'umd' | 'system';
  type TabKey = 'functions' | 'roles' | 'users';

  type FunctionItem = DashboardFunctionRecord;

  interface FunctionForm {
    title: string;
    handler: string;
    remark: string;
    parameters: Record<string, any>;
    render_type: RenderType;
    source_type: SourceType;
    source_module: string;
    source_url: string;
    source_component: string;
    icon: string;
    sort_order: number;
    is_active: boolean;
  }

  interface RoleItem {
    kvid: string;
    code: string;
    name: string;
    remark: string | null;
    is_active: boolean;
  }

  interface RoleForm {
    code: string;
    name: string;
    remark: string;
    is_active: boolean;
  }

  interface RoleFunctionRow {
    role_kvid: string;
    function_kvid: string;
  }

  interface UserRoleRow {
    user_id: string;
    role_kvid: string;
  }

  interface UserDirectoryRow {
    user_id: string;
    email: string | null;
    app_role: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  }

  const activeTab = ref<TabKey>('functions');

  const functions = ref<FunctionItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isModalOpen = ref(false);
  const isSaving = ref(false);
  const editingKvid = ref<string | null>(null);

  const roles = ref<RoleItem[]>([]);
  const selectedRoleKvid = ref<string>('');
  const roleFunctionMap = ref<Record<string, string[]>>({});
  const userRoleMap = ref<Record<string, string[]>>({});
  const userDirectory = ref<UserDirectoryRow[]>([]);
  const permissionLoading = ref(false);
  const permissionError = ref<string | null>(null);
  const userDirectoryHint = ref<string | null>(null);
  const roleFunctionsSaving = ref(false);
  const savingUserId = ref<string | null>(null);

  const isRoleModalOpen = ref(false);
  const isRoleSaving = ref(false);
  const editingRoleKvid = ref<string | null>(null);

  const emptyForm = (): FunctionForm => ({
    title: '',
    handler: '',
    remark: '',
    parameters: {},
    render_type: 'webview',
    source_type: 'manual',
    source_module: '',
    source_url: '',
    source_component: '',
    icon: '',
    sort_order: 0,
    is_active: true,
  });

  const emptyRoleForm = (): RoleForm => ({
    code: '',
    name: '',
    remark: '',
    is_active: true,
  });

  const form = ref<FunctionForm>(emptyForm());
  const roleForm = ref<RoleForm>(emptyRoleForm());

  const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
    { key: 'functions', label: '功能中心', icon: 'fas fa-puzzle-piece' },
    { key: 'roles', label: '角色功能授权', icon: 'fas fa-user-shield' },
    { key: 'users', label: '用户角色绑定', icon: 'fas fa-users-cog' },
  ];

  const parametersText = computed({
    get: () => {
      try {
        return JSON.stringify(form.value.parameters ?? {}, null, 2);
      } catch {
        return '{}';
      }
    },
    set: value => {
      try {
        form.value.parameters = JSON.parse(value || '{}');
      } catch {
        // ignore invalid json while typing
      }
    },
  });

  const renderTypeLabel: Record<RenderType, string> = {
    webview: 'WebView',
    vue: 'Vue',
    umd: 'UMD',
  };

  const renderTypeCls: Record<RenderType, string> = {
    webview: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    vue: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    umd: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const currentRole = computed(
    () => roles.value.find(item => item.kvid === selectedRoleKvid.value) ?? null
  );

  const currentRoleFunctionIds = computed(() =>
    currentRole.value ? (roleFunctionMap.value[currentRole.value.kvid] ?? []) : []
  );

  function generateId(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('zh-CN');
  }

  function roleBadgeClass(code: string): string {
    if (code === 'admin') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    if (code === 'demo')
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }

  function roleNameById(roleKvid: string): string {
    const role = roles.value.find(item => item.kvid === roleKvid);
    return role ? role.name : roleKvid;
  }

  async function loadFunctions() {
    loading.value = true;
    error.value = null;
    try {
      functions.value = await listDashboardFunctions();
    } catch (err: any) {
      error.value = err?.message ?? '加载功能列表失败';
    } finally {
      loading.value = false;
    }
  }

  function buildRoleFunctionMap(data: RoleFunctionRow[]) {
    const nextMap: Record<string, string[]> = {};
    data.forEach(item => {
      if (!nextMap[item.role_kvid]) {
        nextMap[item.role_kvid] = [];
      }
      nextMap[item.role_kvid].push(item.function_kvid);
    });

    roleFunctionMap.value = nextMap;
  }

  function buildUserRoleMap(data: UserRoleRow[]) {
    const nextMap: Record<string, string[]> = {};
    data.forEach(item => {
      if (!nextMap[item.user_id]) {
        nextMap[item.user_id] = [];
      }
      nextMap[item.user_id].push(item.role_kvid);
    });

    userRoleMap.value = nextMap;
  }

  async function loadPermissionData() {
    permissionLoading.value = true;
    permissionError.value = null;
    userDirectoryHint.value = null;
    try {
      const data = await getPermissionConfig();
      roles.value = data.roles as RoleItem[];
      buildRoleFunctionMap(data.roleFunctions as RoleFunctionRow[]);
      buildUserRoleMap(data.userRoles as UserRoleRow[]);
      userDirectory.value = (data.users as UserDirectoryRow[]).sort((a, b) =>
        String(a.email ?? '').localeCompare(String(b.email ?? ''))
      );
      if (!roles.value.some(item => item.kvid === selectedRoleKvid.value)) {
        selectedRoleKvid.value = roles.value[0]?.kvid ?? '';
      }
    } catch (err: any) {
      permissionError.value = err?.message ?? '加载权限配置失败';
    } finally {
      permissionLoading.value = false;
    }
  }

  function openCreate() {
    editingKvid.value = null;
    form.value = emptyForm();
    isModalOpen.value = true;
  }

  function openEdit(item: FunctionItem) {
    editingKvid.value = item.kvid;
    form.value = {
      title: item.title ?? '',
      handler: item.handler,
      remark: item.remark ?? '',
      parameters: item.parameters ?? {},
      render_type: item.render_type,
      source_type: item.source_type,
      source_module: item.source_module ?? '',
      source_url: item.source_url ?? '',
      source_component: item.source_component ?? '',
      icon: item.icon ?? '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active,
    };
    isModalOpen.value = true;
  }

  function closeModal() {
    isModalOpen.value = false;
  }

  async function saveFunction() {
    if (!form.value.title?.trim() || !form.value.handler?.trim()) return;
    isSaving.value = true;
    const payload: FunctionItem = {
      kvid: editingKvid.value || generateId(),
      title: form.value.title.trim(),
      handler: form.value.handler.trim(),
      remark: form.value.remark?.trim() || null,
      parameters: form.value.parameters ?? {},
      render_type: form.value.render_type,
      source_type: form.value.source_type,
      source_module: form.value.source_module?.trim() || null,
      source_url: form.value.source_url?.trim() || null,
      source_component: form.value.source_component?.trim() || null,
      icon: form.value.icon?.trim() || null,
      sort_order: form.value.sort_order ?? 0,
      is_active: form.value.is_active,
    };

    try {
      await saveDashboardFunction(payload);
    } catch (err: any) {
      alert('保存失败：' + (err?.message ?? '未知错误'));
      isSaving.value = false;
      return;
    }
    isSaving.value = false;
    closeModal();
    await Promise.all([loadFunctions(), loadPermissionData()]);
  }

  async function deleteFunction(item: FunctionItem) {
    if (!confirm(`确认删除「${item.title || item.handler}」？`)) return;
    try {
      await deleteDashboardFunction(item.kvid);
    } catch (err: any) {
      alert('删除失败：' + (err?.message ?? '未知错误'));
      return;
    }
    await Promise.all([loadFunctions(), loadPermissionData()]);
  }

  async function toggleEnabled(item: FunctionItem) {
    try {
      await updateDashboardFunction(item.kvid, { is_active: !item.is_active });
    } catch (err: any) {
      alert('更新状态失败：' + (err?.message ?? '未知错误'));
      return;
    }
    await loadFunctions();
  }

  function openCreateRole() {
    editingRoleKvid.value = null;
    roleForm.value = emptyRoleForm();
    isRoleModalOpen.value = true;
  }

  function openEditRole(role: RoleItem) {
    editingRoleKvid.value = role.kvid;
    roleForm.value = {
      code: role.code,
      name: role.name,
      remark: role.remark ?? '',
      is_active: role.is_active,
    };
    isRoleModalOpen.value = true;
  }

  function closeRoleModal() {
    isRoleModalOpen.value = false;
  }

  async function saveRole() {
    if (!roleForm.value.code.trim() || !roleForm.value.name.trim()) return;
    isRoleSaving.value = true;
    const payload = {
      kvid: editingRoleKvid.value || generateId(),
      code: roleForm.value.code.trim(),
      name: roleForm.value.name.trim(),
      remark: roleForm.value.remark.trim() || null,
      is_active: roleForm.value.is_active,
    };
    try {
      await saveRoleRecord(payload);
    } catch (err: any) {
      alert('保存角色失败：' + (err?.message ?? '未知错误'));
      isRoleSaving.value = false;
      return;
    }
    isRoleSaving.value = false;
    closeRoleModal();
    await loadPermissionData();
    selectedRoleKvid.value = payload.kvid;
  }

  async function deleteRole(role: RoleItem) {
    if (role.code === 'admin') {
      alert('内置管理员角色不建议删除。');
      return;
    }
    if (!confirm(`确认删除角色「${role.name}」？这会同时移除其用户绑定和功能授权。`)) return;
    try {
      await deleteRoleRecord(role.kvid);
    } catch (err: any) {
      alert('删除角色失败：' + (err?.message ?? '未知错误'));
      return;
    }
    await loadPermissionData();
  }

  function isFunctionChecked(functionKvid: string): boolean {
    return currentRoleFunctionIds.value.includes(functionKvid);
  }

  function toggleRoleFunction(functionKvid: string) {
    if (!currentRole.value) return;
    const current = new Set(roleFunctionMap.value[currentRole.value.kvid] ?? []);
    if (current.has(functionKvid)) {
      current.delete(functionKvid);
    } else {
      current.add(functionKvid);
    }
    roleFunctionMap.value = {
      ...roleFunctionMap.value,
      [currentRole.value.kvid]: Array.from(current),
    };
  }

  async function saveRoleFunctions() {
    if (!currentRole.value) return;
    roleFunctionsSaving.value = true;
    const roleKvid = currentRole.value.kvid;
    const selectedFunctionIds = Array.from(new Set(roleFunctionMap.value[roleKvid] ?? []));

    try {
      await replaceRoleFunctions(roleKvid, selectedFunctionIds);
    } catch (err: any) {
      alert('保存角色授权失败：' + (err?.message ?? '未知错误'));
      roleFunctionsSaving.value = false;
      return;
    }
    roleFunctionsSaving.value = false;
    await loadPermissionData();
  }

  function toggleUserRole(userId: string, roleKvid: string) {
    const current = new Set(userRoleMap.value[userId] ?? []);
    if (current.has(roleKvid)) {
      current.delete(roleKvid);
    } else {
      current.add(roleKvid);
    }
    userRoleMap.value = {
      ...userRoleMap.value,
      [userId]: Array.from(current),
    };
  }

  async function saveUserRoles(user: UserDirectoryRow) {
    savingUserId.value = user.user_id;
    const selectedRoleIds = Array.from(new Set(userRoleMap.value[user.user_id] ?? []));

    try {
      await replaceUserRoles(user.user_id, selectedRoleIds);
    } catch (err: any) {
      alert('保存用户角色失败：' + (err?.message ?? '未知错误'));
      savingUserId.value = null;
      return;
    }
    savingUserId.value = null;
    await loadPermissionData();
  }

  onMounted(async () => {
    await Promise.all([loadFunctions(), loadPermissionData()]);
  });
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 dark:text-white">功能与权限中心</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          统一维护功能定义、角色功能授权和用户角色绑定
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          功能 {{ functions.length }} 项
        </span>
        <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          角色 {{ roles.length }} 项
        </span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="
          activeTab === tab.key
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
        "
        @click="activeTab = tab.key"
      >
        <i :class="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3"
    >
      <i class="fas fa-exclamation-triangle" />
      {{ error }}
    </div>

    <section
      v-if="activeTab === 'functions'"
      class="space-y-4"
    >
      <div class="flex items-center justify-end">
        <button
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          @click="openCreate"
        >
          <i class="fas fa-plus" />
          新增功能
        </button>
      </div>

      <div
        v-if="loading"
        class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-400"
      >
        <i class="fas fa-spinner fa-spin text-3xl mb-3" />
        <p class="text-sm">加载中...</p>
      </div>

      <div
        v-else-if="functions.length === 0 && !error"
        class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-500"
      >
        <i class="fas fa-inbox text-4xl mb-4 text-gray-300" />
        <p>暂无功能记录</p>
        <p class="text-sm text-gray-400 mt-1">可从 UMD 模块管理导入，也可手动新建</p>
      </div>

      <div
        v-else
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
            >
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                功能
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                类型
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                组件/入口
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                来源地址
              </th>
              <th
                class="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                排序
              </th>
              <th
                class="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                启用
              </th>
              <th
                class="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="item in functions"
              :key="item.kvid"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :class="
                      item.icon ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'
                    "
                  >
                    <i
                      :class="item.icon || 'fas fa-puzzle-piece'"
                      class="text-sm"
                      :style="{ color: item.icon ? '' : '#9ca3af' }"
                    />
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium text-gray-800 dark:text-white truncate">
                      {{ item.title || item.handler }}
                    </div>
                    <div class="text-xs text-gray-400 font-mono truncate">{{ item.kvid }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="text-xs px-2 py-1 rounded font-medium"
                  :class="renderTypeCls[item.render_type]"
                >
                  {{ renderTypeLabel[item.render_type] }}
                </span>
              </td>
              <td
                class="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-[220px] truncate"
                :title="item.source_component || item.handler"
              >
                {{ item.source_component || item.handler }}
              </td>
              <td
                class="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-[220px] truncate"
                :title="item.source_url || item.remark || ''"
              >
                {{ item.source_url || item.remark || '—' }}
              </td>
              <td class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                {{ item.sort_order }}
              </td>
              <td class="px-6 py-4 text-center">
                <div
                  class="relative w-11 h-6 rounded-full transition-colors cursor-pointer inline-flex"
                  :class="item.is_active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  @click="toggleEnabled(item)"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="item.is_active ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    class="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    @click="openEdit(item)"
                  >
                    <i class="fas fa-pencil-alt mr-1" />编辑
                  </button>
                  <button
                    class="px-3 py-1.5 text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    @click="deleteFunction(item)"
                  >
                    <i class="fas fa-trash-alt mr-1" />删除
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section
      v-else-if="activeTab === 'roles'"
      class="space-y-4"
    >
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          通过角色统一维护功能访问范围，菜单会按角色可访问的 `function_kvid` 自动过滤。
        </div>
        <div class="flex items-center gap-2">
          <button
            class="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="loadPermissionData"
          >
            <i class="fas fa-rotate-right mr-1" />刷新
          </button>
          <button
            class="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            @click="openCreateRole"
          >
            <i class="fas fa-plus mr-1" />新增角色
          </button>
        </div>
      </div>

      <div
        v-if="permissionError"
        class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3"
      >
        <i class="fas fa-exclamation-triangle" />
        {{ permissionError }}
      </div>

      <div
        v-if="permissionLoading"
        class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-400"
      >
        <i class="fas fa-spinner fa-spin text-3xl mb-3" />
        <p class="text-sm">加载权限配置中...</p>
      </div>

      <div
        v-else
        class="grid grid-cols-[320px,1fr] gap-4"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="font-semibold text-gray-800 dark:text-white">角色列表</h3>
          </div>
          <div
            v-if="roles.length === 0"
            class="p-6 text-sm text-gray-500 dark:text-gray-400"
          >
            暂无角色，请先新增角色。
          </div>
          <div
            v-else
            class="divide-y divide-gray-100 dark:divide-gray-700"
          >
            <button
              v-for="role in roles"
              :key="role.kvid"
              class="w-full text-left px-5 py-4 transition-colors"
              :class="
                selectedRoleKvid === role.kvid
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              "
              @click="selectedRoleKvid = role.kvid"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-800 dark:text-white">{{ role.name }}</span>
                    <span
                      class="text-[11px] px-2 py-0.5 rounded-full"
                      :class="roleBadgeClass(role.code)"
                    >
                      {{ role.code }}
                    </span>
                  </div>
                  <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ role.remark || '暂无说明' }}
                  </div>
                </div>
                <span
                  class="text-xs"
                  :class="role.is_active ? 'text-emerald-500' : 'text-slate-400'"
                >
                  {{ role.is_active ? '启用' : '禁用' }}
                </span>
              </div>
              <div class="mt-3 flex items-center gap-2">
                <button
                  class="px-2.5 py-1 text-xs rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                  @click.stop="openEditRole(role)"
                >
                  编辑
                </button>
                <button
                  class="px-2.5 py-1 text-xs rounded-md text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  @click.stop="deleteRole(role)"
                >
                  删除
                </button>
              </div>
            </button>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div
            class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between"
          >
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-white">
                {{ currentRole ? `角色授权：${currentRole.name}` : '角色功能授权' }}
              </h3>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{
                  currentRole?.code === 'admin'
                    ? 'admin 角色默认拥有全部功能访问权限，此处授权清单主要作为配置参考。'
                    : '勾选角色可访问的功能，保存后会影响菜单显示与页面访问范围。'
                }}
              </p>
            </div>
            <button
              :disabled="!currentRole || roleFunctionsSaving"
              class="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="saveRoleFunctions"
            >
              <i
                class="fas mr-1"
                :class="roleFunctionsSaving ? 'fa-spinner animate-spin' : 'fa-save'"
              />
              {{ roleFunctionsSaving ? '保存中...' : '保存授权' }}
            </button>
          </div>

          <div
            v-if="!currentRole"
            class="p-8 text-sm text-gray-500 dark:text-gray-400"
          >
            请先从左侧选择角色。
          </div>
          <div
            v-else-if="functions.length === 0"
            class="p-8 text-sm text-gray-500 dark:text-gray-400"
          >
            当前没有功能数据，无法进行授权。
          </div>
          <table
            v-else
            class="w-full text-sm"
          >
            <thead>
              <tr
                class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              >
                <th
                  class="w-16 text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  授权
                </th>
                <th
                  class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  功能
                </th>
                <th
                  class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  类型
                </th>
                <th
                  class="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  组件/入口
                </th>
                <th
                  class="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  状态
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr
                v-for="item in functions"
                :key="`${currentRole.kvid}-${item.kvid}`"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    :checked="isFunctionChecked(item.kvid)"
                    @change="toggleRoleFunction(item.kvid)"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-800 dark:text-white">
                    {{ item.title || item.handler }}
                  </div>
                  <div class="text-xs text-gray-400 font-mono">{{ item.kvid }}</div>
                </td>
                <td class="px-4 py-3">
                  <span
                    class="text-xs px-2 py-1 rounded font-medium"
                    :class="renderTypeCls[item.render_type]"
                  >
                    {{ renderTypeLabel[item.render_type] }}
                  </span>
                </td>
                <td
                  class="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 max-w-[260px] truncate"
                >
                  {{ item.source_component || item.handler }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span :class="item.is_active ? 'text-emerald-500' : 'text-slate-400'">
                    {{ item.is_active ? '启用' : '禁用' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section
      v-else
      class="space-y-4"
    >
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          为登录用户绑定角色，用户会继承对应角色的功能访问权限。
        </div>
        <button
          class="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="loadPermissionData"
        >
          <i class="fas fa-rotate-right mr-1" />刷新
        </button>
      </div>

      <div
        v-if="userDirectoryHint"
        class="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50"
      >
        <div class="font-medium">缺少用户目录 RPC</div>
        <div class="mt-1 text-sm">{{ userDirectoryHint }}</div>
      </div>

      <div
        v-if="permissionError"
        class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3"
      >
        <i class="fas fa-exclamation-triangle" />
        {{ permissionError }}
      </div>

      <div
        v-if="permissionLoading"
        class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-400"
      >
        <i class="fas fa-spinner fa-spin text-3xl mb-3" />
        <p class="text-sm">加载用户角色配置中...</p>
      </div>

      <div
        v-else-if="userDirectory.length === 0"
        class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-500"
      >
        <i class="fas fa-user-slash text-4xl mb-4 text-gray-300" />
        <p>暂无可分配角色的用户数据</p>
      </div>

      <div
        v-else
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
            >
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                用户
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                系统角色
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                绑定角色
              </th>
              <th
                class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                最近登录
              </th>
              <th
                class="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr
              v-for="user in userDirectory"
              :key="user.user_id"
              class="align-top"
            >
              <td class="px-6 py-4">
                <div class="font-medium text-gray-800 dark:text-white">
                  {{ user.email || user.user_id }}
                </div>
                <div class="text-xs text-gray-400 font-mono">{{ user.user_id }}</div>
                <div class="mt-1 text-xs text-gray-400">
                  创建于 {{ formatDateTime(user.created_at) }}
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  v-if="user.app_role"
                  class="text-xs px-2 py-1 rounded-full"
                  :class="roleBadgeClass(user.app_role)"
                >
                  {{ user.app_role }}
                </span>
                <span
                  v-else
                  class="text-xs text-gray-400"
                  >未设置</span
                >
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-2 max-w-[420px]">
                  <label
                    v-for="role in roles"
                    :key="`${user.user_id}-${role.kvid}`"
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      :checked="(userRoleMap[user.user_id] ?? []).includes(role.kvid)"
                      @change="toggleUserRole(user.user_id, role.kvid)"
                    />
                    <span class="text-xs text-gray-700 dark:text-gray-300">{{ role.name }}</span>
                  </label>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                {{ formatDateTime(user.last_sign_in_at) }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="space-y-2">
                  <button
                    class="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="savingUserId === user.user_id"
                    @click="saveUserRoles(user)"
                  >
                    <i
                      class="fas mr-1"
                      :class="savingUserId === user.user_id ? 'fa-spinner animate-spin' : 'fa-save'"
                    />
                    {{ savingUserId === user.user_id ? '保存中...' : '保存角色' }}
                  </button>
                  <div class="text-xs text-gray-400">
                    当前绑定：{{
                      (userRoleMap[user.user_id] ?? []).map(roleNameById).join('、') || '无'
                    }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 animate-fade-in-up"
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
            <div class="grid grid-cols-2 gap-4">
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

            <div class="grid grid-cols-3 gap-4">
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

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  来源模块
                </label>
                <input
                  v-model="form.source_module"
                  type="text"
                  placeholder="如 kivii-dashboard-umd-standards"
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
              class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

    <Teleport to="body">
      <div
        v-if="isRoleModalOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="closeRoleModal"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl mx-4 animate-fade-in-up"
        >
          <div
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700"
          >
            <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i class="fas fa-user-shield text-blue-600" />
              {{ editingRoleKvid ? '编辑角色' : '新增角色' }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              @click="closeRoleModal"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <div class="px-6 py-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  角色编码 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="roleForm.code"
                  type="text"
                  placeholder="如 admin / demo"
                  class="w-full form-input"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  角色名称 <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="roleForm.name"
                  type="text"
                  placeholder="请输入角色名称"
                  class="w-full form-input"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >角色说明</label
              >
              <textarea
                v-model="roleForm.remark"
                rows="3"
                placeholder="描述该角色的使用范围"
                class="w-full form-input resize-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >启用状态</label
              >
              <div
                class="flex items-center gap-3 cursor-pointer select-none"
                @click="roleForm.is_active = !roleForm.is_active"
              >
                <div
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="roleForm.is_active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="roleForm.is_active ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {{ roleForm.is_active ? '已启用' : '已禁用' }}
                </span>
              </div>
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl"
          >
            <button
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              @click="closeRoleModal"
            >
              取消
            </button>
            <button
              :disabled="!roleForm.code.trim() || !roleForm.name.trim() || isRoleSaving"
              class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="saveRole"
            >
              <i
                class="fas"
                :class="isRoleSaving ? 'fa-spinner animate-spin' : 'fa-save'"
              />
              {{ isRoleSaving ? '保存中...' : '保存角色' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
  .form-input {
    @apply bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5;
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
