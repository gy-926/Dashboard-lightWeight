<script setup lang="ts">
  import { adapters } from '../content';
</script>

<template>
  <section>
    <div class="section-heading mb-5">
      <div>
        <p class="eyebrow">支持的页面类型</p>
        <h2>同一个容器，适配不同技术形态</h2>
      </div>
      <p>不是用一种技术重写所有系统，而是给不同模块提供一致的运行边界。</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <article
        v-for="adapter in adapters"
        :key="adapter.name"
        class="adapter-card rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
      >
        <div class="flex items-start justify-between gap-4">
          <div :class="['adapter-icon', `adapter-icon-${adapter.tone}`]">
            <i :class="adapter.icon" />
          </div>
          <span class="adapter-status">
            <i class="fas fa-circle-check" /> {{ adapter.label }}
          </span>
        </div>
        <h3 class="mt-5 text-lg font-black text-slate-900 dark:text-white">{{ adapter.name }}</h3>
        <p class="mt-2 min-h-[44px] text-sm leading-6 text-slate-500 dark:text-slate-400">
          {{ adapter.description }}
        </p>
        <dl class="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs dark:border-slate-700">
          <div>
            <dt>加载方式</dt>
            <dd>{{ adapter.load }}</dd>
          </div>
          <div>
            <dt>生命周期</dt>
            <dd>{{ adapter.lifecycle }}</dd>
          </div>
          <div>
            <dt>通信方式</dt>
            <dd>{{ adapter.communication }}</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<style src="../HomeAdapters.css"></style>
