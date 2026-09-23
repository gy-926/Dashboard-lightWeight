<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { deleteFile, downloadFile, listFiles, uploadFile, type StoredFileRecord } from '@/api/files';
import { getCurrentUser } from '@/api/nest-client';

defineOptions({ name: 'FileStoragePage' });

const files = ref<StoredFileRecord[]>([]);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const loading = ref(true);
const uploading = ref(false);
const dragging = ref(false);
const deletingId = ref<string | null>(null);
const downloadingId = ref<string | null>(null);
const search = ref('');
const notice = ref<{ type: 'success' | 'error'; text: string } | null>(null);

const isSuperAdmin = computed(() => getCurrentUser()?.role === 'super_admin');
const availableFiles = computed(() => files.value.filter(file => file.fileAvailable));
const totalSize = computed(() => availableFiles.value.reduce((total, file) => total + file.size, 0));
const filteredFiles = computed(() => {
  const keyword = search.value.trim().toLowerCase();
  if (!keyword) return files.value;
  return files.value.filter(file =>
    [file.originalName, file.mimeType, file.ownerUserId, file.sha256].some(value =>
      value.toLowerCase().includes(keyword)
    )
  );
});

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function iconFor(file: StoredFileRecord): string {
  if (file.mimeType.startsWith('image/')) return 'fa-file-image';
  if (file.mimeType.includes('pdf')) return 'fa-file-pdf';
  if (file.mimeType.includes('zip') || file.mimeType.includes('compressed')) return 'fa-file-zipper';
  if (file.mimeType.startsWith('text/')) return 'fa-file-lines';
  return 'fa-file';
}

async function loadFiles(): Promise<void> {
  loading.value = true;
  notice.value = null;
  try {
    files.value = await listFiles();
  } catch (error: any) {
    notice.value = { type: 'error', text: error?.message || '文件列表加载失败' };
  } finally {
    loading.value = false;
  }
}

function selectFile(file?: File): void {
  if (!file) return;
  selectedFile.value = file;
  notice.value = null;
}

function onInput(event: Event): void {
  selectFile((event.target as HTMLInputElement).files?.[0]);
}

function onDrop(event: DragEvent): void {
  dragging.value = false;
  selectFile(event.dataTransfer?.files?.[0]);
}

async function submitUpload(): Promise<void> {
  if (!selectedFile.value) {
    notice.value = { type: 'error', text: '请先选择文件' };
    return;
  }
  uploading.value = true;
  notice.value = null;
  try {
    const uploaded = await uploadFile(selectedFile.value);
    files.value = [uploaded, ...files.value.filter(file => file.id !== uploaded.id)];
    notice.value = { type: 'success', text: `“${uploaded.originalName}”上传成功` };
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = '';
  } catch (error: any) {
    notice.value = { type: 'error', text: error?.message || '文件上传失败' };
  } finally {
    uploading.value = false;
  }
}

async function handleDownload(file: StoredFileRecord): Promise<void> {
  downloadingId.value = file.id;
  notice.value = null;
  try {
    await downloadFile(file);
  } catch (error: any) {
    notice.value = { type: 'error', text: error?.message || '文件下载失败' };
  } finally {
    downloadingId.value = null;
  }
}

async function handleDelete(file: StoredFileRecord): Promise<void> {
  if (!window.confirm(`确定删除“${file.originalName}”吗？此操作无法撤销。`)) return;
  deletingId.value = file.id;
  notice.value = null;
  try {
    await deleteFile(file.id);
    files.value = files.value.filter(item => item.id !== file.id);
    notice.value = { type: 'success', text: '文件已删除' };
  } catch (error: any) {
    notice.value = { type: 'error', text: error?.message || '文件删除失败' };
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadFiles);
</script>

<template>
  <main class="min-h-full bg-slate-50 p-4 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
    <div class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-2 flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <i class="fas fa-hard-drive text-lg"></i>
            </span>
            <div>
              <h1 class="text-2xl font-bold tracking-tight">文件存储</h1>
              <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {{ isSuperAdmin ? '查看和管理所有用户文件' : '安全管理你的私有文件' }}
              </p>
            </div>
          </div>
        </div>
        <button class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900" :disabled="loading" @click="loadFiles">
          <i class="fas fa-rotate" :class="{ 'fa-spin': loading }"></i>
          刷新
        </button>
      </header>

      <section class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-sm text-slate-500 dark:text-slate-400">文件数量</p>
          <p class="mt-2 text-2xl font-bold">{{ availableFiles.length }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-sm text-slate-500 dark:text-slate-400">已用空间</p>
          <p class="mt-2 text-2xl font-bold">{{ formatBytes(totalSize) }}</p>
        </div>
        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p class="text-sm text-slate-500 dark:text-slate-400">访问范围</p>
          <p class="mt-2 text-lg font-semibold">{{ isSuperAdmin ? '全部用户' : '仅本人' }}</p>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="font-semibold">上传文件</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">默认单文件最大 50 MB，用户总量最大 1 GB</p>
          </div>
        </div>
        <input ref="fileInput" type="file" class="hidden" @change="onInput" />
        <div
          class="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 text-center transition"
          :class="dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 bg-slate-50 hover:border-blue-400 dark:border-slate-700 dark:bg-slate-950/60'"
          @click="fileInput?.click()"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <i class="fas fa-cloud-arrow-up mb-3 text-3xl text-blue-500"></i>
          <template v-if="selectedFile">
            <p class="max-w-full truncate font-medium">{{ selectedFile.name }}</p>
            <p class="mt-1 text-xs text-slate-500">{{ formatBytes(selectedFile.size) }}</p>
          </template>
          <template v-else>
            <p class="font-medium">拖放文件到这里，或点击选择</p>
            <p class="mt-1 text-xs text-slate-500">文件默认仅本人和超级管理员可访问</p>
          </template>
        </div>
        <div class="mt-4 flex justify-end">
          <button class="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50" :disabled="!selectedFile || uploading" @click="submitUpload">
            <i class="fas" :class="uploading ? 'fa-spinner fa-spin' : 'fa-upload'"></i>
            {{ uploading ? '上传中' : '开始上传' }}
          </button>
        </div>
      </section>

      <div v-if="notice" class="rounded-xl border px-4 py-3 text-sm" :class="notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300'">
        <i class="fas mr-2" :class="notice.type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'"></i>{{ notice.text }}
      </div>

      <section class="admin-list-panel">
        <div class="admin-list-header">
          <h2 class="font-semibold">文件列表</h2>
          <div class="relative w-full sm:w-72">
            <i class="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
            <input v-model="search" type="search" placeholder="搜索文件名、类型或哈希" class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950" />
          </div>
        </div>

        <div v-if="loading" class="grid min-h-52 place-items-center text-slate-500">
          <div class="text-center"><i class="fas fa-spinner fa-spin text-2xl text-blue-500"></i><p class="mt-3 text-sm">正在加载文件...</p></div>
        </div>
        <div v-else-if="filteredFiles.length === 0" class="grid min-h-52 place-items-center text-slate-500">
          <div class="text-center"><i class="far fa-folder-open text-4xl text-slate-300 dark:text-slate-700"></i><p class="mt-3 text-sm">{{ search ? '没有匹配的文件' : '还没有上传文件' }}</p></div>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left text-sm">
            <thead class="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/30 dark:text-slate-400">
              <tr><th class="px-5 py-3.5">文件</th><th class="px-5 py-3.5">大小</th><th v-if="isSuperAdmin" class="px-5 py-3.5">所有者</th><th class="px-5 py-3.5">上传时间</th><th class="px-5 py-3.5 text-right">操作</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-for="file in filteredFiles" :key="file.id" class="transition hover:bg-slate-50 dark:hover:bg-slate-700/20">
                <td class="px-5 py-4"><div class="flex min-w-0 items-center gap-3"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><i class="fas" :class="iconFor(file)"></i></span><div class="min-w-0"><p class="max-w-sm truncate font-medium" :title="file.originalName">{{ file.originalName }}</p><p class="mt-0.5 max-w-xs truncate text-xs text-slate-400">{{ file.mimeType }} <span v-if="!file.fileAvailable" class="ml-2 font-semibold text-red-600 dark:text-red-400">本地文件缺失或大小不匹配</span></p></div></div></td>
                <td class="px-5 py-4 text-slate-600 dark:text-slate-300">{{ formatBytes(file.size) }}</td>
                <td v-if="isSuperAdmin" class="px-5 py-4 font-mono text-xs text-slate-500">{{ file.ownerUserId }}</td>
                <td class="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">{{ formatDate(file.createdAt) }}</td>
                <td class="px-5 py-4"><div class="admin-list-actions"><button class="admin-list-action admin-list-action-primary" :disabled="!file.fileAvailable || downloadingId === file.id" :title="file.fileAvailable ? '下载' : '本地文件不可用'" :aria-label="`下载 ${file.originalName}`" @click="handleDownload(file)"><i class="fas" :class="downloadingId === file.id ? 'fa-spinner fa-spin' : 'fa-download'"></i>下载</button><button class="admin-list-action admin-list-action-danger" :disabled="deletingId === file.id" :aria-label="`删除 ${file.originalName}`" @click="handleDelete(file)"><i class="fas" :class="deletingId === file.id ? 'fa-spinner fa-spin' : 'fa-trash-can'"></i>删除</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>
