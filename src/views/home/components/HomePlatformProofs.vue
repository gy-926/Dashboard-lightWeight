<script setup lang="ts">
  import { platformProofs } from '../content';
</script>

<template>
  <section>
    <div class="section-heading mb-5">
      <div>
        <p class="eyebrow">平台能力</p>
        <h2>把技术能力放进真实使用场景</h2>
      </div>
      <p>这些配套能力让独立模块能够在同一个工作台中运行和管理。</p>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <article
        v-for="proof in platformProofs"
        :key="proof.title"
        class="proof-card rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
      >
        <i :class="proof.icon" />
        <h3>{{ proof.title }}</h3>
        <p>{{ proof.text }}</p>
      </article>
    </div>
  </section>
</template>

<style src="../HomePlatformProofs.css"></style>
