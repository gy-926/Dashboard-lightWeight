<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const {
    fnParamEditorOpen,
    fnParamDraft,
    fnParamEditorTitle,
    closeFnParamEditor,
    addFnParamDraft,
    removeFnParamDraft,
    clearFnParamDraft,
    saveFnParamDraft,
  } = useMenuConfigContext();
</script>

<template>
  <div
    v-if="fnParamEditorOpen"
    class="fixed inset-0 z-[60] flex items-center justify-center px-4"
  >
    <div
      class="absolute inset-0 bg-black/30"
      @click="closeFnParamEditor"
    ></div>
    <div
      class="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
      >
        <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">参数配置</div>
        <button
          type="button"
          class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          @click="closeFnParamEditor"
        >
          <svg
            class="w-4 h-4 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div
        class="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between"
      >
        <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
          {{ fnParamEditorTitle || '' }}
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="addFnParamDraft"
            class="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            新增
          </button>
          <button
            type="button"
            @click="clearFnParamDraft"
            class="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            清空
          </button>
        </div>
      </div>

      <div class="max-h-[420px] overflow-auto">
        <div
          v-if="fnParamDraft.length === 0"
          class="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          暂无参数
        </div>
        <div
          v-else
          class="px-5 py-4 space-y-2"
        >
          <div
            v-for="(p, idx) in fnParamDraft"
            :key="idx"
            class="grid grid-cols-2 gap-2 items-center"
          >
            <input
              v-model="p.name"
              type="text"
              placeholder="参数名"
              class="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
            <div class="flex items-center gap-2">
              <input
                v-model="p.value"
                type="text"
                placeholder="参数值"
                class="min-w-0 flex-1 text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
              <button
                type="button"
                @click="removeFnParamDraft(idx)"
                class="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        class="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-2 bg-white dark:bg-slate-800"
      >
        <button
          type="button"
          @click="closeFnParamEditor"
          class="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        >
          取消
        </button>
        <button
          type="button"
          @click="saveFnParamDraft"
          class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>
