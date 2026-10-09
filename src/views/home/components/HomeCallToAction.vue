<script setup lang="ts">
  const emit = defineEmits<{ navigate: [path: string] }>();
  const goTo = (path: string) => emit('navigate', path);
</script>

<template>
  <section
    class="final-cta relative overflow-hidden rounded-[22px] px-6 py-8 text-white sm:px-9 sm:py-10"
  >
    <div class="final-cta-grid absolute inset-0" />
    <div class="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">亲自体验</p>
        <h2 class="mt-2 text-2xl font-black sm:text-3xl">不要只看介绍，直接加载一个 UMD 包</h2>
        <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
          输入远程地址或选择本地 UMD 文件，查看模块信息与组件清单，再将组件注册到功能中心。
        </p>
      </div>
      <button
        class="cta-light-btn"
        @click="goTo('/umd-management')"
      >
        进入模块管理
        <i class="fas fa-arrow-right" />
      </button>
    </div>
  </section>
</template>

<style src="../HomeCallToAction.css"></style>
