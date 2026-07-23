<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useMenuStore } from '@/layouts/modules/global-menu/store';
  import { normalizeBrandText } from '@/utils/brand';
  import { remoteLibraries } from '@/utils/remoteComponentLoader';

  defineOptions({ name: 'home' });

  const router = useRouter();
  const menuStore = useMenuStore();
  const activeFlowStep = ref(0);
  const activeDashboardIndex = ref(0);
  const isDark = computed(() => menuStore.theme.darkMode);

  const systemName = computed(
    () => normalizeBrandText((window as any).uiGlobalConfig?.DisplayName, 'GavinYinHub Runtime')
  );

  const successfulLibraries = computed(
    () => remoteLibraries.value.filter(item => item.status === 'success')
  );

  const registeredComponentCount = computed(() =>
    successfulLibraries.value.reduce((total, item) => {
      const detectedCount =
        item.registeredCount ??
        item.componentsDetailed?.length ??
        item.componentKeys?.filter(
          key => !['default', 'install', 'manifest', 'componentsMap', 'componentsDetailed'].includes(key)
        ).length ??
        0;
      return total + detectedCount;
    }, 0)
  );

  const runtimeMetrics = computed(() => [
    {
      value: String(remoteLibraries.value.length),
      label: '远程组件库',
      detail: `${successfulLibraries.value.length} 个加载成功`,
    },
    {
      value: String(registeredComponentCount.value),
      label: '已注册组件',
      detail: '来自实时 Runtime 状态',
    },
    {
      value: '3',
      label: '运行形态',
      detail: 'UMD · Vue SFC · WebView',
    },
    {
      value: '3',
      label: '布局模式',
      detail: 'Side · Top · Mixed',
    },
  ]);

  const runtimeFlow = [
    {
      index: '01',
      title: 'Resolve source',
      subtitle: '定位模块来源',
      detail: '从功能配置解析 UMD 地址、导出名称和目标组件，无需重新构建宿主应用。',
      code: 'source_url → globalName → component',
      icon: 'fas fa-link',
    },
    {
      index: '02',
      title: 'Inject script',
      subtitle: '运行时加载',
      detail: '按需注入远程脚本，共享宿主 Vue Runtime，并跟踪 pending、loading、success、error 状态。',
      code: 'loadUMDComponent(sourceUrl)',
      icon: 'fas fa-bolt',
    },
    {
      index: '03',
      title: 'Read manifest',
      subtitle: '发现模块能力',
      detail: '读取 Manifest、组件清单和描述信息，将远程模块转化为可管理的功能记录。',
      code: 'manifest.componentsDetailed',
      icon: 'fas fa-file-code',
    },
    {
      index: '04',
      title: 'Mount & manage',
      subtitle: '注册与生命周期',
      detail: '动态注册组件，并接入标签页、路由、缓存、刷新和销毁等统一生命周期。',
      code: 'app.component() → route → cache',
      icon: 'fas fa-cubes-stacked',
    },
  ];

  const adapters = [
    {
      name: 'Vue UMD',
      label: '核心能力',
      icon: 'fab fa-vuejs',
      tone: 'emerald',
      load: 'Script Runtime',
      lifecycle: '动态注册 / 卸载',
      communication: 'Props / Events / Expose',
      description: '无需重新打包主应用，运行时发现并注册远程组件库。',
    },
    {
      name: 'Vue SFC',
      label: '动态适配',
      icon: 'fas fa-file-code',
      tone: 'blue',
      load: 'Remote Source',
      lifecycle: '编译 / 缓存',
      communication: 'Route Query / Context',
      description: '加载远程 Vue 单文件组件，并复用组件缓存与页面激活机制。',
    },
    {
      name: 'WebView / Legacy',
      label: '存量接入',
      icon: 'fas fa-window-restore',
      tone: 'amber',
      load: 'Iframe / Bridge',
      lifecycle: '挂载 / 显隐',
      communication: 'Bridge / Event Bus',
      description: '以 WebView 和 Bridge 承载传统页面及 ExtJS 等存量系统。',
    },
  ];

  const platformProofs = [
    {
      icon: 'fas fa-route',
      title: '动态菜单与路由',
      text: '后端配置实时生成路由树，模块接入后即可编排进工作空间。',
    },
    {
      icon: 'fas fa-table-columns',
      title: '多布局适配',
      text: '侧边、顶部、混合菜单共享同一份动态导航数据。',
    },
    {
      icon: 'fas fa-layer-group',
      title: '标签与缓存',
      text: '多页面标签、按需缓存、刷新和销毁形成完整运行周期。',
    },
    {
      icon: 'fas fa-user-shield',
      title: '权限链路',
      text: '用户、角色、功能与菜单可见性保持一致。',
    },
  ];

  const currentFlow = computed(() => runtimeFlow[activeFlowStep.value]);
  const dashboardProfiles = [
    {
      code: 'umdDashboard',
      name: 'Runtime Console',
      description: '远程模块管理与运行状态',
      icon: 'fas fa-cubes-stacked',
      tone: 'blue',
      menus: ['运行总览', 'UMD 模块', '菜单配置', '系统功能'],
      widgets: ['Runtime health', 'Module registry', 'Activity stream'],
    },
    {
      code: 'operationsDashboard',
      name: 'Operations Center',
      description: '业务运营与任务协同',
      icon: 'fas fa-chart-line',
      tone: 'emerald',
      menus: ['运营总览', '客户中心', '订单任务', '数据报表'],
      widgets: ['Business metrics', 'Task queue', 'Live orders'],
    },
    {
      code: 'analyticsDashboard',
      name: 'Analytics Workspace',
      description: '分析模型与数据洞察',
      icon: 'fas fa-chart-pie',
      tone: 'violet',
      menus: ['指标看板', '分析模型', '数据资产', '报告中心'],
      widgets: ['Metric board', 'Model output', 'Insight feed'],
    },
  ];
  const currentDashboard = computed(() => dashboardProfiles[activeDashboardIndex.value]);

  function goTo(path: string) {
    router.push(path);
  }
</script>

<template>
  <div
    class="showcase-page space-y-5 pb-3 md:space-y-7"
    :class="{ 'home-dark': isDark }"
  >
    <section class="hero-shell relative overflow-hidden rounded-[24px] text-white">
      <div class="hero-grid absolute inset-0" />
      <div class="hero-glow hero-glow-blue" />
      <div class="hero-glow hero-glow-violet" />

      <div class="relative grid min-h-[510px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:px-14 lg:py-14">
        <div class="max-w-2xl">
          <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            <span class="runtime-dot" />
            Runtime module platform
          </div>

          <p class="mb-3 text-sm font-semibold tracking-wide text-blue-300">{{ systemName }}</p>
          <h1 class="max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[58px]">
            在运行时连接
            <span class="hero-title-accent">不同前端世界</span>
          </h1>
          <p class="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-[17px]">
            一个以 UMD 动态加载为核心的模块化前端容器。无需重新构建宿主应用，即可发现、注册和运行远程组件，并统一承载 Vue SFC、WebView 与存量系统。
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
              打开 Runtime Lab
            </button>
          </div>

          <div class="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
            <span class="inline-flex items-center gap-2">
              <i class="fas fa-circle-check text-emerald-400" /> Runtime loading
            </span>
            <span class="inline-flex items-center gap-2">
              <i class="fas fa-circle-check text-emerald-400" /> Manifest discovery
            </span>
            <span class="inline-flex items-center gap-2">
              <i class="fas fa-circle-check text-emerald-400" /> Lifecycle control
            </span>
          </div>
        </div>

        <div class="runtime-panel mx-auto w-full max-w-[520px] lg:ml-auto">
          <div class="runtime-panel-header">
            <div class="flex items-center gap-2">
              <span class="window-dot bg-rose-400" />
              <span class="window-dot bg-amber-400" />
              <span class="window-dot bg-emerald-400" />
            </div>
            <div class="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              live runtime
            </div>
          </div>

          <div class="p-5 sm:p-6">
            <div class="flex items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
              <div>
                <p class="font-mono text-[11px] text-primary dark:text-cyan-400">$ gavinyinhub runtime inspect</p>
                <p class="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Module registry snapshot</p>
              </div>
              <span class="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
                READY
              </span>
            </div>

            <div class="runtime-log mt-5 space-y-3 font-mono text-[11px]">
              <div class="log-row">
                <span class="text-slate-400 dark:text-slate-600">01</span>
                <span class="text-blue-600 dark:text-blue-300">runtime</span>
                <span class="text-slate-600 dark:text-slate-300">Vue 3 shared context detected</span>
                <span class="ml-auto text-emerald-600 dark:text-emerald-400">OK</span>
              </div>
              <div class="log-row">
                <span class="text-slate-400 dark:text-slate-600">02</span>
                <span class="text-violet-600 dark:text-violet-300">libraries</span>
                <span class="text-slate-600 dark:text-slate-300">{{ remoteLibraries.length }} remote source(s)</span>
                <span class="ml-auto text-sky-600 dark:text-sky-400">LIVE</span>
              </div>
              <div class="log-row">
                <span class="text-slate-400 dark:text-slate-600">03</span>
                <span class="text-amber-600 dark:text-amber-300">registry</span>
                <span class="text-slate-600 dark:text-slate-300">{{ registeredComponentCount }} component(s)</span>
                <span class="ml-auto text-emerald-600 dark:text-emerald-400">OK</span>
              </div>
              <div class="log-row">
                <span class="text-slate-400 dark:text-slate-600">04</span>
                <span class="text-cyan-600 dark:text-cyan-300">adapters</span>
                <span class="text-slate-600 dark:text-slate-300">umd · vue · webview</span>
                <span class="ml-auto text-emerald-600 dark:text-emerald-400">OK</span>
              </div>
            </div>

            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/80">
              <div class="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                <span>Registration pipeline</span>
                <span>{{ successfulLibraries.length }}/{{ remoteLibraries.length || 0 }}</span>
              </div>
              <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  class="runtime-progress h-full rounded-full"
                  :style="{
                    width: remoteLibraries.length
                      ? `${Math.max(8, (successfulLibraries.length / remoteLibraries.length) * 100)}%`
                      : '8%',
                  }"
                />
              </div>
            </div>

            <button
              class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-primary-bg hover:text-primary dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
              @click="goTo('/umd-management')"
            >
              Inspect a UMD package
              <i class="fas fa-arrow-up-right-from-square text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </section>

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

    <section class="rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-7">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Runtime pipeline</p>
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
            <span class="rounded-lg bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-300">
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

    <section>
      <div class="section-heading mb-5">
        <div>
          <p class="eyebrow">Adapter matrix</p>
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
            <div><dt>加载方式</dt><dd>{{ adapter.load }}</dd></div>
            <div><dt>生命周期</dt><dd>{{ adapter.lifecycle }}</dd></div>
            <div><dt>通信方式</dt><dd>{{ adapter.communication }}</dd></div>
          </dl>
        </article>
      </div>
    </section>

    <section class="architecture-section overflow-hidden rounded-[22px] border border-blue-200/60 bg-blue-50/60 p-5 dark:border-blue-900/50 dark:bg-blue-950/20 sm:p-7">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Architecture</p>
          <h2>模块加载之外，还有完整的平台支撑</h2>
        </div>
        <button class="text-link-btn" @click="goTo('/system/menu-config')">
          查看菜单编排 <i class="fas fa-arrow-right" />
        </button>
      </div>

      <div class="architecture-flow mt-7">
        <div class="architecture-layer">
          <span class="layer-label">CONFIG</span>
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
          <span class="layer-label">RUNTIME</span>
          <div><i class="fas fa-download" /> Loader</div>
          <div><i class="fas fa-code-branch" /> Router</div>
          <div><i class="fas fa-box-archive" /> Cache</div>
          <div><i class="fas fa-tower-broadcast" /> Bridge</div>
        </div>
        <div class="architecture-connector">
          <span />
          <i class="fas fa-chevron-down" />
          <span />
        </div>
        <div class="architecture-layer">
          <span class="layer-label">ADAPTERS</span>
          <div><i class="fab fa-vuejs" /> Vue UMD</div>
          <div><i class="fas fa-file-code" /> Vue SFC</div>
          <div><i class="fas fa-window-maximize" /> WebView</div>
        </div>
      </div>
    </section>

    <section class="dashboard-composer overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:p-7">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Dashboard composition</p>
          <h2>切换 InternalCode，组合不同 Dashboard</h2>
        </div>
        <p>框架保持不变，菜单编码决定导航树、功能模块与权限范围，让一套运行时承载多个业务工作台。</p>
      </div>

      <div class="dashboard-composer-grid mt-7">
        <div class="dashboard-profile-list">
          <div class="composer-label">
            <span>MENU PROFILES</span>
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
            <span>LIVE MENU COMPOSITION</span>
            <span class="dashboard-preview-status">READY</span>
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
                  <small>DASHBOARD / OVERVIEW</small>
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
                    <i v-for="bar in 7" :key="bar" :style="{ height: `${22 + ((bar * 13 + index * 9) % 55)}%` }" />
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
        <button class="text-link-btn" @click="goTo('/system/menu-config')">
          配置 Dashboard <i class="fas fa-arrow-right" />
        </button>
      </div>
    </section>

    <section>
      <div class="section-heading mb-5">
        <div>
          <p class="eyebrow">Platform proof</p>
          <h2>把技术能力放进真实使用场景</h2>
        </div>
        <p>这些配套能力证明 Runtime 不只是一段加载脚本，而是一套可使用的应用容器。</p>
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

    <section class="final-cta relative overflow-hidden rounded-[22px] px-6 py-8 text-white sm:px-9 sm:py-10">
      <div class="final-cta-grid absolute inset-0" />
      <div class="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-blue-200">Try it yourself</p>
          <h2 class="mt-2 text-2xl font-black sm:text-3xl">不要只看介绍，直接加载一个 UMD 包</h2>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
            输入远程 URL 或选择本地 UMD 文件，查看导出对象、Manifest 与组件清单，再将组件注册到功能中心。
          </p>
        </div>
        <button class="cta-light-btn" @click="goTo('/umd-management')">
          进入 Runtime Lab
          <i class="fas fa-arrow-right" />
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
  .showcase-page {
    color: #0f172a;
  }

  .hero-shell {
    border: 1px solid color-mix(in srgb, var(--color-primary) 58%, #0f172a);
    background:
      linear-gradient(
        120deg,
        color-mix(in srgb, var(--color-primary) 76%, #0f172a),
        var(--color-primary) 55%,
        color-mix(in srgb, var(--color-primary) 70%, #7c3aed)
      );
    box-shadow: 0 28px 70px -38px rgba(15, 23, 42, 0.82);
  }

  .hero-grid,
  .final-cta-grid {
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.07) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: linear-gradient(to right, transparent 8%, black 50%, transparent);
  }

  .hero-glow {
    position: absolute;
    width: 520px;
    height: 520px;
    border-radius: 9999px;
    filter: blur(6px);
    pointer-events: none;
  }

  .hero-glow-blue {
    right: -180px;
    top: -210px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.22), transparent 68%);
  }

  .hero-glow-violet {
    bottom: -300px;
    left: 18%;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.18), transparent 68%);
  }

  .runtime-dot {
    width: 7px;
    height: 7px;
    border-radius: 9999px;
    background: #34d399;
    box-shadow: 0 0 0 4px rgba(52, 211, 153, 0.12), 0 0 18px rgba(52, 211, 153, 0.8);
  }

  .hero-title-accent {
    display: block;
    background: linear-gradient(105deg, #38bdf8, #818cf8 54%, #c084fc);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-primary-btn,
  .hero-secondary-btn,
  .cta-light-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border-radius: 12px;
    padding: 12px 17px;
    font-size: 0.78rem;
    font-weight: 800;
    transition: 160ms ease;
  }

  .hero-primary-btn {
    color: white;
    background: linear-gradient(110deg, #2563eb, #4f46e5);
    box-shadow: 0 14px 32px -16px rgba(59, 130, 246, 0.9);
  }

  .hero-primary-btn:hover,
  .cta-light-btn:hover {
    transform: translateY(-2px);
  }

  .hero-secondary-btn {
    color: #cbd5e1;
    border: 1px solid #334155;
    background: rgba(30, 41, 59, 0.68);
  }

  .hero-secondary-btn:hover {
    color: white;
    border-color: #475569;
    background: rgba(51, 65, 85, 0.78);
  }

  .runtime-panel {
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--color-primary) 24%, #e2e8f0);
    border-radius: 18px;
    color: #0f172a;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 35px 80px -35px color-mix(in srgb, var(--color-primary) 70%, transparent);
    backdrop-filter: blur(20px);
  }

  .runtime-panel-header {
    display: flex;
    height: 42px;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    background: rgba(248, 250, 252, 0.94);
    padding: 0 16px;
  }

  .window-dot {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
  }

  .log-row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .runtime-progress {
    background: linear-gradient(90deg, #2563eb, #22d3ee);
    box-shadow: 0 0 16px rgba(34, 211, 238, 0.55);
    transition: width 400ms ease;
  }

  .metric-card {
    position: relative;
    overflow: hidden;
    box-shadow: 0 12px 34px -30px rgba(15, 23, 42, 0.65);
  }

  .metric-card::after {
    position: absolute;
    right: -20px;
    top: -24px;
    width: 72px;
    height: 72px;
    border-radius: 9999px;
    background: var(--color-primary-bg);
    content: '';
  }

  .section-heading {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }

  .section-heading h2 {
    margin-top: 6px;
    font-size: 1.45rem;
    font-weight: 900;
    letter-spacing: -0.025em;
    color: #0f172a;
  }

  .section-heading > p {
    max-width: 510px;
    font-size: 0.82rem;
    line-height: 1.55rem;
    color: #64748b;
  }

  .eyebrow {
    font-size: 0.68rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-primary);
  }

  .flow-step {
    display: flex;
    min-height: 78px;
    align-items: center;
    gap: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 13px;
    background: #f8fafc;
    transition: 150ms ease;
  }

  .flow-step:hover,
  .flow-step-active {
    border-color: color-mix(in srgb, var(--color-primary) 38%, transparent);
    background: var(--color-primary-bg);
    transform: translateY(-1px);
  }

  .flow-step-index {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.62rem;
    color: #94a3b8;
  }

  .flow-step-icon {
    display: flex;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    color: var(--color-primary);
    background: white;
    box-shadow: 0 5px 15px -10px rgba(15, 23, 42, 0.5);
  }

  .flow-step strong,
  .flow-step small {
    display: block;
  }

  .flow-step strong {
    font-size: 0.8rem;
    color: #1e293b;
  }

  .flow-step small {
    margin-top: 3px;
    font-size: 0.67rem;
    color: #94a3b8;
  }

  .flow-detail {
    min-height: 240px;
    border: 1px solid color-mix(in srgb, var(--color-primary) 24%, #e2e8f0);
    border-radius: 18px;
    padding: 24px;
    color: #0f172a;
    background:
      radial-gradient(
        circle at 100% 0,
        color-mix(in srgb, var(--color-primary) 16%, transparent),
        transparent 42%
      ),
      linear-gradient(
        135deg,
        #ffffff,
        color-mix(in srgb, var(--color-primary) 6%, #ffffff)
      );
    box-shadow: 0 18px 45px -36px color-mix(in srgb, var(--color-primary) 55%, transparent);
  }

  .flow-detail h3 {
    margin-top: 28px;
    font-size: 1.5rem;
    font-weight: 900;
  }

  .flow-detail > p {
    margin-top: 10px;
    font-size: 0.82rem;
    line-height: 1.55rem;
    color: #64748b;
  }

  .flow-code {
    margin-top: 24px;
    overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--color-primary) 18%, #dbe3ef);
    border-radius: 10px;
    padding: 12px 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.69rem;
    background: rgba(255, 255, 255, 0.82);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .flow-code span:first-child {
    color: #7c3aed;
  }

  .flow-code span:last-child {
    color: color-mix(in srgb, var(--color-primary) 82%, #0369a1);
  }

  .adapter-card {
    transition: 180ms ease;
  }

  .adapter-card:hover,
  .proof-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 18px 40px -30px rgba(15, 23, 42, 0.55);
  }

  .adapter-icon {
    display: flex;
    width: 46px;
    height: 46px;
    align-items: center;
    justify-content: center;
    border-radius: 13px;
    font-size: 1.1rem;
  }

  .adapter-icon-emerald { color: #059669; background: #ecfdf5; }
  .adapter-icon-blue { color: #2563eb; background: #eff6ff; }
  .adapter-icon-amber { color: #d97706; background: #fffbeb; }

  .adapter-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 9999px;
    padding: 5px 8px;
    font-size: 0.6rem;
    font-weight: 800;
    color: #059669;
    background: #ecfdf5;
  }

  .adapter-card dl > div {
    display: flex;
    justify-content: space-between;
    gap: 15px;
  }

  .adapter-card dt { color: #94a3b8; }
  .adapter-card dd {
    text-align: right;
    font-weight: 700;
    color: #475569;
  }

  .text-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    font-size: 0.75rem;
    font-weight: 800;
    color: var(--color-primary);
  }

  .architecture-flow {
    display: grid;
    gap: 10px;
  }

  .architecture-layer {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 15px;
    padding: 26px 10px 10px;
    background: rgba(255, 255, 255, 0.74);
  }

  .architecture-layer-runtime {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-color: rgba(59, 130, 246, 0.28);
    background: rgba(239, 246, 255, 0.88);
  }

  .architecture-layer > div {
    display: flex;
    min-height: 52px;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 10px;
    font-size: 0.68rem;
    font-weight: 800;
    color: #475569;
    background: white;
  }

  .architecture-layer-runtime > div {
    color: #1d4ed8;
  }

  .layer-label {
    position: absolute;
    left: 12px;
    top: 7px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.56rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    color: #94a3b8;
  }

  .architecture-connector {
    display: flex;
    height: 18px;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
  }

  .architecture-connector span {
    width: 34px;
    height: 1px;
    background: #cbd5e1;
  }

  .architecture-connector i {
    margin: 0 8px;
    font-size: 0.55rem;
  }

  .dashboard-composer {
    box-shadow: 0 18px 50px -42px rgba(15, 23, 42, 0.55);
  }

  .dashboard-composer-grid {
    display: grid;
    grid-template-columns: minmax(245px, 0.72fr) 54px minmax(0, 1.45fr);
    align-items: center;
    gap: 16px;
  }

  .dashboard-profile-list {
    display: grid;
    gap: 9px;
  }

  .composer-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 3px;
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    color: #94a3b8;
  }

  .composer-label span:last-child {
    font-weight: 600;
    letter-spacing: 0;
  }

  .dashboard-profile {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 13px;
    padding: 11px;
    text-align: left;
    background: #f8fafc;
    transition: 160ms ease;
  }

  .dashboard-profile:hover,
  .dashboard-profile-active {
    border-color: color-mix(in srgb, var(--color-primary) 40%, #e2e8f0);
    background: color-mix(in srgb, var(--color-primary) 7%, white);
    transform: translateX(2px);
  }

  .dashboard-profile-icon,
  .dashboard-preview-brand > span {
    display: flex;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .dashboard-profile-icon-blue { color: #2563eb; background: #eff6ff; }
  .dashboard-profile-icon-emerald { color: #059669; background: #ecfdf5; }
  .dashboard-profile-icon-violet { color: #7c3aed; background: #f5f3ff; }

  .dashboard-profile strong,
  .dashboard-profile small {
    display: block;
  }

  .dashboard-profile strong {
    overflow: hidden;
    font-size: 0.78rem;
    color: #1e293b;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-profile small {
    margin-top: 3px;
    overflow: hidden;
    font-size: 0.66rem;
    color: #94a3b8;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-profile-arrow {
    font-size: 0.58rem;
    color: #cbd5e1;
  }

  .dashboard-profile-active .dashboard-profile-arrow {
    color: var(--color-primary);
  }

  .internal-code-config {
    margin-top: 3px;
    border: 1px dashed color-mix(in srgb, var(--color-primary) 25%, #cbd5e1);
    border-radius: 12px;
    padding: 11px 13px;
    background: color-mix(in srgb, var(--color-primary) 4%, white);
  }

  .internal-code-config span,
  .internal-code-config code {
    display: block;
  }

  .internal-code-config span {
    font-size: 0.6rem;
    font-weight: 800;
    color: #94a3b8;
  }

  .internal-code-config code {
    margin-top: 5px;
    overflow: hidden;
    font-size: 0.72rem;
    font-weight: 800;
    color: var(--color-primary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-switch-arrow {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    color: var(--color-primary);
  }

  .dashboard-switch-arrow span {
    display: flex;
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background: var(--color-primary-bg);
  }

  .dashboard-switch-arrow small {
    font-size: 0.56rem;
    font-weight: 800;
    color: #94a3b8;
    white-space: nowrap;
  }

  .dashboard-preview {
    overflow: hidden;
    border: 1px solid #dbe3ef;
    border-radius: 16px;
    background: #f8fafc;
    box-shadow: 0 24px 55px -38px rgba(15, 23, 42, 0.65);
  }

  .dashboard-preview-bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    height: 40px;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 13px;
    font-size: 0.55rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    color: #94a3b8;
    background: white;
  }

  .dashboard-preview-status {
    justify-self: end;
    border-radius: 9999px;
    padding: 4px 7px;
    letter-spacing: 0.08em;
    color: #059669;
    background: #ecfdf5;
  }

  .dashboard-preview-body {
    display: grid;
    grid-template-columns: 170px minmax(0, 1fr);
    min-height: 305px;
  }

  .dashboard-preview-body aside {
    padding: 16px 12px;
    color: #cbd5e1;
    background:
      radial-gradient(
        circle at 0 0,
        color-mix(in srgb, var(--color-primary) 24%, transparent),
        transparent 38%
      ),
      #0f172a;
  }

  .dashboard-preview-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 2px 3px 15px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  }

  .dashboard-preview-brand > span {
    width: 30px;
    height: 30px;
    border-radius: 9px;
  }

  .dashboard-preview-brand strong {
    min-width: 0;
    overflow: hidden;
    font-size: 0.68rem;
    color: white;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-preview-menu {
    display: grid;
    gap: 6px;
    margin-top: 13px;
  }

  .dashboard-preview-menu span {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    padding: 9px 10px;
    font-size: 0.64rem;
    font-weight: 700;
    color: #94a3b8;
  }

  .dashboard-preview-menu span.active {
    color: white;
    background: color-mix(in srgb, var(--color-primary) 60%, transparent);
  }

  .dashboard-preview-menu i {
    width: 12px;
    font-size: 0.55rem;
    text-align: center;
  }

  .dashboard-preview-body main {
    min-width: 0;
    padding: 17px;
  }

  .dashboard-preview-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .dashboard-preview-heading small,
  .dashboard-preview-heading strong {
    display: block;
  }

  .dashboard-preview-heading small {
    font-size: 0.52rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    color: #94a3b8;
  }

  .dashboard-preview-heading strong {
    margin-top: 4px;
    font-size: 0.86rem;
    color: #1e293b;
  }

  .dashboard-preview-heading code {
    max-width: 46%;
    overflow: hidden;
    border-radius: 7px;
    padding: 5px 7px;
    font-size: 0.58rem;
    color: var(--color-primary);
    background: var(--color-primary-bg);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-widget-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
    margin-top: 17px;
  }

  .dashboard-widget-grid article {
    min-width: 0;
    height: 91px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px;
    background: white;
  }

  .dashboard-widget-grid article.dashboard-widget-wide {
    grid-column: 1 / -1;
    height: 102px;
  }

  .dashboard-widget-grid article > span {
    display: block;
    overflow: hidden;
    font-size: 0.58rem;
    font-weight: 800;
    color: #64748b;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-widget-chart {
    display: flex;
    height: 50px;
    align-items: flex-end;
    gap: 5px;
    margin-top: 9px;
  }

  .dashboard-widget-chart i {
    flex: 1;
    min-width: 3px;
    border-radius: 3px 3px 1px 1px;
    background: color-mix(in srgb, var(--color-primary) 58%, #bfdbfe);
  }

  .dashboard-composer-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-top: 18px;
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
  }

  .dashboard-composer-footer > div {
    display: flex;
    flex-wrap: wrap;
    gap: 9px 18px;
  }

  .dashboard-composer-footer span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 0.68rem;
    font-weight: 700;
    color: #64748b;
  }

  .dashboard-composer-footer span i {
    color: #10b981;
  }

  .proof-card {
    transition: 180ms ease;
  }

  .proof-card > i {
    color: var(--color-primary);
  }

  .proof-card h3 {
    margin-top: 15px;
    font-size: 0.83rem;
    font-weight: 900;
    color: #1e293b;
  }

  .proof-card p {
    margin-top: 7px;
    font-size: 0.72rem;
    line-height: 1.25rem;
    color: #64748b;
  }

  .final-cta {
    background: linear-gradient(115deg, #1d4ed8, #4338ca 58%, #6d28d9);
    box-shadow: 0 22px 50px -34px rgba(67, 56, 202, 0.9);
  }

  .cta-light-btn {
    flex-shrink: 0;
    color: #1d4ed8;
    background: white;
    box-shadow: 0 14px 30px -18px rgba(15, 23, 42, 0.5);
  }

  .home-dark .section-heading h2,
  .home-dark .flow-step strong,
  .home-dark .adapter-card dd,
  .home-dark .proof-card h3 {
    color: #f8fafc;
  }

  .home-dark .section-heading > p,
  .home-dark .proof-card p {
    color: #94a3b8;
  }

  .home-dark .flow-step {
    border-color: #334155;
    background: rgba(15, 23, 42, 0.42);
  }

  .home-dark .flow-step:hover,
  .home-dark .flow-step-active {
    border-color: color-mix(in srgb, var(--color-primary) 50%, transparent);
    background: color-mix(in srgb, var(--color-primary) 18%, #0f172a);
  }

  .home-dark .flow-step-icon {
    background: #1e293b;
  }

  .home-dark .flow-detail {
    border-color: color-mix(in srgb, var(--color-primary) 28%, #334155);
    color: white;
    background:
      radial-gradient(
        circle at 100% 0,
        color-mix(in srgb, var(--color-primary) 25%, transparent),
        transparent 38%
      ),
      #0f172a;
    box-shadow: none;
  }

  .home-dark .flow-detail > p {
    color: #94a3b8;
  }

  .home-dark .flow-code {
    border-color: #334155;
    background: rgba(2, 6, 23, 0.6);
  }

  .home-dark .flow-code span:first-child {
    color: #a78bfa;
  }

  .home-dark .flow-code span:last-child {
    color: #22d3ee;
  }

  .home-dark .adapter-icon-emerald { color: #34d399; background: rgba(6, 78, 59, 0.35); }
  .home-dark .adapter-icon-blue { color: #60a5fa; background: rgba(30, 58, 138, 0.35); }
  .home-dark .adapter-icon-amber { color: #fbbf24; background: rgba(120, 53, 15, 0.3); }
  .home-dark .adapter-status { color: #34d399; background: rgba(6, 78, 59, 0.32); }

  .home-dark .architecture-layer {
    border-color: rgba(71, 85, 105, 0.7);
    background: rgba(15, 23, 42, 0.5);
  }

  .home-dark .architecture-layer-runtime {
    border-color: color-mix(in srgb, var(--color-primary) 42%, #334155);
    background: color-mix(in srgb, var(--color-primary) 14%, #0f172a);
  }

  .home-dark .architecture-layer > div {
    color: #cbd5e1;
    background: rgba(30, 41, 59, 0.9);
  }

  .home-dark .architecture-layer-runtime > div {
    color: color-mix(in srgb, var(--color-primary) 55%, white);
  }

  .home-dark .dashboard-profile {
    border-color: #334155;
    background: rgba(15, 23, 42, 0.42);
  }

  .home-dark .dashboard-profile:hover,
  .home-dark .dashboard-profile-active {
    border-color: color-mix(in srgb, var(--color-primary) 50%, #334155);
    background: color-mix(in srgb, var(--color-primary) 16%, #0f172a);
  }

  .home-dark .dashboard-profile strong,
  .home-dark .dashboard-preview-heading strong {
    color: #f8fafc;
  }

  .home-dark .internal-code-config {
    border-color: color-mix(in srgb, var(--color-primary) 32%, #475569);
    background: rgba(15, 23, 42, 0.55);
  }

  .home-dark .dashboard-preview {
    border-color: #334155;
    background: #111827;
  }

  .home-dark .dashboard-preview-bar {
    border-bottom-color: #334155;
    background: #1e293b;
  }

  .home-dark .dashboard-preview-status {
    color: #34d399;
    background: rgba(6, 78, 59, 0.42);
  }

  .home-dark .dashboard-preview-body aside {
    background:
      radial-gradient(
        circle at 0 0,
        color-mix(in srgb, var(--color-primary) 22%, transparent),
        transparent 38%
      ),
      #020617;
  }

  .home-dark .dashboard-widget-grid article {
    border-color: #334155;
    background: #1e293b;
  }

  .home-dark .dashboard-widget-grid article > span,
  .home-dark .dashboard-composer-footer span {
    color: #94a3b8;
  }

  .home-dark .dashboard-composer-footer {
    border-top-color: #334155;
  }

  .home-dark .hero-shell {
    border-color: color-mix(in srgb, var(--color-primary) 46%, #334155);
    background:
      linear-gradient(
        120deg,
        color-mix(in srgb, var(--color-primary) 34%, #020617),
        color-mix(in srgb, var(--color-primary) 24%, #0f172a) 55%,
        color-mix(in srgb, var(--color-primary) 20%, #1e1b4b)
      );
  }

  .home-dark .runtime-panel {
    border-color: rgba(71, 85, 105, 0.7);
    color: white;
    background: rgba(15, 23, 42, 0.9);
  }

  .home-dark .runtime-panel-header {
    border-bottom-color: #1e293b;
    background: rgba(15, 23, 42, 0.92);
  }

  @media (max-width: 1023px) {
    .dashboard-composer-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-switch-arrow {
      flex-direction: row;
      justify-content: center;
    }

    .dashboard-switch-arrow span {
      transform: rotate(90deg);
    }
  }

  @media (min-width: 768px) {
    .section-heading {
      flex-direction: row;
      align-items: flex-end;
    }
  }

  @media (max-width: 640px) {
    .hero-shell {
      border-radius: 18px;
    }

    .runtime-panel {
      border-radius: 14px;
    }

    .runtime-log {
      overflow-x: auto;
    }

    .log-row {
      min-width: 390px;
    }

    .architecture-layer,
    .architecture-layer-runtime {
      grid-template-columns: 1fr;
    }

    .dashboard-preview-body {
      grid-template-columns: 125px minmax(0, 1fr);
    }

    .dashboard-composer-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-primary-btn,
    .hero-secondary-btn,
    .cta-light-btn,
    .adapter-card,
    .proof-card,
    .flow-step {
      transition: none;
    }
  }
</style>
