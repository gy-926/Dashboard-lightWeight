<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { runtimeFlow } from '../content';
  const activeFlowStep = ref(0);
  const currentFlow = computed(() => runtimeFlow[activeFlowStep.value]);
</script>

<template>
  <section
    class="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-7"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">模块加载流程</p>
        <h2>一次远程模块如何进入工作台</h2>
      </div>
      <p>从 URL 到可交互页面，加载链路中的每一步都由宿主统一管理。</p>
    </div>

    <div class="mt-7 grid gap-5 lg:grid-cols-[1fr_.82fr]">
      <div class="grid gap-3 sm:grid-cols-2">
        <button
          v-for="(step, index) in runtimeFlow"
          :key="step.index"
          class="flow-step text-left"
          :class="{ 'flow-step-active': activeFlowStep === index }"
          @click="activeFlowStep = index"
        >
          <span class="flow-step-index">{{ step.index }}</span>
          <span class="flow-step-icon"><i :class="step.icon" /></span>
          <span>
            <strong>{{ step.title }}</strong>
            <small>{{ step.subtitle }}</small>
          </span>
          <i class="fas fa-chevron-right ml-auto text-[10px] text-slate-300" />
        </button>
      </div>

      <div class="flow-detail">
        <div class="flex items-center justify-between">
          <span
            class="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300"
          >
            Step {{ currentFlow.index }}
          </span>
          <i :class="[currentFlow.icon, 'text-slate-300 dark:text-slate-600']" />
        </div>
        <h3>{{ currentFlow.title }}</h3>
        <p>{{ currentFlow.detail }}</p>
        <div class="flow-code">
          <span class="text-violet-400">runtime</span>
          <span class="text-slate-500">.</span>
          <span class="text-cyan-400">{{ currentFlow.code }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style src="../HomeModuleFlow.css"></style>
