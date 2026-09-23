import { computed, onActivated, onMounted, ref } from 'vue';
import {
  deleteDashboardFunction,
  listDashboardFunctions,
  saveDashboardFunction,
  replaceFunctionAccess,
  updateDashboardFunction,
  type DashboardFunctionRecord,
} from '@/api/dashboard-functions';
import {
  deleteRoleRecord,
  deleteDepartment,
  getPermissionConfig,
  assignUserDepartment,
  addDepartmentUsers,
  replaceUserRoles,
  setUserAppRole as saveUserAppRole,
  saveDepartment as saveDepartmentRecord,
  saveRole as saveRoleRecord,
  type DepartmentRecord,
} from '@/api/dashboard-admin';
import { getCurrentUser } from '@/api/nest-client';

export function usePermissionAdmin(mode: 'functions' | 'users' | 'departments') {
  type RenderType = 'webview' | 'vue' | 'umd';
  type SourceType = 'manual' | 'umd' | 'system';

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
    name: string | null;
    email: string | null;
    app_role: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
    department_id: string | null;
  }

  interface DepartmentFunctionRow {
    department_id: string;
    function_kvid: string;
  }


  const functions = ref<FunctionItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isModalOpen = ref(false);
  const isSaving = ref(false);
  const editingKvid = ref<string | null>(null);

  const roles = ref<RoleItem[]>([]);
  const ordinaryRole = computed(() => roles.value.find(role => role.code === 'user' && role.is_active));
  const roleFunctionMap = ref<Record<string, string[]>>({});
  const functionRoleDrafts = ref<Record<string, string[]>>({});
  const departments = ref<DepartmentRecord[]>([]);
  const departmentFunctionMap = ref<Record<string, string[]>>({});
  const functionDepartmentDrafts = ref<Record<string, string[]>>({});
  const expandedFunctionId = ref<string | null>(null);
  const savingFunctionId = ref<string | null>(null);
  const userRoleMap = ref<Record<string, string[]>>({});
  const savedUserRoleMap = ref<Record<string, string[]>>({});
  const userDirectory = ref<UserDirectoryRow[]>([]);
  const expandedUserId = ref<string | null>(null);
  const featureSearch = ref('');
  const userSearch = ref('');
  const permissionLoading = ref(false);
  const permissionError = ref<string | null>(null);
  const savingUserId = ref<string | null>(null);
  const assigningUserId = ref<string | null>(null);

  const departmentForm = ref<DepartmentRecord>({ id: '', parent_id: null, code: '', name: '', kind: 'organization', full_name: '', address: null, mnemonic_code: null, internal_code: null, manager_user_id: null, floor: null, is_active: true, sort_order: 0 });
  const departmentSaving = ref(false);
  const departmentEditorOpen = ref(false);
  const addTarget = ref<DepartmentRecord | null>(null);
  const personnelTarget = ref<DepartmentRecord | null>(null);
  const personnelSearch = ref('');
  const selectedPersonnelIds = ref<string[]>([]);
  const personnelSaving = ref(false);

  const filteredAssignableUsers = computed(() => {
    const keyword = personnelSearch.value.trim().toLowerCase();
    return userDirectory.value.filter(user => user.department_id !== personnelTarget.value?.id
      && (!keyword || [user.name, user.email, user.user_id].some(value => String(value ?? '').toLowerCase().includes(keyword))));
  });

  const isRoleManagerOpen = ref(false);
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

  const filteredFeatures = computed(() => {
    const keyword = featureSearch.value.trim().toLowerCase();
    return functions.value.filter(item =>
      !keyword || [item.title, item.handler, item.source_component, item.source_module, item.source_url]
        .some(value => String(value ?? '').toLowerCase().includes(keyword))
    );
  });

  const filteredUsers = computed(() => {
    const keyword = userSearch.value.trim().toLowerCase();
    return userDirectory.value.filter(item =>
      !keyword || [item.email, item.user_id].some(value => String(value ?? '').toLowerCase().includes(keyword))
    );
  });

  const departmentTree = computed(() => {
    const result: Array<DepartmentRecord & { depth: number }> = [];
    const seen = new Set<string>();
    const visit = (parentId: string | null, depth: number) => {
      for (const item of departments.value.filter(dept => dept.parent_id === parentId)) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        result.push({ ...item, depth });
        visit(item.id, depth + 1);
      }
    };
    visit(null, 0);
    for (const item of departments.value) if (!seen.has(item.id)) result.push({ ...item, depth: 0 });
    return result;
  });

  const availableParentDepartments = computed(() => departmentTree.value.filter(item => {
    const editingId = departmentForm.value.id;
    if (!editingId) return true;
    let current: DepartmentRecord | undefined = item;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      if (current.id === editingId) return false;
      seen.add(current.id);
      current = departments.value.find(department => department.id === current?.parent_id);
    }
    return true;
  }));

  function departmentName(id: string | null): string {
    return departments.value.find(item => item.id === id)?.name ?? '未分配部门';
  }

  function sameIds(a: string[] = [], b: string[] = []): boolean {
    return a.length === b.length && a.every(id => b.includes(id));
  }

  function userHasChanges(userId: string): boolean {
    return !sameIds(userRoleMap.value[userId], savedUserRoleMap.value[userId]);
  }

  function roleIdsForFunction(functionKvid: string): string[] {
    const role = ordinaryRole.value;
    return role && (roleFunctionMap.value[role.kvid] ?? []).includes(functionKvid) ? [role.kvid] : [];
  }

  function departmentIdsForFunction(functionKvid: string): string[] {
    return departments.value
      .filter(department => (departmentFunctionMap.value[department.id] ?? []).includes(functionKvid))
      .map(department => department.id);
  }

  function functionHasChanges(functionKvid: string): boolean {
    return !sameIds(functionRoleDrafts.value[functionKvid] ?? roleIdsForFunction(functionKvid), roleIdsForFunction(functionKvid))
      || !sameIds(functionDepartmentDrafts.value[functionKvid] ?? departmentIdsForFunction(functionKvid), departmentIdsForFunction(functionKvid));
  }

  function toggleFunctionExpanded(functionKvid: string) {
    expandedFunctionId.value = expandedFunctionId.value === functionKvid ? null : functionKvid;
    if (!functionRoleDrafts.value[functionKvid]) {
      functionRoleDrafts.value = {
        ...functionRoleDrafts.value,
        [functionKvid]: roleIdsForFunction(functionKvid),
      };
    }
    if (!functionDepartmentDrafts.value[functionKvid]) {
      functionDepartmentDrafts.value = { ...functionDepartmentDrafts.value, [functionKvid]: departmentIdsForFunction(functionKvid) };
    }
  }

  function toggleFunctionRole(functionKvid: string, roleKvid: string) {
    if (roleKvid !== ordinaryRole.value?.kvid) return;
    const current = new Set(functionRoleDrafts.value[functionKvid] ?? roleIdsForFunction(functionKvid));
    if (current.has(roleKvid)) current.delete(roleKvid);
    else current.add(roleKvid);
    functionRoleDrafts.value = { ...functionRoleDrafts.value, [functionKvid]: [...current] };
  }

  function toggleFunctionDepartment(functionKvid: string, departmentId: string) {
    const current = new Set(functionDepartmentDrafts.value[functionKvid] ?? departmentIdsForFunction(functionKvid));
    if (current.has(departmentId)) current.delete(departmentId);
    else current.add(departmentId);
    functionDepartmentDrafts.value = { ...functionDepartmentDrafts.value, [functionKvid]: [...current] };
  }

  async function saveFunctionAccess(functionKvid: string) {
    if (!ordinaryRole.value) {
      permissionError.value = '普通用户授权配置缺失，请先运行数据库迁移';
      return;
    }
    const selectedRoles = [...new Set(functionRoleDrafts.value[functionKvid] ?? roleIdsForFunction(functionKvid))];
    const selectedDepartments = [...new Set(functionDepartmentDrafts.value[functionKvid] ?? departmentIdsForFunction(functionKvid))];
    savingFunctionId.value = functionKvid;
    try {
      await replaceFunctionAccess(functionKvid, selectedRoles, selectedDepartments);
      const next: Record<string, string[]> = {};
      for (const role of roles.value) {
        const ids = new Set(roleFunctionMap.value[role.kvid] ?? []);
        if (selectedRoles.includes(role.kvid)) ids.add(functionKvid);
        else ids.delete(functionKvid);
        next[role.kvid] = [...ids];
      }
      roleFunctionMap.value = next;
      const nextDepartments: Record<string, string[]> = {};
      for (const department of departments.value) {
        const ids = new Set(departmentFunctionMap.value[department.id] ?? []);
        if (selectedDepartments.includes(department.id)) ids.add(functionKvid);
        else ids.delete(functionKvid);
        nextDepartments[department.id] = [...ids];
      }
      departmentFunctionMap.value = nextDepartments;
    } catch (err: any) {
      alert('保存功能授权失败：' + (err?.message ?? '未知错误'));
    } finally {
      savingFunctionId.value = null;
    }
  }

  function generateId(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
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
    functionRoleDrafts.value = {};
  }

  function buildDepartmentFunctionMap(data: DepartmentFunctionRow[]) {
    const nextMap: Record<string, string[]> = {};
    for (const item of data) (nextMap[item.department_id] ??= []).push(item.function_kvid);
    departmentFunctionMap.value = nextMap;
    functionDepartmentDrafts.value = {};
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
    savedUserRoleMap.value = structuredClone(nextMap);
  }

  async function loadPermissionData() {
    permissionLoading.value = true;
    permissionError.value = null;
    try {
      const data = await getPermissionConfig();
      roles.value = data.roles as RoleItem[];
      departments.value = data.departments;
      buildRoleFunctionMap(data.roleFunctions as RoleFunctionRow[]);
      buildDepartmentFunctionMap(data.departmentFunctions as DepartmentFunctionRow[]);
      buildUserRoleMap(data.userRoles as UserRoleRow[]);
      userDirectory.value = (data.users as UserDirectoryRow[]).sort((a, b) =>
        String(a.email ?? '').localeCompare(String(b.email ?? ''))
      );
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
    savedUserRoleMap.value = { ...savedUserRoleMap.value, [user.user_id]: selectedRoleIds };
  }

  async function setUserDepartment(user: UserDirectoryRow, event: Event) {
    const select = event.target as HTMLSelectElement;
    const departmentId = select.value || null;
    assigningUserId.value = user.user_id;
    try {
      await assignUserDepartment(user.user_id, departmentId);
      user.department_id = departmentId;
    } catch (err: any) {
      select.value = user.department_id ?? '';
      alert('分配部门失败：' + (err?.message ?? '未知错误'));
    } finally {
      assigningUserId.value = null;
    }
  }

  async function setUserAppRole(user: UserDirectoryRow, event: Event) {
    const select = event.target as HTMLSelectElement;
    const previousRole = user.app_role === 'admin' ? 'super_admin' : 'user';
    const role = select.value as 'user' | 'super_admin';
    if (role === previousRole) return;
    savingUserId.value = user.user_id;
    try {
      await saveUserAppRole(user.user_id, role);
      user.app_role = role === 'super_admin' ? 'admin' : null;
      if (getCurrentUser()?.id === user.user_id) window.location.reload();
    } catch (err: any) {
      select.value = previousRole;
      alert('设置用户权限失败：' + (err?.message ?? '未知错误'));
    } finally {
      savingUserId.value = null;
    }
  }

  function newDepartment(parentId: string | null = null) {
    departmentForm.value = { id: '', parent_id: parentId, code: '', name: '', kind: parentId ? 'department' : 'organization', full_name: '', address: null, mnemonic_code: null, internal_code: null, manager_user_id: null, floor: null, is_active: true, sort_order: departments.value.length };
    departmentEditorOpen.value = true;
  }

  function editDepartment(item: DepartmentRecord) {
    departmentForm.value = { ...item };
    departmentEditorOpen.value = true;
  }

  function openAddMenu(item: DepartmentRecord) {
    addTarget.value = item;
  }

  function createChildFromMenu() {
    const parentId = addTarget.value?.id;
    addTarget.value = null;
    if (parentId) newDepartment(parentId);
  }

  function openPersonnelPicker(item: DepartmentRecord) {
    addTarget.value = null;
    personnelTarget.value = item;
    personnelSearch.value = '';
    selectedPersonnelIds.value = [];
  }

  function togglePersonnel(userId: string) {
    const selected = new Set(selectedPersonnelIds.value);
    if (selected.has(userId)) selected.delete(userId);
    else selected.add(userId);
    selectedPersonnelIds.value = [...selected];
  }

  async function savePersonnel() {
    const departmentId = personnelTarget.value?.id;
    const userIds = selectedPersonnelIds.value;
    if (!departmentId || !userIds.length) return;
    personnelSaving.value = true;
    try {
      await addDepartmentUsers(departmentId, userIds);
      const selected = new Set(userIds);
      for (const user of userDirectory.value) if (selected.has(user.user_id)) user.department_id = departmentId;
      personnelTarget.value = null;
    } catch (err: any) {
      alert('添加人员失败：' + (err?.message ?? '未知错误'));
    } finally {
      personnelSaving.value = false;
    }
  }

  async function saveDepartment() {
    departmentSaving.value = true;
    try {
      const item = departmentForm.value;
      await saveDepartmentRecord(item.kind === 'department'
        ? { ...item, full_name: item.name, address: null, mnemonic_code: null }
        : { ...item, manager_user_id: null, floor: null, mnemonic_code: null });
      await loadPermissionData();
      departmentEditorOpen.value = false;
    } catch (err: any) {
      alert('保存组织机构失败：' + (err?.message ?? '未知错误'));
    } finally {
      departmentSaving.value = false;
    }
  }

  async function removeDepartment(item: DepartmentRecord) {
    if (!confirm(`确认删除“${item.name}”？其下级组织和成员需先迁出。`)) return;
    try {
      await deleteDepartment(item.id);
      await loadPermissionData();
      if (departmentForm.value.id === item.id) departmentEditorOpen.value = false;
    } catch (err: any) {
      alert('删除组织机构失败：' + (err?.message ?? '未知错误'));
    }
  }

  async function refreshAll() {
    const pendingFunctions = Object.keys(functionRoleDrafts.value).some(functionHasChanges);
    const pendingUsers = userDirectory.value.some(user => userHasChanges(user.user_id));
    if ((pendingFunctions || pendingUsers) && !confirm('有未保存的权限更改，刷新后会丢失。继续刷新吗？')) return;
    if (mode === 'functions') await Promise.all([loadFunctions(), loadPermissionData()]);
    else await loadPermissionData();
  }

  onMounted(async () => {
    if (mode === 'functions') await Promise.all([loadFunctions(), loadPermissionData()]);
    else await loadPermissionData();
  });

  let firstActivation = true;
  onActivated(async () => {
    if (firstActivation) {
      firstActivation = false;
      return;
    }
    const hasFunctionDraft = mode === 'functions' && Object.keys(functionRoleDrafts.value).some(functionHasChanges);
    const hasUserDraft = mode === 'users' && userDirectory.value.some(user => userHasChanges(user.user_id));
    if (hasFunctionDraft || hasUserDraft) return;
    if (mode === 'functions') await Promise.all([loadFunctions(), loadPermissionData()]);
    else await loadPermissionData();
  });

  return {
    functions,
    loading,
    error,
    isModalOpen,
    isSaving,
    editingKvid,
    roles,
    ordinaryRole,
    roleFunctionMap,
    functionRoleDrafts,
    departments,
    departmentFunctionMap,
    functionDepartmentDrafts,
    expandedFunctionId,
    savingFunctionId,
    userRoleMap,
    savedUserRoleMap,
    userDirectory,
    expandedUserId,
    featureSearch,
    userSearch,
    permissionLoading,
    permissionError,
    savingUserId,
    assigningUserId,
    departmentForm,
    departmentSaving,
    departmentEditorOpen,
    addTarget,
    personnelTarget,
    personnelSearch,
    selectedPersonnelIds,
    personnelSaving,
    filteredAssignableUsers,
    isRoleManagerOpen,
    isRoleModalOpen,
    isRoleSaving,
    editingRoleKvid,
    emptyForm,
    emptyRoleForm,
    form,
    roleForm,
    parametersText,
    renderTypeLabel,
    filteredFeatures,
    filteredUsers,
    departmentTree,
    availableParentDepartments,
    departmentName,
    sameIds,
    userHasChanges,
    roleIdsForFunction,
    departmentIdsForFunction,
    functionHasChanges,
    toggleFunctionExpanded,
    toggleFunctionRole,
    toggleFunctionDepartment,
    saveFunctionAccess,
    generateId,
    loadFunctions,
    buildRoleFunctionMap,
    buildDepartmentFunctionMap,
    buildUserRoleMap,
    loadPermissionData,
    openCreate,
    openEdit,
    closeModal,
    saveFunction,
    deleteFunction,
    toggleEnabled,
    openCreateRole,
    openEditRole,
    closeRoleModal,
    saveRole,
    deleteRole,
    toggleUserRole,
    saveUserRoles,
    setUserAppRole,
    setUserDepartment,
    newDepartment,
    editDepartment,
    openAddMenu,
    createChildFromMenu,
    openPersonnelPicker,
    togglePersonnel,
    savePersonnel,
    saveDepartment,
    removeDepartment,
    refreshAll,
  };
}
