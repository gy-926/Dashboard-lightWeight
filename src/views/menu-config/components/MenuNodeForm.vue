<script setup lang="ts">
  import { useMenuConfigContext } from '../context';
  import MenuNodeParameters from './MenuNodeParameters.vue';
  import MenuNodeFields from './MenuNodeFields.vue';
  const { form } = useMenuConfigContext();
</script>

<template>
  <section
    class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden shrink-0"
  >
    <!-- Card header -->
    <div
      class="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
    >
      <svg
        class="w-4 h-4 text-indigo-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <span
        class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
        >基本信息</span
      >
    </div>

    <!-- Body: form fields (left) + param panel (right) -->
    <div class="flex min-h-0">
      <!-- Form fields -->
      <MenuNodeFields />

      <!-- ── Param Config Panel (right side) ── -->
      <MenuNodeParameters />
    </div>
  </section>
</template>
