<script lang="ts">
  export const manifest = {
    name: 'MenuConfig',
    type: 'component',
    description: '菜单配置页面：支持树形菜单管理、菜单信息编辑、参数配置与功能集合维护。',
    version: '1.0.0',
    author: 'GavinYin Team',
  };
</script>

<script setup lang="ts">
  import { provide } from 'vue';
  import { useMenuConfig } from './useMenuConfig';
  import { menuConfigKey } from './context';
  import MenuTreeSidebar from './components/MenuTreeSidebar.vue';
  import MenuNodeForm from './components/MenuNodeForm.vue';
  import MenuFunctionCollection from './components/MenuFunctionCollection.vue';
  import MenuTemplatePicker from './components/MenuTemplatePicker.vue';
  import MenuRelatePicker from './components/MenuRelatePicker.vue';
  import MenuParameterEditor from './components/MenuParameterEditor.vue';
  import MenuDialog from './components/MenuDialog.vue';
  defineOptions({ name: 'MenuConfig' });
  defineExpose({ manifest });
  const editor = useMenuConfig();
  provide(menuConfigKey, editor);
  const { saveCurrent, deleteSelected, selectedId, selectedNode, saving } = editor;
</script>

<template>
  <div
    class="menu-config flex h-full min-h-0 rounded-2xl bg-slate-50 dark:bg-slate-900 font-sans text-sm text-slate-700 dark:text-slate-300 overflow-hidden transition-colors duration-300"
  >
    <!-- ══════════════════════ LEFT SIDEBAR ══════════════════════ -->
    <MenuTreeSidebar />

    <!-- ══════════════════════ MAIN AREA ══════════════════════ -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header
        class="flex items-center justify-between px-6 py-3.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
      >
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 rounded-full bg-indigo-500"></div>
          <span class="text-slate-400 dark:text-slate-400 text-xs">当前菜单</span>
          <span class="font-semibold text-slate-800 dark:text-slate-100">{{
            selectedNode?.label ?? '—'
          }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="!selectedNode || saving"
            @click="saveCurrent"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            保存
          </button>
          <button
            :disabled="!selectedId"
            @click="deleteSelected"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700"
          >
            <svg
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            删除
          </button>
        </div>
      </header>

      <!-- Scrollable content -->
      <div class="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div class="p-5 flex flex-col gap-4 flex-1">
          <!-- ── Basic Info + Param Config Card (side by side) ── -->
          <MenuNodeForm />

          <!-- ── Function Collection Card (full width) ── -->
          <MenuFunctionCollection />
          <!-- end function collection wrapper -->
        </div>
      </div>
    </main>

    <MenuTemplatePicker />

    <MenuRelatePicker />

    <MenuParameterEditor />

    <!-- ══════════════════════ 通用弹框 ══════════════════════ -->
    <MenuDialog />
  </div>
</template>

<style src="./menu-config.css"></style>
