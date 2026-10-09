<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const {
    addParam,
    confirmAddParam,
    removeParam,
    clearParams,
    form,
    params,
    showParamForm,
    newParam,
  } = useMenuConfigContext();
</script>

<template>
  <div class="w-[420px] shrink-0 border-l border-slate-100 dark:border-slate-700/50 flex flex-col">
    <!-- Param header -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
    >
      <div class="flex items-center gap-2">
        <svg
          class="w-4 h-4 text-amber-500 dark:text-amber-400"
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
        <span
          class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
          >参数配置</span
        >
      </div>
      <div class="flex items-center gap-1">
        <button
          @click="addParam"
          class="w-6 h-6 flex items-center justify-center rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
        <button
          @click="clearParams"
          class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700 transition-colors"
        >
          <svg
            class="w-3 h-3"
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

    <!-- Param table header -->
    <div
      class="grid grid-cols-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 text-xs font-medium text-slate-500 dark:text-slate-400"
    >
      <span class="flex items-center gap-1">
        名称
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
          />
        </svg>
      </span>
      <span>值</span>
    </div>

    <!-- Param rows -->
    <div class="flex-1 divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto">
      <div
        v-for="(param, idx) in params"
        :key="idx"
        class="grid grid-cols-2 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div class="px-3 py-2 border-r border-slate-100 dark:border-slate-700/50">
          <input
            v-model="param.name"
            type="text"
            placeholder="参数名"
            class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
          />
        </div>
        <div class="px-3 py-2 flex items-center gap-2">
          <input
            v-model="param.value"
            type="text"
            placeholder="参数值"
            class="min-w-0 flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
          />
          <button
            @click="removeParam(idx)"
            class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
            title="删除"
          >
            <svg
              class="w-3 h-3"
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
      <div
        v-if="params.length === 0"
        class="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-400"
      >
        暂无参数
      </div>
    </div>

    <!-- Add param inline form -->
    <div
      v-if="showParamForm"
      class="border-t border-dashed border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50"
    >
      <div class="flex gap-2 mb-2">
        <input
          v-model="newParam.name"
          type="text"
          placeholder="参数名"
          class="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
        />
        <input
          v-model="newParam.value"
          type="text"
          placeholder="参数值"
          class="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
        />
      </div>
      <div class="flex gap-2">
        <button
          @click="confirmAddParam"
          class="flex-1 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          确认
        </button>
        <button
          @click="showParamForm = false"
          class="flex-1 py-1 text-xs rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors"
        >
          取消
        </button>
      </div>
    </div>
  </div>
</template>
