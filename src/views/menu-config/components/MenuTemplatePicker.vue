<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const {
    filteredTemplateItems,
    closeTemplatePicker,
    pickTemplate,
    templatePickerOpen,
    templateLoading,
    templateError,
    templateSearch,
  } = useMenuConfigContext();
</script>

<template>
  <div
    v-if="templatePickerOpen"
    class="fixed inset-0 z-50 flex items-center justify-center px-4"
  >
    <div
      class="absolute inset-0 bg-black/30"
      @click="closeTemplatePicker"
    ></div>
    <div
      class="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
      >
        <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">选择模板</div>
        <button
          type="button"
          class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          @click="closeTemplatePicker"
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

      <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
        <div class="relative">
          <svg
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="templateSearch"
            type="text"
            placeholder="搜索模板（显示名/内部编码）"
            class="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
          />
        </div>
      </div>

      <div class="max-h-[420px] overflow-auto">
        <div
          v-if="templateLoading"
          class="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          加载中…
        </div>
        <div
          v-else-if="templateError"
          class="px-5 py-8 text-center text-sm text-red-600 dark:text-red-400"
        >
          {{ templateError }}
        </div>
        <div v-else>
          <div
            v-if="filteredTemplateItems.length === 0"
            class="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            暂无数据
          </div>
          <div
            v-else
            class="divide-y divide-slate-100 dark:divide-slate-700"
          >
            <div
              v-for="t in filteredTemplateItems"
              :key="t.Kvid"
              class="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="truncate font-medium text-slate-800 dark:text-slate-100">{{
                    t.DisplayName || '未命名模板'
                  }}</span>
                  <span
                    v-if="t.ScopeLabel"
                    class="shrink-0 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  >
                    {{ t.ScopeLabel }}
                  </span>
                </div>
                <div class="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                  {{ t.InternalCode || t.Handler || '' }}
                </div>
              </div>
              <button
                type="button"
                @click="pickTemplate(t)"
                class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                选择
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
