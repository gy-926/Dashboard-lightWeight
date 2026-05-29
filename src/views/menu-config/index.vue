<script setup lang="ts">
defineOptions({ name: 'MenuConfigPage' });

import { ref, computed, watch, onMounted } from 'vue';
import { adminSupabase } from '@/utils/supabase-admin';
import { clearDynamicRoutesCache } from '@/router/routes';

// ==================== Types ====================

interface MenuRoot {
  kvid: string;
  title: string;
  display_name: string | null;
  internal_code: string;
}

interface MenuRow {
  kvid: string;
  parent_kvid: string | null;
  menu_root_kvid: string;
  title: string;
  display_name: string | null;
  type: 'Page' | 'Folder' | 'Link' | 'System';
  icon: string | null;
  sort_order: number;
  remark: string | null;
  function_kvid: string | null;
  parameters: Record<string, any>;
  is_active: boolean;
  children?: MenuRow[];
}

interface FunctionRow {
  kvid: string;
  handler: string;
  remark: string | null;
  title: string | null;
  parameters: Record<string, any>;
}

// ==================== State ====================

const menuRoots = ref<MenuRoot[]>([]);
const selectedRootKvid = ref<string | null>(null);
const flatMenus = ref<MenuRow[]>([]);
const allFunctions = ref<FunctionRow[]>([]);

const expandedKvids = ref<Set<string>>(new Set());
const selectedMenuKvid = ref<string | null>(null);

type PanelMode = 'idle' | 'edit' | 'new';
const panelMode = ref<PanelMode>('idle');
const formData = ref<Partial<MenuRow>>({});
const funcFormData = ref<Partial<FunctionRow>>({});
const hasFunction = ref(false);
const saving = ref(false);
const deleting = ref(false);
const loading = ref(false);

const showRootModal = ref(false);
const rootForm = ref<Partial<MenuRoot>>({});
const savingRoot = ref(false);
const rootModalMode = ref<'new' | 'edit'>('new');

// ==================== Computed ====================

const selectedRoot = computed(() =>
  menuRoots.value.find(r => r.kvid === selectedRootKvid.value) ?? null
);

function buildTree(items: MenuRow[]): MenuRow[] {
  const map = new Map<string, MenuRow>();
  items.forEach(i => map.set(i.kvid, { ...i, children: [] }));
  const roots: MenuRow[] = [];
  items.forEach(item => {
    const node = map.get(item.kvid)!;
    if (item.parent_kvid && map.has(item.parent_kvid)) {
      map.get(item.parent_kvid)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  function sortNodes(nodes: MenuRow[]) {
    nodes.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    nodes.forEach(n => n.children?.length && sortNodes(n.children));
  }
  sortNodes(roots);
  return roots;
}

const menuTree = computed(() => buildTree(flatMenus.value));

function flattenForRender(nodes: MenuRow[], depth = 0): { node: MenuRow; depth: number }[] {
  const result: { node: MenuRow; depth: number }[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (expandedKvids.value.has(node.kvid) && node.children?.length) {
      result.push(...flattenForRender(node.children, depth + 1));
    }
  }
  return result;
}

const renderList = computed(() => flattenForRender(menuTree.value));

const parametersText = computed({
  get: () => {
    try { return JSON.stringify(formData.value.parameters ?? {}, null, 2); }
    catch { return '{}'; }
  },
  set: (val: string) => {
    try { formData.value.parameters = JSON.parse(val); }
    catch { /* ignore invalid JSON while typing */ }
  },
});

const renderHint = computed(() => {
  const h = funcFormData.value.handler ?? '';
  if (!h) return null;
  if (h.startsWith('<') && h.includes('>')) return { label: 'UMD 组件', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
  if (h.endsWith('.vue')) return { label: 'Vue 组件', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  return { label: 'WebView (iframe)', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' };
});

// ==================== Data ====================

async function loadMenuRoots() {
  const { data } = await adminSupabase.from('menu_roots').select('*').order('title');
  menuRoots.value = data ?? [];
}

async function loadMenusForRoot(rootKvid: string) {
  loading.value = true;
  try {
    const { data } = await adminSupabase
      .from('menus')
      .select('*')
      .eq('menu_root_kvid', rootKvid)
      .order('sort_order');
    flatMenus.value = (data ?? []) as MenuRow[];
    // Auto-expand first level
    const tree = buildTree(flatMenus.value);
    tree.forEach(n => expandedKvids.value.add(n.kvid));
    expandedKvids.value = new Set(expandedKvids.value);
  } finally {
    loading.value = false;
  }
}

async function loadFunctions() {
  const { data } = await adminSupabase.from('functions').select('*').order('title');
  allFunctions.value = (data ?? []) as FunctionRow[];
}

onMounted(async () => {
  await Promise.all([loadMenuRoots(), loadFunctions()]);
  if (menuRoots.value.length > 0) {
    selectedRootKvid.value = menuRoots.value[0].kvid;
  }
});

watch(selectedRootKvid, async val => {
  flatMenus.value = [];
  expandedKvids.value = new Set();
  selectedMenuKvid.value = null;
  panelMode.value = 'idle';
  if (val) await loadMenusForRoot(val);
});

// ==================== Tree Interaction ====================

function toggleExpand(kvid: string) {
  const s = new Set(expandedKvids.value);
  s.has(kvid) ? s.delete(kvid) : s.add(kvid);
  expandedKvids.value = s;
}

function openMenuEdit(menu: MenuRow) {
  selectedMenuKvid.value = menu.kvid;
  panelMode.value = 'edit';
  formData.value = {
    kvid: menu.kvid,
    parent_kvid: menu.parent_kvid,
    menu_root_kvid: menu.menu_root_kvid,
    title: menu.title,
    display_name: menu.display_name,
    type: menu.type,
    icon: menu.icon,
    sort_order: menu.sort_order,
    remark: menu.remark,
    function_kvid: menu.function_kvid,
    parameters: { ...(menu.parameters ?? {}) },
    is_active: menu.is_active,
  };
  hasFunction.value = !!menu.function_kvid;
  const fn = menu.function_kvid ? allFunctions.value.find(f => f.kvid === menu.function_kvid) : null;
  funcFormData.value = fn ? { ...fn } : { handler: '', remark: '', title: '', parameters: {} };
}

function startAddChild(parentKvid: string | null) {
  selectedMenuKvid.value = null;
  panelMode.value = 'new';
  const siblings = flatMenus.value.filter(m => m.parent_kvid === parentKvid);
  const nextOrder = siblings.length > 0 ? Math.max(...siblings.map(s => s.sort_order)) + 10 : 0;
  formData.value = {
    kvid: generateId(),
    parent_kvid: parentKvid,
    menu_root_kvid: selectedRootKvid.value!,
    title: '',
    display_name: null,
    type: 'Page',
    icon: null,
    sort_order: nextOrder,
    remark: null,
    function_kvid: null,
    parameters: {},
    is_active: true,
  };
  hasFunction.value = false;
  funcFormData.value = { handler: '', remark: '', title: '', parameters: {} };
}

function cancelPanel() {
  panelMode.value = 'idle';
  selectedMenuKvid.value = null;
}

function toggleAutoStartup() {
  const current = !!formData.value.parameters?.AutoStartup;
  formData.value.parameters = { ...(formData.value.parameters ?? {}), AutoStartup: !current };
}

// ==================== CRUD ====================

function generateId(): string {
  return (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function saveMenu() {
  if (!formData.value.title?.trim()) { alert('标题不能为空'); return; }
  saving.value = true;
  try {
    let funcKvid = formData.value.function_kvid ?? null;

    if (hasFunction.value && funcFormData.value.handler?.trim()) {
      funcKvid = funcKvid || generateId();
      const { error } = await adminSupabase.from('functions').upsert({
        kvid: funcKvid,
        handler: funcFormData.value.handler.trim(),
        remark: funcFormData.value.remark?.trim() || null,
        title: funcFormData.value.title?.trim() || formData.value.title,
        parameters: funcFormData.value.parameters ?? {},
      });
      if (error) throw error;
      await loadFunctions();
    } else if (!hasFunction.value) {
      funcKvid = null;
    }

    const payload = {
      kvid: formData.value.kvid || generateId(),
      parent_kvid: formData.value.parent_kvid ?? null,
      menu_root_kvid: formData.value.menu_root_kvid!,
      title: formData.value.title!.trim(),
      display_name: formData.value.display_name?.trim() || null,
      type: formData.value.type || 'Page',
      icon: formData.value.icon?.trim() || null,
      sort_order: formData.value.sort_order ?? 0,
      remark: formData.value.remark?.trim() || null,
      function_kvid: funcKvid,
      parameters: formData.value.parameters ?? {},
      is_active: formData.value.is_active ?? true,
    };

    const { error } = await adminSupabase.from('menus').upsert(payload);
    if (error) throw error;

    await loadMenusForRoot(selectedRootKvid.value!);
    clearDynamicRoutesCache();
    selectedMenuKvid.value = payload.kvid;
    panelMode.value = 'edit';
    formData.value = { ...payload };
    if (payload.parent_kvid) {
      const s = new Set(expandedKvids.value);
      s.add(payload.parent_kvid);
      expandedKvids.value = s;
    }
  } catch (e: any) {
    alert('保存失败: ' + e.message);
  } finally {
    saving.value = false;
  }
}

async function deleteMenu() {
  if (!formData.value.kvid) return;
  if (!confirm(`确定删除「${formData.value.title}」及其所有子菜单？`)) return;
  deleting.value = true;
  try {
    const { error } = await adminSupabase.from('menus').delete().eq('kvid', formData.value.kvid);
    if (error) throw error;
    await loadMenusForRoot(selectedRootKvid.value!);
    clearDynamicRoutesCache();
    panelMode.value = 'idle';
    selectedMenuKvid.value = null;
  } catch (e: any) {
    alert('删除失败: ' + e.message);
  } finally {
    deleting.value = false;
  }
}

function openNewRoot() {
  rootModalMode.value = 'new';
  rootForm.value = { kvid: generateId(), title: '', display_name: null, internal_code: '' };
  showRootModal.value = true;
}

function openEditRoot() {
  if (!selectedRoot.value) return;
  rootModalMode.value = 'edit';
  rootForm.value = { ...selectedRoot.value };
  showRootModal.value = true;
}

async function saveRoot() {
  if (!rootForm.value.title?.trim() || !rootForm.value.internal_code?.trim()) {
    alert('标题和 InternalCode 不能为空');
    return;
  }
  savingRoot.value = true;
  try {
    const kvid = rootForm.value.kvid || generateId();
    const { error } = await adminSupabase.from('menu_roots').upsert({
      kvid,
      title: rootForm.value.title!.trim(),
      display_name: rootForm.value.display_name?.trim() || null,
      internal_code: rootForm.value.internal_code!.trim(),
    });
    if (error) throw error;
    await loadMenuRoots();
    if (rootModalMode.value === 'new') selectedRootKvid.value = kvid;
    showRootModal.value = false;
  } catch (e: any) {
    alert('保存失败: ' + e.message);
  } finally {
    savingRoot.value = false;
  }
}

async function deleteRoot() {
  if (!selectedRoot.value) return;
  if (!confirm(`确定删除根节点「${selectedRoot.value.title}」及其所有菜单？此操作不可恢复。`)) return;
  const { error } = await adminSupabase.from('menu_roots').delete().eq('kvid', selectedRoot.value.kvid);
  if (error) { alert('删除失败: ' + error.message); return; }
  await loadMenuRoots();
  selectedRootKvid.value = menuRoots.value[0]?.kvid ?? null;
}

// ==================== Display ====================

const typeLabels: Record<string, string> = { Page: '页面', Folder: '目录', Link: '链接', System: '系统' };
const typeBadgeCls: Record<string, string> = {
  Page: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Folder: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Link: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  System: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};
const typeIconDefault: Record<string, string> = {
  Folder: 'fas fa-folder text-yellow-400',
  Link: 'fas fa-external-link-alt text-green-400',
  System: 'fas fa-cog text-purple-400',
  Page: 'fas fa-file-alt text-blue-400',
};
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Header -->
    <div class="flex items-center justify-between flex-shrink-0">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">菜单配置</h1>
      <button
        @click="openNewRoot"
        class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <i class="fas fa-plus"></i>新建根节点
      </button>
    </div>

    <!-- Root Bar -->
    <div class="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm flex-shrink-0">
      <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">根节点</span>
      <select
        v-model="selectedRootKvid"
        class="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
      >
        <option v-if="menuRoots.length === 0" :value="null">暂无根节点，请先新建</option>
        <option v-for="root in menuRoots" :key="root.kvid" :value="root.kvid">
          {{ root.title }} ({{ root.internal_code }})
        </option>
      </select>
      <template v-if="selectedRoot">
        <button
          @click="openEditRoot"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <i class="fas fa-edit"></i>编辑
        </button>
        <button
          @click="deleteRoot"
          class="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <i class="fas fa-trash"></i>删除
        </button>
      </template>
    </div>

    <!-- Main: Tree + Detail -->
    <div class="flex gap-4" style="height: calc(100vh - 15rem)">

      <!-- Left: Tree -->
      <div class="w-80 flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <span class="font-medium text-sm text-gray-700 dark:text-gray-300">菜单项</span>
          <button
            v-if="selectedRootKvid"
            @click="startAddChild(null)"
            class="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
          >
            <i class="fas fa-plus"></i>新增
          </button>
        </div>

        <div class="flex-1 overflow-y-auto custom-scrollbar py-1">
          <div v-if="!selectedRootKvid" class="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
            <i class="fas fa-sitemap text-2xl"></i>请选择根节点
          </div>
          <div v-else-if="loading" class="flex items-center justify-center h-20 text-gray-400 text-sm gap-2">
            <i class="fas fa-spinner fa-spin"></i>加载中
          </div>
          <div v-else-if="renderList.length === 0" class="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
            <i class="fas fa-folder-open text-2xl"></i>暂无菜单项
          </div>

          <div
            v-for="{ node, depth } in renderList"
            :key="node.kvid"
            class="group flex items-center gap-1 py-1.5 pr-2 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg mx-1"
            :class="selectedMenuKvid === node.kvid ? 'bg-blue-50 dark:bg-blue-900/20' : ''"
            :style="{ paddingLeft: `${8 + depth * 18}px` }"
            @click="openMenuEdit(node)"
          >
            <!-- Expand toggle -->
            <button
              class="w-4 h-4 flex items-center justify-center text-gray-400 flex-shrink-0"
              @click.stop="node.children?.length ? toggleExpand(node.kvid) : null"
            >
              <i
                v-if="node.children?.length"
                class="fas text-[9px] transition-transform"
                :class="expandedKvids.has(node.kvid) ? 'fa-chevron-down' : 'fa-chevron-right'"
              ></i>
              <span v-else class="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 block"></span>
            </button>

            <!-- Icon -->
            <i
              :class="node.icon ? `${node.icon} text-gray-400` : typeIconDefault[node.type]"
              class="text-[13px] flex-shrink-0 w-4 text-center"
            ></i>

            <!-- Title -->
            <span
              class="flex-1 text-sm truncate"
              :class="selectedMenuKvid === node.kvid
                ? 'text-blue-700 dark:text-blue-300 font-medium'
                : 'text-gray-700 dark:text-gray-300'"
            >
              {{ node.display_name || node.title }}
            </span>

            <!-- Inactive badge -->
            <span v-if="!node.is_active" class="text-[9px] text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100">
              OFF
            </span>

            <!-- Action buttons -->
            <div class="flex items-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
              <button
                @click="startAddChild(node.kvid)"
                class="w-6 h-6 flex items-center justify-center rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-500 text-[11px]"
                title="添加子菜单"
              >
                <i class="fas fa-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Detail Panel -->
      <div class="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col min-w-0">

        <!-- Idle -->
        <div v-if="panelMode === 'idle'" class="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
          <i class="fas fa-mouse-pointer text-3xl"></i>
          <p class="text-sm">点击左侧菜单项编辑，或点击「新增」创建</p>
        </div>

        <template v-else>
          <!-- Panel Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <div class="flex items-center gap-3">
              <h3 class="font-bold text-gray-800 dark:text-white">
                {{ panelMode === 'new' ? '新增菜单项' : '编辑菜单项' }}
              </h3>
              <span v-if="panelMode === 'edit' && formData.kvid" class="text-xs text-gray-400 font-mono truncate max-w-xs">
                {{ formData.kvid }}
              </span>
            </div>
            <button @click="cancelPanel" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Form Body -->
          <div class="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">

            <!-- Title + DisplayName -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">标题 <span class="text-red-400">*</span></label>
                <input v-model="formData.title" type="text" class="form-input" placeholder="菜单显示名" />
              </div>
              <div>
                <label class="form-label">显示名称 <span class="text-gray-400 font-normal">(可选，覆盖标题)</span></label>
                <input v-model="formData.display_name" type="text" class="form-input" placeholder="同标题则留空" />
              </div>
            </div>

            <!-- Type + Icon + Sort -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="form-label">类型</label>
                <select v-model="formData.type" class="form-input">
                  <option value="Page">Page — 页面</option>
                  <option value="Folder">Folder — 目录</option>
                  <option value="Link">Link — 链接</option>
                  <option value="System">System — 系统路由</option>
                </select>
              </div>
              <div>
                <label class="form-label">图标 (FontAwesome)</label>
                <div class="flex items-center gap-2">
                  <input v-model="formData.icon" type="text" class="form-input flex-1" placeholder="fas fa-home" />
                  <i v-if="formData.icon" :class="formData.icon" class="text-gray-400 text-base w-5 text-center flex-shrink-0"></i>
                </div>
              </div>
              <div>
                <label class="form-label">排序</label>
                <input v-model.number="formData.sort_order" type="number" step="10" class="form-input" />
              </div>
            </div>

            <!-- Remark -->
            <div>
              <label class="form-label">
                备注
                <span v-if="formData.type === 'System'" class="text-yellow-500 font-normal">— System 类型时此字段为路由路径</span>
              </label>
              <input v-model="formData.remark" type="text" class="form-input" />
            </div>

            <!-- Is Active + AutoStartup -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="form-label">启用状态</label>
                <button
                  @click="formData.is_active = !formData.is_active"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors w-full"
                  :class="formData.is_active
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400'"
                >
                  <i :class="formData.is_active ? 'fas fa-toggle-on text-green-500 text-lg' : 'fas fa-toggle-off text-gray-400 text-lg'"></i>
                  {{ formData.is_active ? '已启用' : '已禁用' }}
                </button>
              </div>
              <div>
                <label class="form-label">AutoStartup <span class="text-gray-400 font-normal">(首页自动打开)</span></label>
                <button
                  @click="toggleAutoStartup"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors w-full"
                  :class="formData.parameters?.AutoStartup
                    ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400'"
                >
                  <i :class="formData.parameters?.AutoStartup ? 'fas fa-toggle-on text-blue-500 text-lg' : 'fas fa-toggle-off text-gray-400 text-lg'"></i>
                  {{ formData.parameters?.AutoStartup ? '已开启' : '未开启' }}
                </button>
              </div>
            </div>

            <!-- Parameters JSON -->
            <div>
              <label class="form-label">扩展参数 (JSON)</label>
              <textarea
                v-model="parametersText"
                rows="3"
                spellcheck="false"
                class="form-input font-mono text-xs resize-none"
              ></textarea>
            </div>

            <!-- Function Section -->
            <div
              v-if="formData.type === 'Page' || formData.type === 'Link'"
              class="rounded-xl border border-dashed border-blue-200 dark:border-blue-800/50 p-4 space-y-4"
            >
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <i class="fas fa-link text-blue-500"></i>关联功能
                  <span v-if="formData.function_kvid" class="text-xs font-mono text-gray-400">{{ formData.function_kvid }}</span>
                </h4>
                <button
                  @click="hasFunction = !hasFunction"
                  class="text-xs px-2.5 py-1 rounded-lg transition-colors"
                  :class="hasFunction
                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'"
                >
                  {{ hasFunction ? '移除功能' : '+ 关联功能' }}
                </button>
              </div>

              <template v-if="hasFunction">
                <!-- Handler -->
                <div>
                  <label class="form-label">
                    Handler
                    <span class="font-normal text-gray-400">— &lt;ComponentName&gt; / /path / https://</span>
                  </label>
                  <input
                    v-model="funcFormData.handler"
                    type="text"
                    class="form-input"
                    placeholder="<MyUmdComponent> 或 https://example.com"
                  />
                  <div v-if="renderHint" class="mt-1.5 flex items-center gap-2">
                    <span class="text-xs text-gray-400">渲染方式：</span>
                    <span class="text-xs px-2 py-0.5 rounded font-medium" :class="renderHint.cls">
                      {{ renderHint.label }}
                    </span>
                  </div>
                </div>

                <!-- Script path for UMD -->
                <div>
                  <label class="form-label">
                    Script 路径
                    <span class="font-normal text-gray-400">— UMD 类型时为脚本 URL，WebView 时可留空</span>
                  </label>
                  <input
                    v-model="funcFormData.remark"
                    type="text"
                    class="form-input"
                    placeholder="https://cdn.example.com/component.umd.js"
                  />
                </div>
              </template>
            </div>

          </div>

          <!-- Panel Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <button
              v-if="panelMode === 'edit'"
              @click="deleteMenu"
              :disabled="deleting"
              class="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <i class="fas fa-trash"></i>{{ deleting ? '删除中...' : '删除' }}
            </button>
            <div v-else></div>
            <div class="flex items-center gap-3">
              <button
                @click="cancelPanel"
                class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                @click="saveMenu"
                :disabled="saving"
                class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <i class="fas fa-save"></i>{{ saving ? '保存中...' : '保存' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Root Modal -->
    <Teleport to="body">
      <div
        v-if="showRootModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md m-4 overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">
              {{ rootModalMode === 'new' ? '新建根节点' : '编辑根节点' }}
            </h3>
            <button @click="showRootModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="form-label">标题 <span class="text-red-400">*</span></label>
              <input v-model="rootForm.title" type="text" class="form-input" placeholder="GavinYin Dashboard" />
            </div>
            <div>
              <label class="form-label">显示名称</label>
              <input v-model="rootForm.display_name" type="text" class="form-input" />
            </div>
            <div>
              <label class="form-label">
                InternalCode <span class="text-red-400">*</span>
                <span class="font-normal text-gray-400">— 对应 GlobalConfig.InternalCode</span>
              </label>
              <input v-model="rootForm.internal_code" type="text" class="form-input font-mono" placeholder="umdDashboard" />
            </div>
            <div>
              <label class="form-label">Kvid</label>
              <input
                v-model="rootForm.kvid"
                type="text"
                class="form-input font-mono text-gray-400"
                :readonly="rootModalMode === 'edit'"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
            <button
              @click="showRootModal = false"
              class="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="saveRoot"
              :disabled="savingRoot"
              class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <i class="fas fa-save"></i>{{ savingRoot ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.form-label {
  @apply block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1;
}
.form-input {
  @apply w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow;
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156,163,175,0.4); border-radius: 20px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(75,85,99,0.4); }
</style>
