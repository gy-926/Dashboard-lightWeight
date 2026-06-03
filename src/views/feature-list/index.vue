<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { adminSupabase } from '@/utils/supabase-admin';

  defineOptions({ name: 'FeatureListPage' });

  type RenderType = 'webview' | 'vue' | 'umd';
  type SourceType = 'manual' | 'umd' | 'system';

  interface FunctionItem {
    kvid: string;
    title: string | null;
    handler: string;
    remark: string | null;
    parameters: Record<string, any> | null;
    render_type: RenderType;
    source_type: SourceType;
    source_module: string | null;
    source_url: string | null;
    source_component: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
  }

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

  const functions = ref<FunctionItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const isModalOpen = ref(false);
  const isSaving = ref(false);
  const editingKvid = ref<string | null>(null);

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

  const form = ref<FunctionForm>(emptyForm());

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

  function generateId(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function loadFunctions() {
    loading.value = true;
    error.value = null;
    const { data, error: err } = await adminSupabase
      .from('functions')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });
    loading.value = false;
    if (err) {
      error.value = err.message;
      return;
    }
    functions.value = (data ?? []) as FunctionItem[];
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

    const { error: err } = await adminSupabase.from('functions').upsert(payload);
    isSaving.value = false;
    if (err) {
      alert('保存失败：' + err.message);
      return;
    }
    closeModal();
    await loadFunctions();
  }

  async function deleteFunction(item: FunctionItem) {
    if (!confirm(`确认删除「${item.title || item.handler}」？`)) return;
    const { error: err } = await adminSupabase.from('functions').delete().eq('kvid', item.kvid);
    if (err) {
      alert('删除失败：' + err.message);
      return;
    }
    await loadFunctions();
  }

  async function toggleEnabled(item: FunctionItem) {
    const { error: err } = await adminSupabase
      .from('functions')
      .update({ is_active: !item.is_active })
      .eq('kvid', item.kvid);
    if (err) {
      alert('更新状态失败：' + err.message);
      return;
    }
    await loadFunctions();
  }

  onMounted(loadFunctions);
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">功能列表</h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          共 {{ functions.length }} 项
        </span>
        <button
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          @click="openCreate"
        >
          <i class="fas fa-plus" />
          新增功能
        </button>
      </div>
    </div>

    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3"
    >
      <i class="fas fa-exclamation-triangle" />
      {{ error }}
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
          <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
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
