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
</script>

<template>
  <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
    <article
      v-for="metric in runtimeMetrics"
      :key="metric.label"
      class="metric-card rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 sm:p-5"
    >
      <strong class="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
        {{ metric.value }}
      </strong>
      <p class="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">{{ metric.label }}</p>
      <p class="mt-1 text-[11px] leading-4 text-slate-400">{{ metric.detail }}</p>
    </article>
  </section>
</template>

<style src="../HomeMetrics.css"></style>
