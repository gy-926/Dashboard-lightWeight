<script setup lang="ts">
  import { computed, getCurrentInstance, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useMenuStore } from '@/layouts/modules/global-menu/store';
  import {
    remoteLibraries,
    umdLoadingCount,
    umdRegistryVersion,
  } from '@/utils/remoteComponentLoader';

  defineOptions({ name: 'UmdShowcasePage' });

  type DemoKey = 'overview' | 'interaction' | 'workspace';

  interface DemoDefinition {
    key: DemoKey;
    component: string;
    title: string;
    description: string;
    icon: string;
    exposedMethod: string;
  }

  interface EventRecord {
    id: number;
    name: string;
    detail: string;
    time: string;
    tone: 'blue' | 'violet' | 'emerald' | 'amber';
  }

  const router = useRouter();
  const menuStore = useMenuStore();
  const instance = getCurrentInstance();
  const activeDemo = ref<DemoKey>('overview');
  const componentRef = ref<any>(null);
  const sequence = ref(3);
  const hostCallResult = ref('尚未调用远程方法');
  const eventRecords = ref<EventRecord[]>([
    {
      id: 1,
      name: 'runtime:init',
      detail: '主框架已启动 UMD Showcase 加载任务',
      time: new Date().toLocaleTimeString(),
      tone: 'blue',
    },
    {
      id: 2,
      name: 'host:ready',
      detail: 'Props、Events 和 Expose 通信通道已准备',
      time: new Date().toLocaleTimeString(),
      tone: 'emerald',
    },
  ]);

  const demos: DemoDefinition[] = [
    {
      key: 'overview',
      component: 'RuntimeOverview',
      title: 'Runtime Overview',
      description: '查看远程模块从解析、加载、发现到挂载的完整链路。',
      icon: 'fas fa-gauge-high',
      exposedMethod: 'resetComponent',
    },
    {
      key: 'interaction',
      component: 'HostInteractionDemo',
      title: 'Host Interaction',
      description: '实际演示宿主 Props、远程 Events 与 Expose 方法调用。',
      icon: 'fas fa-tower-broadcast',
      exposedMethod: 'receiveHostMessage',
    },
    {
      key: 'workspace',
      component: 'DataWorkspaceDemo',
      title: 'Data Workspace',
      description: '运行一个包含筛选、选择和导出事件的完整业务页面。',
      icon: 'fas fa-table',
      exposedMethod: 'resetFilters',
    },
  ];

  const currentDemo = computed(
    () => demos.find(item => item.key === activeDemo.value) ?? demos[0]
  );
  const theme = computed<'light' | 'dark'>(() =>
    menuStore.theme.darkMode ? 'dark' : 'light'
  );

  const registeredComponentCount = computed(() =>
    remoteLibraries.value.reduce(
      (total, library) =>
        total +
        (library.registeredCount ??
          library.componentsDetailed?.length ??
          library.manifest?.components?.length ??
          0),
      0
    )
  );

  const showcaseLibrary = computed(() =>
    remoteLibraries.value.find(
      library =>
        library.url.includes('kivii-runtime-showcase.umd.js') ||
        library.componentsDetailed?.some(item => item.name === 'RuntimeOverview')
    )
  );

  const registeredDemoNames = computed(() => {
    void umdRegistryVersion.value;
    return demos
      .filter(
        demo =>
          !!instance &&
          Object.prototype.hasOwnProperty.call(
            instance.appContext.components,
            demo.component
          )
      )
      .map(demo => demo.component);
  });

  const isCurrentRegistered = computed(() =>
    registeredDemoNames.value.includes(currentDemo.value.component)
  );

  const loading = computed(
    () =>
      !isCurrentRegistered.value &&
      (umdLoadingCount.value > 0 || showcaseLibrary.value?.status === 'loading')
  );

  const loadError = computed(() =>
    showcaseLibrary.value?.status === 'error'
      ? showcaseLibrary.value.error || 'UMD 示例加载失败'
      : ''
  );

  const componentProps = computed(() => ({
    theme: theme.value,
    hostName: 'GavinYinHub Dashboard Host',
    version: showcaseLibrary.value?.manifest?.version || '1.1.2',
    registeredCount: registeredComponentCount.value,
    initialCount: 2,
    title: 'Runtime Module Workspace',
  }));

  function formatPayload(payload: unknown): string {
    if (typeof payload === 'string') return payload;
    try {
      return JSON.stringify(payload);
    } catch {
      return String(payload);
    }
  }

  function recordEvent(
    name: string,
    payload: unknown,
    tone: EventRecord['tone'] = 'violet'
  ) {
    eventRecords.value.unshift({
      id: sequence.value++,
      name,
      detail: formatPayload(payload),
      time: new Date().toLocaleTimeString(),
      tone,
    });
    eventRecords.value = eventRecords.value.slice(0, 8);
  }

  function selectDemo(key: DemoKey) {
    activeDemo.value = key;
    componentRef.value = null;
    hostCallResult.value = '尚未调用远程方法';
    recordEvent('host:switch-demo', key, 'blue');
  }

  function handleNavigate(path: string) {
    recordEvent('remote:navigate', path, 'amber');
    router.push(path);
  }

  function handleExport(rows: unknown[]) {
    recordEvent('remote:export', `${rows.length} 条记录`, 'emerald');
  }

  function invokeExposedMethod() {
    const remote = componentRef.value;
    if (!remote || typeof remote.invoke !== 'function') {
      hostCallResult.value = '远程组件尚未准备完成';
      return;
    }

    try {
      const method = currentDemo.value.exposedMethod;
      const args =
        activeDemo.value === 'interaction'
          ? ['来自主框架的消息：Expose 调用成功']
          : [];
      const result = remote.invoke(method, ...args);
      hostCallResult.value = formatPayload(result);
      recordEvent(`host:invoke:${method}`, result, 'emerald');
    } catch (error) {
      hostCallResult.value = error instanceof Error ? error.message : String(error);
      recordEvent('host:invoke:error', hostCallResult.value, 'amber');
    }
  }
</script>

<template>
  <div class="space-y-5 pb-3 md:space-y-7">
    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div class="showcase-header relative overflow-hidden px-5 py-6 sm:px-7">
        <div class="showcase-grid absolute inset-0" />
        <div class="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div class="showcase-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em]">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              Live UMD integration
            </div>
            <h1 class="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">UMD Runtime Showcase</h1>
            <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              下方页面来自独立的
              <code class="showcase-code rounded px-1.5 py-0.5">Gy-umd-demo</code>
              构建产物，由主框架运行时加载并注册。
            </p>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="header-metric">
              <strong>{{ registeredDemoNames.length }}/{{ demos.length }}</strong>
              <span>DEMO READY</span>
            </div>
            <div class="header-metric">
              <strong>{{ showcaseLibrary?.manifest?.version || '1.1.2' }}</strong>
              <span>VERSION</span>
            </div>
            <div class="header-metric">
              <strong>{{ showcaseLibrary?.status || 'loading' }}</strong>
              <span>STATUS</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid gap-0 lg:grid-cols-[260px_1fr]">
        <aside class="border-b border-slate-200 p-4 dark:border-slate-700 lg:border-b-0 lg:border-r">
          <p class="mb-3 px-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Remote pages
          </p>
          <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <button
              v-for="demo in demos"
              :key="demo.key"
              class="demo-nav-item"
              :class="{ 'demo-nav-item-active': activeDemo === demo.key }"
              @click="selectDemo(demo.key)"
            >
              <span><i :class="demo.icon" /></span>
              <span class="min-w-0">
                <strong>{{ demo.title }}</strong>
                <small>{{ demo.description }}</small>
              </span>
            </button>
          </div>

          <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black uppercase tracking-wider text-slate-400">
                Host control
              </span>
              <i class="fas fa-terminal text-xs text-violet-500" />
            </div>
            <button class="invoke-btn" :disabled="!isCurrentRegistered" @click="invokeExposedMethod">
              调用 {{ currentDemo.exposedMethod }}()
            </button>
            <p class="mt-2 break-all font-mono text-[11px] leading-4 text-slate-500 dark:text-slate-400">
              {{ hostCallResult }}
            </p>
          </div>
        </aside>

        <div class="min-w-0 bg-slate-50/70 p-3 dark:bg-slate-900/30 sm:p-5">
          <div
            v-if="loading"
            class="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800"
          >
            <i class="fas fa-circle-notch fa-spin text-3xl text-blue-500" />
            <p class="mt-4 text-sm font-bold">正在加载 Gy-umd-demo 构建产物...</p>
            <code class="mt-2 text-xs">GavinYinHub Runtime Bundle</code>
          </div>

          <div
            v-else-if="loadError || !isCurrentRegistered"
            class="flex min-h-[520px] flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/60 dark:bg-rose-950/20"
          >
            <i class="fas fa-triangle-exclamation text-3xl text-rose-500" />
            <p class="mt-4 text-sm font-black text-rose-700 dark:text-rose-300">
              示例组件未能注册
            </p>
            <p class="mt-2 max-w-lg text-sm leading-5 text-rose-600/80 dark:text-rose-400">
              {{ loadError || `未找到全局组件 ${currentDemo.component}` }}
            </p>
          </div>

          <component
            :is="currentDemo.component"
            v-else
            ref="componentRef"
            v-bind="componentProps"
            @action="recordEvent('remote:action', $event)"
            @count-change="recordEvent('remote:count-change', $event)"
            @host-message="recordEvent('remote:host-message', $event)"
            @navigate="handleNavigate"
            @row-select="recordEvent('remote:row-select', $event)"
            @filter-change="recordEvent('remote:filter-change', $event)"
            @export="handleExport"
          />
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div class="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-700 sm:flex-row sm:items-center">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.16em] text-violet-600 dark:text-violet-400">
            Integration evidence
          </p>
          <h2 class="mt-1 text-lg font-black text-slate-900 dark:text-white">宿主通信事件流</h2>
        </div>
        <div class="flex flex-wrap gap-2 text-xs font-bold">
          <span class="contract-chip"><i class="fas fa-arrow-down" /> Props</span>
          <span class="contract-chip"><i class="fas fa-arrow-up" /> Events</span>
          <span class="contract-chip"><i class="fas fa-code" /> Expose</span>
          <span class="contract-chip"><i class="fas fa-palette" /> Theme</span>
        </div>
      </div>

      <div class="mt-3 grid gap-2 lg:grid-cols-2">
        <div
          v-for="event in eventRecords"
          :key="event.id"
          class="event-row"
        >
          <span :class="['event-dot', `event-dot-${event.tone}`]" />
          <code>{{ event.name }}</code>
          <span class="min-w-0 flex-1 truncate">{{ event.detail }}</span>
          <time>{{ event.time }}</time>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
  .showcase-header {
    background:
      radial-gradient(
        circle at 92% -20%,
        color-mix(in srgb, var(--color-primary) 24%, transparent),
        transparent 40%
      ),
      linear-gradient(
        115deg,
        #ffffff,
        color-mix(in srgb, var(--color-primary) 7%, #ffffff) 58%,
        color-mix(in srgb, var(--color-primary) 13%, #ffffff)
      );
  }

  .showcase-badge {
    border: 1px solid color-mix(in srgb, var(--color-primary) 24%, transparent);
    color: color-mix(in srgb, var(--color-primary) 86%, #1e293b);
    background: color-mix(in srgb, var(--color-primary) 9%, white);
  }

  .showcase-code {
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  .showcase-grid {
    opacity: 0.42;
    background-image:
      linear-gradient(rgba(148, 163, 184, 0.09) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.09) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(to right, transparent, black 55%);
  }

  .header-metric {
    min-width: 88px;
    border: 1px solid color-mix(in srgb, var(--color-primary) 18%, #e2e8f0);
    border-radius: 12px;
    padding: 10px;
    color: #1e293b;
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(12px);
  }

  .header-metric strong,
  .header-metric span {
    display: block;
  }

  .header-metric strong {
    overflow: hidden;
    font-size: 0.8rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-metric span {
    margin-top: 3px;
    font-size: 0.65rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    color: #94a3b8;
  }

  .demo-nav-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
    border: 1px solid transparent;
    border-radius: 12px;
    padding: 10px;
    text-align: left;
    transition: 150ms ease;
  }

  .demo-nav-item:hover,
  .demo-nav-item-active {
    border-color: color-mix(in srgb, var(--color-primary) 30%, transparent);
    background: var(--color-primary-bg);
  }

  .demo-nav-item > span:first-child {
    display: flex;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    color: var(--color-primary);
    background: var(--color-primary-bg);
  }

  .demo-nav-item-active > span:first-child {
    color: white;
    background: var(--color-primary);
  }

  .demo-nav-item strong,
  .demo-nav-item small {
    display: block;
  }

  .demo-nav-item strong {
    font-size: 0.8rem;
    color: #1e293b;
  }

  .demo-nav-item small {
    display: -webkit-box;
    margin-top: 3px;
    overflow: hidden;
    font-size: 0.72rem;
    line-height: 1rem;
    color: #94a3b8;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .invoke-btn {
    width: 100%;
    margin-top: 10px;
    border-radius: 9px;
    padding: 9px 10px;
    font-size: 0.75rem;
    font-weight: 800;
    color: white;
    background: #7c3aed;
    transition: 150ms ease;
  }

  .invoke-btn:hover:not(:disabled) {
    background: #6d28d9;
  }

  .invoke-btn:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .contract-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border-radius: 9999px;
    padding: 5px 8px;
    color: #475569;
    background: #f1f5f9;
  }

  .event-row {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 9px;
    border-radius: 9px;
    padding: 9px 10px;
    font-size: 0.75rem;
    color: #64748b;
    background: #f8fafc;
  }

  .event-row code {
    color: #475569;
  }

  .event-row time {
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.65rem;
    color: #94a3b8;
  }

  .event-dot {
    width: 6px;
    height: 6px;
    flex-shrink: 0;
    border-radius: 9999px;
  }

  .event-dot-blue { background: #3b82f6; }
  .event-dot-violet { background: #8b5cf6; }
  .event-dot-emerald { background: #10b981; }
  .event-dot-amber { background: #f59e0b; }

  :global(.dark) .demo-nav-item strong {
    color: #f8fafc;
  }

  :global(.dark) .contract-chip,
  :global(.dark) .event-row {
    color: #94a3b8;
    background: #0f172a;
  }

  :global(.dark) .event-row code {
    color: #cbd5e1;
  }

  :global(.dark) .showcase-header {
    background:
      radial-gradient(
        circle at 92% -20%,
        color-mix(in srgb, var(--color-primary) 28%, transparent),
        transparent 40%
      ),
      linear-gradient(
        115deg,
        color-mix(in srgb, var(--color-primary) 16%, #020617),
        color-mix(in srgb, var(--color-primary) 18%, #0f172a) 58%,
        color-mix(in srgb, var(--color-primary) 22%, #1e1b4b)
      );
  }

  :global(.dark) .showcase-badge {
    border-color: color-mix(in srgb, var(--color-primary) 35%, transparent);
    color: #bae6fd;
    background: color-mix(in srgb, var(--color-primary) 18%, transparent);
  }

  :global(.dark) .showcase-code {
    color: #bae6fd;
    background: rgba(255, 255, 255, 0.08);
  }

  :global(.dark) .header-metric {
    border-color: rgba(255, 255, 255, 0.1);
    color: white;
    background: rgba(255, 255, 255, 0.06);
  }

  @media (max-width: 640px) {
    .header-metric {
      min-width: 0;
    }
  }
</style>
