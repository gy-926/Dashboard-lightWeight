<script setup lang="ts">
  const emit = defineEmits<{ navigate: [path: string] }>();
  const goTo = (path: string) => emit('navigate', path);
</script>

<template>
  <section
    class="architecture-section overflow-hidden rounded-[22px] border border-blue-200/60 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-7"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">平台组成</p>
        <h2>模块加载之外，还有完整的平台支撑</h2>
      </div>
      <button
        class="text-link-btn"
        @click="goTo('/system/menu-config')"
      >
        查看菜单编排 <i class="fas fa-arrow-right" />
      </button>
    </div>

    <div class="architecture-flow mt-7">
      <div class="architecture-layer">
        <span class="layer-label">功能配置</span>
        <div><i class="fas fa-database" /> 功能配置</div>
        <div><i class="fas fa-sitemap" /> 菜单编排</div>
        <div><i class="fas fa-user-shield" /> 权限控制</div>
      </div>
      <div class="architecture-connector">
        <span />
        <i class="fas fa-chevron-down" />
        <span />
      </div>
      <div class="architecture-layer architecture-layer-runtime">
        <span class="layer-label">运行环境</span>
        <div><i class="fas fa-download" /> 加载器</div>
        <div><i class="fas fa-code-branch" /> 路由</div>
        <div><i class="fas fa-box-archive" /> 缓存</div>
        <div><i class="fas fa-tower-broadcast" /> 页面桥接</div>
      </div>
      <div class="architecture-connector">
        <span />
        <i class="fas fa-chevron-down" />
        <span />
      </div>
      <div class="architecture-layer">
        <span class="layer-label">页面类型</span>
        <div><i class="fab fa-vuejs" /> Vue UMD</div>
        <div><i class="fas fa-file-code" /> Vue SFC</div>
        <div><i class="fas fa-window-maximize" /> WebView</div>
      </div>
    </div>
  </section>
</template>

<style src="../HomeArchitecture.css"></style>
