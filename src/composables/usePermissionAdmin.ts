import { onActivated, onMounted } from 'vue';
import { createPermissionState } from './permission-admin/state';
import { useFunctionAccess } from './permission-admin/function-access';
import { usePermissionData } from './permission-admin/data';
import { useFeatureEditor } from './permission-admin/feature-editor';
import { useRoleEditor } from './permission-admin/role-editor';
import { useUserAdmin } from './permission-admin/user-admin';
import { useOrganizationAdmin } from './permission-admin/organization-admin';

/** 各管理页共用数据，领域编辑器独立维护。 */
export function usePermissionAdmin(mode: 'functions' | 'users' | 'departments') {
  const state = createPermissionState();
  const data = usePermissionData(state);
  const access = useFunctionAccess(state);
  const users = useUserAdmin(state);
  const features = useFeatureEditor(state, data);
  const roles = useRoleEditor(state, data);
  const organization = useOrganizationAdmin(state, data);
  const { functionRoleDrafts, userDirectory } = state;
  const { functionHasChanges } = access;
  const { userHasChanges } = users;
  const { loadFunctions, loadPermissionData } = data;
  async function refreshAll() {
    const pendingFunctions = Object.keys(functionRoleDrafts.value).some(functionHasChanges);
    const pendingUsers = userDirectory.value.some(user => userHasChanges(user.user_id));
    if (
      (pendingFunctions || pendingUsers) &&
      !confirm('有未保存的权限更改，刷新后会丢失。继续刷新吗？')
    )
      return;
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
    const hasFunctionDraft =
      mode === 'functions' && Object.keys(functionRoleDrafts.value).some(functionHasChanges);
    const hasUserDraft =
      mode === 'users' && userDirectory.value.some(user => userHasChanges(user.user_id));
    if (hasFunctionDraft || hasUserDraft) return;
    if (mode === 'functions') await Promise.all([loadFunctions(), loadPermissionData()]);
    else await loadPermissionData();
  });

  return {
    ...state,
    ...data,
    ...access,
    ...users,
    ...features,
    ...roles,
    ...organization,
    refreshAll,
  };
}
