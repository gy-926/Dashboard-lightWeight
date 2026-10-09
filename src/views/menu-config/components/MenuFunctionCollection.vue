<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const {
    removeFunction,
    startFnEdit,
    commitFnEdit,
    formatFnParameters,
    openFnParamEditor,
    openRelatePicker,
    functions,
    page,
    totalPages,
    canRelateFunctions,
  } = useMenuConfigContext();
</script>

<template>
  <div class="flex-1 min-h-[280px] flex flex-col">
    <!-- ── Function Collection Card ── -->
    <section
      class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col"
    >
      <div
        class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-4 h-4 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span
            class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
            >功能集合</span
          >
          <span
            class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 font-medium"
            >{{ functions.length }}</span
          >
        </div>
        <button
          type="button"
          @click="openRelatePicker"
          :disabled="!canRelateFunctions"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
          :class="
            canRelateFunctions
              ? 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              : 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed'
          "
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
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          关联
        </button>
      </div>

      <!-- Table header：固定不滚动 -->
      <div class="overflow-x-auto shrink-0">
        <div class="min-w-[1000px]">
          <div
            class="fn-grid text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50"
          >
            <span class="flex items-center gap-1">
              显示名称
              <span class="text-slate-400 dark:text-slate-400 font-normal normal-case"
                >【原功能项名称】</span
              >
              <svg
                class="w-3 h-3 text-slate-400 dark:text-slate-400 ml-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            </span>
            <span class="flex items-center gap-1"
              >排序号
              <svg
                class="w-3 h-3 text-slate-400 dark:text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 15l7-7 7 7"
                /></svg
            ></span>
            <span>图标</span>
            <span>参数配置</span>
            <span>功能备注</span>
            <span>执行入口</span>
            <span class="text-right pr-4">操作</span>
          </div>
        </div>
      </div>

      <!-- Table body：内部滚动 -->
      <div class="overflow-y-auto overflow-x-auto flex-1 min-h-0">
        <div class="min-w-[1000px]">
          <div class="divide-y divide-slate-100 dark:divide-slate-700">
            <div
              v-for="(fn, idx) in functions"
              :key="fn.Kvid"
              class="fn-grid px-4 py-3 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group items-center"
            >
              <div class="pr-2">
                <div
                  class="fn-cell"
                  @dblclick="startFnEdit(fn, 'name')"
                >
                  <template v-if="fn.__editing !== 'name'">
                    <span class="block truncate text-slate-700 dark:text-slate-200">
                      {{ fn.DisplayName || '—' }}
                    </span>
                    <span
                      v-if="fn.FunctionName && fn.FunctionName !== fn.DisplayName"
                      class="block truncate text-xs text-slate-400 dark:text-slate-500 mt-0.5"
                    >
                      {{ fn.FunctionName }}
                    </span>
                  </template>
                  <input
                    v-else
                    v-model="fn.DisplayName"
                    type="text"
                    placeholder="显示名称"
                    class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    @blur="commitFnEdit(fn)"
                    @keydown.enter.prevent="commitFnEdit(fn)"
                  />
                </div>
              </div>
              <div class="text-center">
                <div
                  class="fn-cell flex items-center justify-center"
                  @dblclick="startFnEdit(fn, 'sort')"
                >
                  <span
                    v-if="fn.__editing !== 'sort'"
                    class="block w-20 text-center text-slate-600 dark:text-slate-300"
                  >
                    {{ fn.SortId ?? 0 }}
                  </span>
                  <input
                    v-else
                    v-model.number="fn.SortId"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-20 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    @blur="commitFnEdit(fn)"
                    @keydown.enter.prevent="commitFnEdit(fn)"
                  />
                </div>
              </div>
              <div class="flex items-center justify-center">
                <div
                  class="fn-cell w-full flex items-center justify-center"
                  @dblclick="startFnEdit(fn, 'icon')"
                >
                  <div
                    v-if="fn.__editing !== 'icon'"
                    class="flex items-center gap-2 w-full justify-center"
                  >
                    <span class="w-28 truncate text-slate-600 dark:text-slate-300">{{
                      fn.Icon || '—'
                    }}</span>
                    <i :class="fn.Icon || ''"></i>
                  </div>
                  <div
                    v-else
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="fn.Icon"
                      type="text"
                      placeholder="Icon"
                      class="w-28 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                      @blur="commitFnEdit(fn)"
                      @keydown.enter.prevent="commitFnEdit(fn)"
                    />
                    <i :class="fn.Icon || ''"></i>
                  </div>
                </div>
              </div>
              <div class="pr-2">
                <div class="flex items-center gap-2">
                  <input
                    :value="formatFnParameters(fn.Parameters)"
                    type="text"
                    readonly
                    class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 cursor-not-allowed focus:outline-none"
                    placeholder="—"
                  />
                  <button
                    type="button"
                    @click="openFnParamEditor(fn)"
                    class="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="pr-2">
                <div
                  class="fn-cell"
                  @dblclick="startFnEdit(fn, 'remark')"
                >
                  <span
                    v-if="fn.__editing !== 'remark'"
                    class="block truncate text-slate-600 dark:text-slate-300"
                  >
                    {{ fn.Remark || '—' }}
                  </span>
                  <input
                    v-else
                    v-model="fn.Remark"
                    type="text"
                    placeholder="备注"
                    class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    @blur="commitFnEdit(fn)"
                    @keydown.enter.prevent="commitFnEdit(fn)"
                  />
                </div>
              </div>
              <div>
                <span
                  class="block truncate text-xs text-slate-500 dark:text-slate-400 font-mono"
                  :title="fn.Handler || ''"
                  >{{ fn.Handler || '—' }}</span
                >
              </div>
              <div class="flex justify-end items-center pr-4">
                <button
                  @click="removeFunction(idx)"
                  class="admin-list-action admin-list-action-danger px-2"
                  title="删除"
                  :aria-label="`删除 ${fn.DisplayName || fn.Kvid}`"
                >
                  <i class="fas fa-trash-can" />删除
                </button>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="functions.length === 0"
              class="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-400"
            >
              <svg
                class="w-10 h-10 mb-2 text-slate-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span class="text-xs">没有数据</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        class="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
      >
        <div class="flex items-center gap-2">
          <button
            class="pager-btn"
            :disabled="page <= 1"
            @click="page = 1"
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
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            class="pager-btn"
            :disabled="page <= 1"
            @click="page--"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span>第</span>
            <input
              v-model.number="page"
              type="number"
              min="1"
              class="w-10 text-center rounded border border-slate-200 dark:border-slate-700 py-0.5 text-xs focus:outline-none focus:border-indigo-400"
            />
            <span>页，共 {{ totalPages }} 页</span>
          </div>
          <button
            class="pager-btn"
            :disabled="page >= totalPages"
            @click="page++"
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <button
            class="pager-btn"
            :disabled="page >= totalPages"
            @click="page = totalPages"
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
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
          <button class="pager-btn">
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        <span class="text-xs text-slate-400 dark:text-slate-400">{{
          functions.length === 0
            ? '没有数据'
            : `共
                  ${functions.length} 条`
        }}</span>
      </div>
    </section>
  </div>
</template>
