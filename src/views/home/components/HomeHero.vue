<script setup lang="ts">
  import HomeRuntimePanel from './HomeRuntimePanel.vue';
  defineProps<{ systemName: string }>();
  const emit = defineEmits<{ navigate: [path: string] }>();
  const goTo = (path: string) => emit('navigate', path);
</script>

<template>
  <section class="hero-shell relative overflow-hidden rounded-[24px] text-white">
    <div class="hero-grid absolute inset-0" />
    <div class="hero-glow hero-glow-blue" />
    <div class="hero-glow hero-glow-violet" />

    <div
      class="relative grid min-h-[510px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:px-14 lg:py-14"
    >
      <div class="max-w-2xl">
        <div
          class="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300"
        >
          <span class="runtime-dot" />
          模块化工作台
        </div>

        <p class="mb-3 text-sm font-semibold tracking-wide text-blue-300">{{ systemName }}</p>
        <h1
          class="max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[58px]"
        >
          在运行时连接
          <span class="hero-title-accent">不同前端世界</span>
        </h1>
        <p class="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-[17px]">
          一个以 UMD
          动态加载为核心的模块化前端容器。无需重新构建宿主应用，即可发现、注册和运行远程组件，并统一承载
          Vue SFC、WebView 与存量系统。
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <button
            class="hero-primary-btn"
            @click="goTo('/umd-showcase')"
          >
            <i class="fas fa-play" />
            运行 UMD 示例
            <i class="fas fa-arrow-right text-xs" />
          </button>
          <button
            class="hero-secondary-btn"
            @click="goTo('/umd-management')"
          >
            <i class="fas fa-flask" />
            打开模块管理
          </button>
        </div>

        <div class="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
          <span class="inline-flex items-center gap-2">
            <i class="fas fa-circle-check text-emerald-400" /> 模块加载
          </span>
          <span class="inline-flex items-center gap-2">
            <i class="fas fa-circle-check text-emerald-400" /> 组件发现
          </span>
          <span class="inline-flex items-center gap-2">
            <i class="fas fa-circle-check text-emerald-400" /> 页面生命周期
          </span>
        </div>
      </div>

      <HomeRuntimePanel @navigate="goTo" />
    </div>
  </section>
</template>

<style src="../HomeHero.css"></style>
