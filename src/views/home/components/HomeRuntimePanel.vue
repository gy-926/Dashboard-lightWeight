<script setup lang="ts">
  import { useRuntimeOverview } from '../useRuntimeOverview';
  const {
    remoteLibraries,
    successfulLibraries,
    registeredComponentCount,
    runtimeMetrics,
    statusLabel,
    progressPercent,
    hasError,
  } = useRuntimeOverview();
  const emit = defineEmits<{ navigate: [path: string] }>();
  const goTo = (path: string) => emit('navigate', path);
</script>

<template>
  <div class="runtime-panel mx-auto w-full max-w-[520px] lg:ml-auto">
    <div class="runtime-panel-header">
      <div class="flex items-center gap-2">
        <span class="window-dot bg-rose-400" />
        <span class="window-dot bg-amber-400" />
        <span class="window-dot bg-emerald-400" />
      </div>
      <div class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        实时运行状态
      </div>
    </div>

    <div class="p-5 sm:p-6">
      <div
        class="flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800"
      >
        <div>
          <p class="font-mono text-[11px] text-primary dark:text-cyan-400">
            $ gavinyinhub runtime inspect
          </p>
          <p class="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">模块注册概览</p>
        </div>
        <span
          class="rounded-full border px-2.5 py-1 text-[10px] font-bold"
          :class="
            hasError
              ? 'border-red-300 text-red-600 dark:text-red-300'
              : 'border-emerald-300 text-emerald-700 dark:text-emerald-300'
          "
        >
          {{ statusLabel }}
        </span>
      </div>

      <div class="runtime-log mt-5 space-y-3 font-mono text-[11px]">
        <div class="log-row">
          <span class="text-slate-400 dark:text-slate-600">01</span>
          <span class="text-blue-600 dark:text-blue-300">运行环境</span>
          <span class="text-slate-600 dark:text-slate-300">已连接共享的 Vue 3 环境</span>
          <span class="ml-auto text-emerald-600 dark:text-emerald-400">正常</span>
        </div>
        <div class="log-row">
          <span class="text-slate-400 dark:text-slate-600">02</span>
          <span class="text-violet-600 dark:text-violet-300">组件库</span>
          <span class="text-slate-600 dark:text-slate-300"
            >{{ remoteLibraries.length }} 个远程来源</span
          >
          <span class="ml-auto text-sky-600 dark:text-sky-400">实时</span>
        </div>
        <div class="log-row">
          <span class="text-slate-400 dark:text-slate-600">03</span>
          <span class="text-amber-600 dark:text-amber-300">组件注册</span>
          <span class="text-slate-600 dark:text-slate-300"
            >{{ registeredComponentCount }} 个组件</span
          >
          <span class="ml-auto text-emerald-600 dark:text-emerald-400">{{
            registeredComponentCount > 0 ? '已注册' : '待注册'
          }}</span>
        </div>
        <div class="log-row">
          <span class="text-slate-400 dark:text-slate-600">04</span>
          <span class="text-cyan-600 dark:text-cyan-300">页面类型</span>
          <span class="text-slate-600 dark:text-slate-300">UMD · Vue · WebView</span>
          <span class="ml-auto text-emerald-600 dark:text-emerald-400">正常</span>
        </div>
      </div>

      <div
        class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/80"
      >
        <div
          class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500"
        >
          <span>模块接入进度</span>
          <span>{{ successfulLibraries.length }}/{{ remoteLibraries.length || 0 }}</span>
        </div>
        <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            class="runtime-progress h-full rounded-full"
            :style="{
              width: `${progressPercent}%`,
            }"
          />
        </div>
      </div>

      <button
        class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
        @click="goTo('/umd-management')"
      >
        查看 UMD 模块
        <i class="fas fa-arrow-up-right-from-square text-[10px]" />
      </button>
    </div>
  </div>
</template>

<style src="../HomeRuntimePanel.css"></style>
