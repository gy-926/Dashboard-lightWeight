<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/utils/supabase';

interface FeatureItem {
  id: string;
  name: string;
  is_enabled: boolean;
  icon: string | null;
  entry: string | null;
  link_url: string | null;
  sort_order: number;
  created_at: string;
}

type FeatureForm = Omit<FeatureItem, 'id' | 'created_at'>;

const features = ref<FeatureItem[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const isModalOpen = ref(false);
const isSaving = ref(false);
const editingId = ref<string | null>(null);

const emptyForm = (): FeatureForm => ({
  name: '',
  is_enabled: true,
  icon: '',
  entry: '',
  link_url: '',
  sort_order: 0,
});

const form = ref<FeatureForm>(emptyForm());

async function loadFeatures() {
  loading.value = true;
  error.value = null;
  const { data, error: err } = await supabase
    .from('feature_list')
    .select('*')
    .order('sort_order', { ascending: true });
  loading.value = false;
  if (err) {
    error.value = err.message;
    return;
  }
  features.value = data ?? [];
}

function openCreate() {
  editingId.value = null;
  form.value = emptyForm();
  isModalOpen.value = true;
}

function openEdit(item: FeatureItem) {
  editingId.value = item.id;
  form.value = {
    name: item.name,
    is_enabled: item.is_enabled,
    icon: item.icon ?? '',
    entry: item.entry ?? '',
    link_url: item.link_url ?? '',
    sort_order: item.sort_order,
  };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

async function saveFeature() {
  if (!form.value.name.trim()) return;
  isSaving.value = true;
  const payload = {
    name: form.value.name.trim(),
    is_enabled: form.value.is_enabled,
    icon: form.value.icon?.trim() || null,
    entry: form.value.entry?.trim() || null,
    link_url: form.value.link_url?.trim() || null,
    sort_order: form.value.sort_order,
  };

  let err;
  if (editingId.value) {
    ({ error: err } = await supabase
      .from('feature_list')
      .update(payload)
      .eq('id', editingId.value));
  } else {
    ({ error: err } = await supabase.from('feature_list').insert(payload));
  }

  isSaving.value = false;
  if (err) {
    alert('保存失败：' + err.message);
    return;
  }
  closeModal();
  await loadFeatures();
}

async function deleteFeature(id: string, name: string) {
  if (!confirm(`确认删除「${name}」？`)) return;
  const { error: err } = await supabase.from('feature_list').delete().eq('id', id);
  if (err) {
    alert('删除失败：' + err.message);
    return;
  }
  await loadFeatures();
}

async function toggleEnabled(item: FeatureItem) {
  await supabase
    .from('feature_list')
    .update({ is_enabled: !item.is_enabled })
    .eq('id', item.id);
  await loadFeatures();
}

onMounted(loadFeatures);
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-white">功能列表</h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          共 {{ features.length }} 项
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

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-3"
    >
      <i class="fas fa-exclamation-triangle" />
      {{ error }}
    </div>

    <!-- 加载中 -->
    <div
      v-if="loading"
      class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-400"
    >
      <i class="fas fa-spinner fa-spin text-3xl mb-3" />
      <p class="text-sm">加载中...</p>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="features.length === 0 && !error"
      class="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center text-gray-500"
    >
      <i class="fas fa-inbox text-4xl mb-4 text-gray-300" />
      <p>暂无功能记录</p>
      <p class="text-sm text-gray-400 mt-1">点击右上角「新增功能」添加第一条记录</p>
    </div>

    <!-- 功能列表 -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">显示名称</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">图标</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">执行入口</th>
            <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">链接地址</th>
            <th class="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">排序</th>
            <th class="text-center px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">启用</th>
            <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="item in features"
            :key="item.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <!-- 显示名称 -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div
                  v-if="item.icon"
                  class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <i :class="[item.icon, 'text-blue-600 dark:text-blue-400 text-sm']" />
                </div>
                <div
                  v-else
                  class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0"
                >
                  <i class="fas fa-puzzle-piece text-gray-400 text-sm" />
                </div>
                <span class="font-medium text-gray-800 dark:text-white">{{ item.name }}</span>
              </div>
            </td>

            <!-- 图标 -->
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">
              {{ item.icon || '—' }}
            </td>

            <!-- 执行入口 -->
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-[160px] truncate" :title="item.entry ?? ''">
              {{ item.entry || '—' }}
            </td>

            <!-- 链接地址 -->
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-[160px] truncate" :title="item.link_url ?? ''">
              {{ item.link_url || '—' }}
            </td>

            <!-- 排序 -->
            <td class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              {{ item.sort_order }}
            </td>

            <!-- 启用开关 -->
            <td class="px-6 py-4 text-center">
              <div
                class="relative w-11 h-6 rounded-full transition-colors cursor-pointer inline-flex"
                :class="item.is_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                @click="toggleEnabled(item)"
              >
                <div
                  class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  :class="item.is_enabled ? 'translate-x-5' : 'translate-x-0'"
                />
              </div>
            </td>

            <!-- 操作 -->
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
                  @click="deleteFeature(item.id, item.name)"
                >
                  <i class="fas fa-trash-alt mr-1" />删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <Teleport to="body">
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in-up">
          <!-- 弹窗头部 -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <i class="fas fa-list-alt text-blue-600" />
              {{ editingId ? '编辑功能' : '新增功能' }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              @click="closeModal"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <!-- 表单 -->
          <div class="px-6 py-5 space-y-4">
            <!-- 显示名称 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                显示名称 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="请输入功能显示名称"
                class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
              />
            </div>

            <!-- 图标 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                图标
                <span class="text-xs text-gray-400 font-normal ml-1">Font Awesome 类名，如 fas fa-home</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="form.icon"
                  type="text"
                  placeholder="fas fa-star"
                  class="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                />
                <div class="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <i :class="form.icon || 'fas fa-question'" class="text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            </div>

            <!-- 执行入口 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                执行入口
              </label>
              <input
                v-model="form.entry"
                type="text"
                placeholder="如 openPlugin 或 /route/path"
                class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
              />
            </div>

            <!-- 链接地址 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                链接地址
              </label>
              <input
                v-model="form.link_url"
                type="text"
                placeholder="https://example.com"
                class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
              />
            </div>

            <!-- 排序 & 启用 -->
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  排序权重
                </label>
                <input
                  v-model.number="form.sort_order"
                  type="number"
                  min="0"
                  class="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5"
                />
              </div>
              <div class="flex-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  是否启用
                </label>
                <div
                  class="flex items-center gap-3 cursor-pointer select-none"
                  @click="form.is_enabled = !form.is_enabled"
                >
                  <div
                    class="relative w-11 h-6 rounded-full transition-colors"
                    :class="form.is_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'"
                  >
                    <div
                      class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                      :class="form.is_enabled ? 'translate-x-5' : 'translate-x-0'"
                    />
                  </div>
                  <span class="text-sm text-gray-600 dark:text-gray-400">
                    {{ form.is_enabled ? '已启用' : '已禁用' }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 弹窗底部 -->
          <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 rounded-b-xl">
            <button
              class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              @click="closeModal"
            >
              取消
            </button>
            <button
              :disabled="!form.name.trim() || isSaving"
              class="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              @click="saveFeature"
            >
              <i class="fas fa-save" :class="{ 'animate-spin fa-spinner': isSaving }" />
              {{ isSaving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.25s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
