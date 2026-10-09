import { clampMinZero } from './model';
import { computed, ref, watch } from 'vue';
import type { MenuRootRow, MenuRow, FunctionRow, TreeNodeData, Param, FnItem } from './types';

export function createMenuConfigState() {
  const menuRoots = ref<MenuRootRow[]>([]);
  const menuRows = ref<MenuRow[]>([]);
  const functionRows = ref<FunctionRow[]>([]);
  const treeData = ref<TreeNodeData[]>([]);

  const showTreeMenu = ref(false);
  const openIds = ref<Set<string>>(new Set<string>());
  const searchQuery = ref('');
  const selectedId = ref('');
  const selectedNode = ref<TreeNodeData | null>(null);
  const loading = ref(false);
  const saving = ref(false);

  const form = ref({
    displayName: '',
    internalCode: '',
    scope: '内部人员',
    type: '目录',
    sortOrder: 0,
    iconPath: '',
    template: '',
    notes: '',
  });

  watch(
    () => form.value.sortOrder,
    v => {
      const next = clampMinZero(v);
      if (next !== v) form.value.sortOrder = next;
    }
  );

  const params = ref<Param[]>([]);
  const showParamForm = ref(false);
  const newParam = ref<Param>({ name: '', value: '' });

  const functions = ref<FnItem[]>([]);
  const page = ref(1);
  const totalPages = computed(() => Math.max(1, Math.ceil(functions.value.length / 10)));

  const templatePickerOpen = ref(false);
  const templateLoading = ref(false);
  const templateError = ref('');
  const templateSearch = ref('');
  const templateItems = ref<Array<any>>([]);
  const templateFunctionKvid = ref('');
  const templateFunctionName = ref('');

  const relatePickerOpen = ref(false);
  const relateLoading = ref(false);
  const relateLoadingMore = ref(false);
  const relateError = ref('');
  const relateSearch = ref('');
  const relateItems = ref<Array<any>>([]);
  const relateTotal = ref<number | null>(null);
  const relateScrollEl = ref<HTMLElement | null>(null);
  const relateHasMore = ref(false);
  const relateChecked = ref<Record<string, boolean>>({});
  const relateCheckedMap = ref<Record<string, any>>({});
  const relateCheckedCount = computed(
    () => Object.values(relateChecked.value).filter(Boolean).length
  );
  const relateTotalDisplay = computed(() =>
    typeof relateTotal.value === 'number' ? relateTotal.value : relateItems.value.length
  );
  const canRelateFunctions = computed(() =>
    Boolean(selectedNode.value && selectedNode.value.type === 'folder')
  );

  const dialog = ref<{
    open: boolean;
    title: string;
    message: string;
    confirmOnly: boolean;
    resolve: ((v: boolean) => void) | null;
  }>({ open: false, title: '', message: '', confirmOnly: false, resolve: null });

  const functionMap = computed(() => {
    const map = new Map<string, FunctionRow>();
    functionRows.value.forEach(item => map.set(item.kvid, item));
    return map;
  });

  return {
    menuRoots,
    menuRows,
    functionRows,
    treeData,
    showTreeMenu,
    openIds,
    searchQuery,
    selectedId,
    selectedNode,
    loading,
    saving,
    form,
    params,
    showParamForm,
    newParam,
    functions,
    page,
    totalPages,
    templatePickerOpen,
    templateLoading,
    templateError,
    templateSearch,
    templateItems,
    templateFunctionKvid,
    templateFunctionName,
    relatePickerOpen,
    relateLoading,
    relateLoadingMore,
    relateError,
    relateSearch,
    relateItems,
    relateTotal,
    relateScrollEl,
    relateHasMore,
    relateChecked,
    relateCheckedMap,
    relateCheckedCount,
    relateTotalDisplay,
    canRelateFunctions,
    dialog,
    functionMap,
  };
}
export type MenuConfigState = ReturnType<typeof createMenuConfigState>;
