import { computed, ref, watch } from 'vue';

import { type DepartmentRecord } from '@/api/dashboard-admin';

import type {
  RenderType,
  FunctionItem,
  FunctionForm,
  RoleItem,
  RoleForm,
  UserDirectoryRow,
} from './types';

export function createPermissionState() {
  const functions = ref<FunctionItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isModalOpen = ref(false);
  const isSaving = ref(false);
  const editingKvid = ref<string | null>(null);

  const roles = ref<RoleItem[]>([]);
  const ordinaryRole = computed(() =>
    roles.value.find(role => role.code === 'user' && role.is_active)
  );
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

  const departmentForm = ref<DepartmentRecord>({
    id: '',
    parent_id: null,
    code: '',
    name: '',
    kind: 'organization',
    full_name: '',
    address: null,
    mnemonic_code: null,
    internal_code: null,
    manager_user_id: null,
    floor: null,
    is_active: true,
    sort_order: 0,
  });
  const departmentSaving = ref(false);
  const departmentEditorOpen = ref(false);
  const addTarget = ref<DepartmentRecord | null>(null);
  const personnelTarget = ref<DepartmentRecord | null>(null);
  const personnelSearch = ref('');
  const selectedPersonnelIds = ref<string[]>([]);
  const personnelSaving = ref(false);

  const filteredAssignableUsers = computed(() => {
    const keyword = personnelSearch.value.trim().toLowerCase();
    return userDirectory.value.filter(
      user =>
        user.department_id !== personnelTarget.value?.id &&
        (!keyword ||
          [user.name, user.email, user.user_id].some(value =>
            String(value ?? '')
              .toLowerCase()
              .includes(keyword)
          ))
    );
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

  const parametersText = ref('{}');
  const parametersError = ref('');
  watch(
    form,
    value => {
      parametersText.value = JSON.stringify(value.parameters ?? {}, null, 2);
      parametersError.value = '';
    },
    { immediate: true }
  );

  const renderTypeLabel: Record<RenderType, string> = {
    webview: 'WebView',
    vue: 'Vue',
    umd: 'UMD',
  };

  const filteredFeatures = computed(() => {
    const keyword = featureSearch.value.trim().toLowerCase();
    return functions.value.filter(
      item =>
        !keyword ||
        [item.title, item.handler, item.source_component, item.source_module, item.source_url].some(
          value =>
            String(value ?? '')
              .toLowerCase()
              .includes(keyword)
        )
    );
  });

  const filteredUsers = computed(() => {
    const keyword = userSearch.value.trim().toLowerCase();
    return userDirectory.value.filter(
      item =>
        !keyword ||
        [item.email, item.user_id].some(value =>
          String(value ?? '')
            .toLowerCase()
            .includes(keyword)
        )
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
    for (const item of departments.value)
      if (!seen.has(item.id)) result.push({ ...item, depth: 0 });
    return result;
  });

  const availableParentDepartments = computed(() =>
    departmentTree.value.filter(item => {
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
    })
  );

  return {
    renderTypeLabel,
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
    parametersError,
    filteredFeatures,
    filteredUsers,
    departmentTree,
    availableParentDepartments,
  };
}
export type PermissionState = ReturnType<typeof createPermissionState>;
