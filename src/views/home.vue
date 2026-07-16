<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';

  defineOptions({ name: 'home' });

  const router = useRouter();

  const systemName = computed(() => (window as any).uiGlobalConfig?.DisplayName || 'Kivii Dashboard');

  const coreCapabilities = [
    {
      icon: 'fas fa-cubes-stacked',
      title: '多形态应用集成',
      description: '统一承载 Vue 页面、UMD 远程组件与 WebView，让存量系统和新应用在同一工作台协同运行。',
      accent: 'violet',
    },
    {
      icon: 'fas fa-route',
      title: '动态菜单与路由',
      description: '菜单配置实时生成路由与导航结构，支持侧边、顶部、混合布局，无需反复修改前端工程。',
      accent: 'blue',
    },
    {
      icon: 'fas fa-shield-halved',
      title: '一体化权限治理',
      description: '以用户、角色、功能为核心建立权限链路，让功能授权、菜单可见性和访问控制保持一致。',
      accent: 'emerald',
    },
  ];

  const advantages = [
    { icon: 'fas fa-plug-circle-bolt', title: '即插即用', text: '远程模块独立发布，接入后即可使用' },
    { icon: 'fas fa-layer-group', title: '统一体验', text: '多应用共享导航、主题、标签页与用户上下文' },
    { icon: 'fas fa-gauge-high', title: '轻量高效', text: '按需加载与缓存策略兼顾首屏速度和运行性能' },
    { icon: 'fas fa-arrows-rotate', title: '渐进演进', text: '保留现有系统投入，同时持续引入现代技术栈' },
  ];

  const techStack = ['Vue 3', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase'];

  function goTo(path: string) {
    router.push(path);
  }
</script>

<template>
  <div class="home-page space-y-5 md:space-y-6">
    <section class="hero relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-700/80 dark:bg-slate-800">
      <div class="hero-grid absolute inset-0" />
      <div class="hero-glow hero-glow-one" />
      <div class="hero-glow hero-glow-two" />

      <div class="relative grid min-h-[430px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-14 lg:py-12">
        <div class="max-w-2xl">
          <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
            <span class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            企业级模块化应用工作台
          </div>

          <p class="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">{{ systemName }}</p>
          <h1 class="max-w-xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[44px] dark:text-white">
            一个入口，连接并管理
            <span class="hero-title-accent">所有业务应用</span>
          </h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Kivii 将分散的页面、远程模块和存量系统整合进统一工作台，以动态路由、权限治理与多形态渲染能力，帮助团队更快交付、更稳扩展。
          </p>

          <div class="mt-7 flex flex-wrap items-center gap-3">
            <button class="btn-primary inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5" @click="goTo('/system/feature-list')">
              探索功能中心
              <i class="fas fa-arrow-right text-xs" />
            </button>
            <button class="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300" @click="goTo('/umd-management')">
              <i class="fas fa-cubes" />
              管理应用模块
            </button>
          </div>

          <div class="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span v-for="item in techStack" :key="item" class="inline-flex items-center gap-1.5">
              <i class="fas fa-check text-emerald-500" />{{ item }}
            </span>
          </div>
        </div>

        <div class="architecture-wrap mx-auto w-full max-w-[480px] lg:mx-0 lg:ml-auto">
          <div class="architecture-card relative rounded-2xl border border-white/80 bg-white/85 p-4 shadow-2xl backdrop-blur dark:border-slate-600/80 dark:bg-slate-800/85 sm:p-5">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-slate-400">WORKSPACE</p>
                <p class="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">统一应用工作台</p>
              </div>
              <span class="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">运行中</span>
            </div>

            <div class="grid grid-cols-3 gap-2.5">
              <div class="module-node module-node-blue">
                <i class="fab fa-vuejs" />
                <span>Vue</span>
              </div>
              <div class="module-node module-node-violet">
                <i class="fas fa-cube" />
                <span>UMD</span>
              </div>
              <div class="module-node module-node-amber">
                <i class="fas fa-window-maximize" />
                <span>WebView</span>
              </div>
            </div>

            <div class="flow-line my-3 flex items-center justify-center">
              <span class="h-4 w-px bg-slate-200 dark:bg-slate-600" />
              <i class="fas fa-chevron-down mx-2 text-[9px] text-slate-300 dark:text-slate-500" />
              <span class="h-4 w-px bg-slate-200 dark:bg-slate-600" />
            </div>

            <div class="rounded-xl border border-blue-100 bg-blue-50/80 p-4 dark:border-blue-900/70 dark:bg-blue-950/35">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-md">
                  <i class="fas fa-bolt" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Kivii Runtime</p>
                    <span class="text-[10px] font-medium text-blue-600 dark:text-blue-400">CONNECTED</span>
                  </div>
                  <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                    <div class="runtime-progress h-full w-[82%] rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-2 text-center">
              <div class="metric-chip"><strong>动态</strong><span>路由</span></div>
              <div class="metric-chip"><strong>统一</strong><span>权限</span></div>
              <div class="metric-chip"><strong>多端</strong><span>适配</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Core capabilities</p>
          <h2 class="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white">让复杂系统，拥有清晰的运行方式</h2>
        </div>
        <p class="max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">围绕“集成、组织、治理”构建核心能力，降低跨系统协作成本。</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <article v-for="(item, index) in coreCapabilities" :key="item.title" class="capability-card group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <span class="absolute right-4 top-3 text-5xl font-bold text-slate-100 transition-colors group-hover:text-blue-50 dark:text-slate-700/50 dark:group-hover:text-blue-950/50">0{{ index + 1 }}</span>
          <div :class="['capability-icon', `capability-icon-${item.accent}`]">
            <i :class="item.icon" />
          </div>
          <h3 class="relative mt-5 text-base font-bold text-slate-900 dark:text-white">{{ item.title }}</h3>
          <p class="relative mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{{ item.description }}</p>
        </article>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
      <div class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Why Kivii</p>
            <h2 class="mt-1.5 text-xl font-bold text-slate-900 dark:text-white">为持续变化的业务而设计</h2>
          </div>
          <div class="hidden h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-primary sm:flex dark:bg-blue-950/40">
            <i class="fas fa-sparkles" />
          </div>
        </div>
        <div class="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div v-for="item in advantages" :key="item.title" class="flex gap-3">
            <div class="advantage-icon"><i :class="item.icon" /></div>
            <div>
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ item.title }}</h3>
              <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{{ item.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="cta-card relative overflow-hidden rounded-xl p-6 text-white">
        <div class="cta-orb" />
        <div class="relative flex h-full min-h-[210px] flex-col">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
            <i class="fas fa-diagram-project" />
          </div>
          <h2 class="mt-5 text-xl font-bold">从功能到入口，灵活组织</h2>
          <p class="mt-2 text-sm leading-6 text-blue-100">通过可视化菜单配置，将能力快速编排成贴合不同角色的工作空间。</p>
          <button class="mt-auto inline-flex w-fit items-center gap-2 pt-5 text-sm font-semibold text-white transition-all hover:gap-3" @click="goTo('/system/menu-config')">
            配置工作空间 <i class="fas fa-arrow-right text-xs" />
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
  .hero {
    box-shadow: 0 18px 55px -38px rgba(15, 23, 42, 0.45);
  }

  .hero-grid {
    opacity: 0.45;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: linear-gradient(to right, transparent, black 40%, black);
  }

  .hero-glow {
    position: absolute;
    border-radius: 9999px;
    filter: blur(2px);
    pointer-events: none;
  }

  .hero-glow-one {
    right: -90px;
    top: -150px;
    width: 440px;
    height: 440px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.19), transparent 68%);
  }

  .hero-glow-two {
    bottom: -180px;
    left: 30%;
    width: 360px;
    height: 360px;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.12), transparent 68%);
  }

  .hero-title-accent {
    color: var(--color-primary);
    background: linear-gradient(115deg, var(--color-primary), #7c3aed);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .architecture-card {
    box-shadow: 0 25px 60px -24px rgba(30, 64, 175, 0.38);
    transform: perspective(1200px) rotateY(-2deg) rotateX(1deg);
  }

  .module-node {
    display: flex;
    min-height: 76px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border-radius: 0.75rem;
    font-size: 0.72rem;
    font-weight: 700;
    border: 1px solid transparent;
  }

  .module-node i { font-size: 1.05rem; }
  .module-node-blue { color: #2563eb; background: #eff6ff; border-color: #dbeafe; }
  .module-node-violet { color: #7c3aed; background: #f5f3ff; border-color: #ede9fe; }
  .module-node-amber { color: #d97706; background: #fffbeb; border-color: #fef3c7; }

  .metric-chip {
    display: flex;
    flex-direction: column;
    gap: 1px;
    border-radius: 0.6rem;
    background: rgba(248, 250, 252, 0.85);
    padding: 8px 4px;
  }

  .metric-chip strong { font-size: 0.7rem; color: #334155; }
  .metric-chip span { font-size: 0.6rem; color: #94a3b8; }

  .capability-icon,
  .advantage-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .capability-icon { width: 42px; height: 42px; border-radius: 0.7rem; }
  .capability-icon-violet { color: #7c3aed; background: #f5f3ff; }
  .capability-icon-blue { color: #2563eb; background: #eff6ff; }
  .capability-icon-emerald { color: #059669; background: #ecfdf5; }

  .advantage-icon {
    width: 34px;
    height: 34px;
    border-radius: 0.55rem;
    color: var(--color-primary);
    background: var(--color-primary-bg);
    font-size: 0.75rem;
  }

  .cta-card {
    background: linear-gradient(135deg, #1d4ed8, #4338ca);
    box-shadow: 0 16px 35px -25px rgba(37, 99, 235, 0.9);
  }

  .cta-orb {
    position: absolute;
    right: -60px;
    top: -70px;
    width: 210px;
    height: 210px;
    border-radius: 9999px;
    border: 35px solid rgba(255, 255, 255, 0.07);
  }

  .runtime-progress { animation: runtime-pulse 2.8s ease-in-out infinite; }

  @keyframes runtime-pulse {
    0%, 100% { opacity: 0.68; }
    50% { opacity: 1; }
  }

  :global(.dark) .module-node-blue { color: #60a5fa; background: rgba(30, 58, 138, 0.3); border-color: rgba(30, 64, 175, 0.45); }
  :global(.dark) .module-node-violet { color: #a78bfa; background: rgba(76, 29, 149, 0.25); border-color: rgba(91, 33, 182, 0.4); }
  :global(.dark) .module-node-amber { color: #fbbf24; background: rgba(120, 53, 15, 0.22); border-color: rgba(146, 64, 14, 0.4); }
  :global(.dark) .metric-chip { background: rgba(15, 23, 42, 0.48); }
  :global(.dark) .metric-chip strong { color: #e2e8f0; }
  :global(.dark) .capability-icon-violet { color: #a78bfa; background: rgba(76, 29, 149, 0.3); }
  :global(.dark) .capability-icon-blue { color: #60a5fa; background: rgba(30, 58, 138, 0.3); }
  :global(.dark) .capability-icon-emerald { color: #34d399; background: rgba(6, 78, 59, 0.3); }

  @media (max-width: 640px) {
    .architecture-card { transform: none; }
    .hero-grid { mask-image: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .runtime-progress { animation: none; }
  }
</style>
