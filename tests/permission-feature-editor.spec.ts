import { effectScope, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveDashboardFunction } from '../src/api/dashboard-functions';
import { createPermissionState } from '../src/composables/permission-admin/state';
import { useFeatureEditor } from '../src/composables/permission-admin/feature-editor';

vi.mock('../src/api/dashboard-functions', () => ({
  saveDashboardFunction: vi.fn(),
  deleteDashboardFunction: vi.fn(),
  updateDashboardFunction: vi.fn(),
}));

describe('feature editor drafts', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });
  it('blocks invalid JSON without discarding the typed draft', async () => {
    const scope = effectScope();
    const state = scope.run(createPermissionState)!;
    const actions = { loadFunctions: vi.fn(), loadPermissionData: vi.fn() };
    const editor = useFeatureEditor(state, actions as never);
    editor.openCreate();
    await nextTick();
    state.form.value.title = 'Example';
    state.form.value.handler = '/example';
    state.parametersText.value = '{"unfinished":';
    await editor.saveFunction();
    expect(saveDashboardFunction).not.toHaveBeenCalled();
    expect(state.parametersText.value).toBe('{"unfinished":');
    expect(state.parametersError.value).toBeTruthy();
    expect(state.isModalOpen.value).toBe(true);

    state.parametersText.value = '{"enabled":false}';
    vi.mocked(saveDashboardFunction).mockResolvedValue({} as never);
    await editor.saveFunction();
    expect(saveDashboardFunction).toHaveBeenCalledWith(
      expect.objectContaining({ parameters: { enabled: false } })
    );
    expect(state.isModalOpen.value).toBe(false);
    scope.stop();
  });
});
