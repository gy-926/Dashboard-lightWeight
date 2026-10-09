<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { dashboardProfiles } from '../content';
  const activeDashboardIndex = ref(0);
  const currentDashboard = computed(() => dashboardProfiles[activeDashboardIndex.value]);
  const emit = defineEmits<{ navigate: [path: string] }>();
  const goTo = (path: string) => emit('navigate', path);
</script>

<template>
  <section
    class="dashboard-composer overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-7"
  >
    <div class="section-heading">
      <div>
        <p class="eyebrow">工作台组合示意</p>
        <h2>切换菜单编码，展示不同工作台</h2>
      </div>
      <p>框架保持不变，菜单编码决定导航树、功能模块与权限范围，让一套运行时承载多个业务工作台。</p>
    </div>

    <div class="dashboard-composer-grid mt-7">
      <div class="dashboard-profile-list">
        <div class="composer-label">
          <span>菜单方案</span>
          <span>选择配置示意</span>
        </div>
        <button
          v-for="(profile, index) in dashboardProfiles"
          :key="profile.code"
          class="dashboard-profile"
          :class="{ 'dashboard-profile-active': activeDashboardIndex === index }"
          @click="activeDashboardIndex = index"
        >
          <span :class="['dashboard-profile-icon', `dashboard-profile-icon-${profile.tone}`]">
            <i :class="profile.icon" />
          </span>
          <span class="min-w-0 flex-1">
            <strong>{{ profile.name }}</strong>
            <small>{{ profile.description }}</small>
          </span>
          <i class="fas fa-chevron-right dashboard-profile-arrow" />
        </button>

        <div class="internal-code-config">
          <span>uiGlobalConfig.InternalCode</span>
          <code>{{ currentDashboard.code }}</code>
        </div>
      </div>

      <div class="dashboard-switch-arrow">
        <span><i class="fas fa-arrow-right-arrow-left" /></span>
        <small>切换编码</small>
      </div>

      <div class="dashboard-preview">
        <div class="dashboard-preview-bar">
          <div class="flex items-center gap-1.5">
            <span class="window-dot bg-rose-400" />
            <span class="window-dot bg-amber-400" />
            <span class="window-dot bg-emerald-400" />
          </div>
          <span>菜单预览</span>
          <span class="dashboard-preview-status">就绪</span>
        </div>
        <div class="dashboard-preview-body">
          <aside>
            <div class="dashboard-preview-brand">
              <span :class="`dashboard-profile-icon-${currentDashboard.tone}`">
                <i :class="currentDashboard.icon" />
              </span>
              <strong>{{ currentDashboard.name }}</strong>
            </div>
            <div class="dashboard-preview-menu">
              <span
                v-for="(menu, index) in currentDashboard.menus"
                :key="menu"
                :class="{ active: index === 0 }"
              >
                <i :class="index === 0 ? 'fas fa-grid-2' : 'far fa-circle'" />
                {{ menu }}
              </span>
            </div>
          </aside>
          <main>
            <div class="dashboard-preview-heading">
              <div>
                <small>工作台 / 概览</small>
                <strong>{{ currentDashboard.name }}</strong>
              </div>
              <code>{{ currentDashboard.code }}</code>
            </div>
            <div class="dashboard-widget-grid">
              <article
                v-for="(widget, index) in currentDashboard.widgets"
                :key="widget"
                :class="{ 'dashboard-widget-wide': index === 2 }"
              >
                <span>{{ widget }}</span>
                <div class="dashboard-widget-chart">
                  <i
                    v-for="bar in 7"
                    :key="bar"
                    :style="{ height: `${22 + ((bar * 13 + index * 9) % 55)}%` }"
                  />
                </div>
              </article>
            </div>
          </main>
        </div>
      </div>
    </div>

    <div class="dashboard-composer-footer">
      <div>
        <span><i class="fas fa-check" /> 同一套框架</span>
        <span><i class="fas fa-check" /> 独立菜单树</span>
        <span><i class="fas fa-check" /> 权限同步过滤</span>
        <span><i class="fas fa-check" /> 无需重新构建</span>
      </div>
      <button
        class="text-link-btn"
        @click="goTo('/system/menu-config')"
      >
        配置工作台 <i class="fas fa-arrow-right" />
      </button>
    </div>
  </section>
</template>

<style src="../HomeWorkspacePreview.css"></style>
