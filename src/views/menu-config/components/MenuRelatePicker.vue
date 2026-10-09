<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const {
    toggleRelateChecked,
    filteredRelateItems,
    loadRelateItems,
    onRelateScroll,
    closeRelatePicker,
    confirmRelatePicker,
    relatePickerOpen,
    relateLoading,
    relateLoadingMore,
    relateError,
    relateSearch,
    relateItems,
    relateScrollEl,
    relateHasMore,
    relateChecked,
    relateCheckedCount,
    relateTotalDisplay,
  } = useMenuConfigContext();
</script>

<template>
  <div
    v-if="relatePickerOpen"
    class="fixed inset-0 z-[55] flex items-center justify-center px-4"
  >
    <div
      class="absolute inset-0 bg-black/30"
      @click="closeRelatePicker"
    ></div>
    <div
      class="relative w-full max-w-4xl rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
      >
        <div class="flex items-center gap-2">
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">关联功能</div>
          <span
            class="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium"
            >{{ relateTotalDisplay }}</span
          >
        </div>
        <button
          type="button"
          class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          @click="closeRelatePicker"
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
        <div class="flex items-center gap-3">
          <div class="relative flex-1">
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
              v-model="relateSearch"
              type="text"
              placeholder="搜索功能（显示名/内部编码/Handler）"
              class="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 shrink-0">
            已选 {{ relateCheckedCount }}
          </div>
          <button
            type="button"
            @click="loadRelateItems(true)"
            class="px-3 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            刷新
          </button>
        </div>
      </div>

      <div
        ref="relateScrollEl"
        class="max-h-[520px] overflow-auto"
        @scroll="onRelateScroll"
      >
        <div
          v-if="relateLoading"
          class="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          加载中…
        </div>
        <div
          v-else-if="relateError"
          class="px-5 py-10 text-center text-sm text-red-600 dark:text-red-400"
        >
          {{ relateError }}
        </div>
        <div v-else>
          <div
            v-if="filteredRelateItems.length === 0"
            class="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            暂无数据
          </div>
          <div
            v-else
            class="divide-y divide-slate-100 dark:divide-slate-700"
          >
            <div
              v-for="t in filteredRelateItems"
              :key="t.Kvid"
              class="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div class="min-w-0 flex items-center gap-3">
                <input
                  type="checkbox"
                  class="w-4 h-4 accent-indigo-600"
                  :checked="Boolean(relateChecked[t.Kvid])"
                  @change="toggleRelateChecked(t.Kvid, $event, t)"
                />
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="truncate font-medium text-slate-800 dark:text-slate-100">{{
                      t.DisplayName || '未命名功能'
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
              </div>
              <div class="shrink-0 text-xs text-slate-400 dark:text-slate-400">
                Kvid: {{ t.Kvid }}
              </div>
            </div>
          </div>
          <div
            v-if="relateLoadingMore"
            class="px-5 py-4 text-center text-xs text-slate-500 dark:text-slate-400"
          >
            加载更多…
          </div>
          <div
            v-else-if="!relateHasMore && relateItems.length > 0"
            class="px-5 py-4 text-center text-xs text-slate-400 dark:text-slate-400"
          >
            没有更多了
          </div>
        </div>
      </div>

      <div
        class="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-2 bg-white dark:bg-slate-800"
      >
        <button
          type="button"
          @click="closeRelatePicker"
          class="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
        >
          取消
        </button>
        <button
          type="button"
          @click="confirmRelatePicker"
          class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>
