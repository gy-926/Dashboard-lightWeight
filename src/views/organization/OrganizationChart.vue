<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { DepartmentRecord } from '@/api/dashboard-admin';

const props = defineProps<{
  departments: DepartmentRecord[];
  users: Array<{ user_id: string; name: string | null; email: string | null; department_id: string | null }>;
}>();

const emit = defineEmits<{
  create: [parentId: string | null];
  add: [department: DepartmentRecord];
  addUsers: [department: DepartmentRecord];
  edit: [department: DepartmentRecord];
  remove: [department: DepartmentRecord];
}>();

const cardWidth = 188;
const cardHeight = 126;
const horizontalGap = 40;
const verticalGap = 100;
const edgePadding = 80;

interface ChartNode {
  department: DepartmentRecord;
  x: number;
  y: number;
}

const viewport = ref<HTMLElement | null>(null);
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);
const search = ref('');
const activeMatch = ref<string | null>(null);
const collapsedIds = ref<Set<string>>(new Set());
const selectedDepartmentId = ref<string | null>(null);
const dragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let originX = 0;
let originY = 0;

const chart = computed(() => {
  const byParent = new Map<string | null, DepartmentRecord[]>();
  const ids = new Set(props.departments.map(item => item.id));
  for (const department of props.departments) {
    const parentId = department.parent_id && ids.has(department.parent_id) ? department.parent_id : null;
    byParent.set(parentId, [...(byParent.get(parentId) ?? []), department]);
  }
  const spans = new Map<string, number>();
  const measuring = new Set<string>();
  const measure = (department: DepartmentRecord): number => {
    if (spans.has(department.id)) return spans.get(department.id)!;
    if (measuring.has(department.id)) return cardWidth;
    measuring.add(department.id);
    const children = collapsedIds.value.has(department.id) ? [] : (byParent.get(department.id) ?? []).filter(item => !measuring.has(item.id));
    const childWidth = children.reduce((sum, child) => sum + measure(child), 0) + Math.max(0, children.length - 1) * horizontalGap;
    const width = Math.max(cardWidth, childWidth);
    spans.set(department.id, width);
    measuring.delete(department.id);
    return width;
  };
  const roots = byParent.get(null) ?? [];
  const totalWidth = roots.reduce((sum, item) => sum + measure(item), 0) + Math.max(0, roots.length - 1) * horizontalGap;
  const nodes: ChartNode[] = [];
  const edges: string[] = [];
  const visited = new Set<string>();
  const place = (department: DepartmentRecord, startX: number, depth: number) => {
    if (visited.has(department.id)) return;
    visited.add(department.id);
    const x = startX + (spans.get(department.id) ?? cardWidth) / 2;
    const y = edgePadding + depth * (cardHeight + verticalGap);
    nodes.push({ department, x, y });
    const children = collapsedIds.value.has(department.id) ? [] : byParent.get(department.id) ?? [];
    let nextX = startX;
    for (const child of children) {
      if (visited.has(child.id)) continue;
      const childWidth = spans.get(child.id) ?? cardWidth;
      const childX = nextX + childWidth / 2;
      const childY = edgePadding + (depth + 1) * (cardHeight + verticalGap);
      const middleY = y + cardHeight + verticalGap / 2;
      edges.push(`M ${x} ${y + cardHeight} V ${middleY} H ${childX} V ${childY}`);
      place(child, nextX, depth + 1);
      nextX += childWidth + horizontalGap;
    }
  };
  let startX = edgePadding;
  for (const root of roots) {
    place(root, startX, 0);
    startX += (spans.get(root.id) ?? cardWidth) + horizontalGap;
  }
  const maxDepth = nodes.reduce((max, node) => Math.max(max, Math.round((node.y - edgePadding) / (cardHeight + verticalGap))), 0);
  return {
    nodes,
    edges,
    width: Math.max(totalWidth + edgePadding * 2, cardWidth + edgePadding * 2),
    height: edgePadding * 2 + (maxDepth + 1) * cardHeight + maxDepth * verticalGap,
  };
});

const matches = computed(() => {
  const term = search.value.trim().toLowerCase();
  return term ? props.departments.filter(department => `${department.name} ${department.full_name} ${department.code} ${department.internal_code ?? ''}`.toLowerCase().includes(term)) : [];
});

const selectedDepartment = computed(() => props.departments.find(item => item.id === selectedDepartmentId.value) ?? null);
const selectedMembers = computed(() => props.users.filter(user => user.department_id === selectedDepartmentId.value));

const departmentStats = computed(() => {
  const directUsers = new Map<string, number>();
  for (const user of props.users) if (user.department_id) directUsers.set(user.department_id, (directUsers.get(user.department_id) ?? 0) + 1);
  const directChildren = new Map<string, number>();
  for (const item of props.departments) if (item.parent_id) directChildren.set(item.parent_id, (directChildren.get(item.parent_id) ?? 0) + 1);
  const stats = new Map<string, { departments: number; users: number }>();
  for (const item of props.departments) stats.set(item.id, { departments: directChildren.get(item.id) ?? 0, users: directUsers.get(item.id) ?? 0 });
  return stats;
});

function centerOn(node: ChartNode) {
  const element = viewport.value;
  if (!element) return;
  offsetX.value = element.clientWidth / 2 - node.x * scale.value;
  offsetY.value = element.clientHeight / 2 - (node.y + cardHeight / 2) * scale.value;
}

function fitChart() {
  const element = viewport.value;
  if (!element) return;
  scale.value = Math.max(0.35, Math.min(1, (element.clientWidth - 48) / chart.value.width, (element.clientHeight - 48) / chart.value.height));
  offsetX.value = (element.clientWidth - chart.value.width * scale.value) / 2;
  offsetY.value = (element.clientHeight - chart.value.height * scale.value) / 2;
}

function zoomTo(nextScale: number) {
  const element = viewport.value;
  if (!element) return;
  const oldScale = scale.value;
  const newScale = Math.max(0.35, Math.min(2, nextScale));
  const centerX = element.clientWidth / 2;
  const centerY = element.clientHeight / 2;
  offsetX.value = centerX - (centerX - offsetX.value) * newScale / oldScale;
  offsetY.value = centerY - (centerY - offsetY.value) * newScale / oldScale;
  scale.value = newScale;
}

async function findDepartment() {
  const target = matches.value[0];
  if (!target) return;
  const nextCollapsed = new Set(collapsedIds.value);
  const byId = new Map(props.departments.map(item => [item.id, item]));
  let parentId = target.parent_id;
  const seen = new Set<string>();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    nextCollapsed.delete(parentId);
    parentId = byId.get(parentId)?.parent_id ?? null;
  }
  collapsedIds.value = nextCollapsed;
  activeMatch.value = target.id;
  await nextTick();
  const node = chart.value.nodes.find(item => item.department.id === target.id);
  if (node) centerOn(node);
}

function resetSearch() {
  search.value = '';
  activeMatch.value = null;
  collapsedIds.value = new Set();
  nextTick(fitChart);
}

async function toggleChildren(node: ChartNode) {
  if (!(departmentStats.value.get(node.department.id)?.departments ?? 0)) return;
  const nextCollapsed = new Set(collapsedIds.value);
  if (nextCollapsed.has(node.department.id)) nextCollapsed.delete(node.department.id);
  else nextCollapsed.add(node.department.id);
  collapsedIds.value = nextCollapsed;
  await nextTick();
  const current = chart.value.nodes.find(item => item.department.id === node.department.id);
  if (current) centerOn(current);
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0 || (event.target as HTMLElement).closest('button, input, .organization-card')) return;
  dragging.value = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  originX = offsetX.value;
  originY = offsetY.value;
  viewport.value?.setPointerCapture(event.pointerId);
}

function moveDrag(event: PointerEvent) {
  if (!dragging.value) return;
  offsetX.value = originX + event.clientX - dragStartX;
  offsetY.value = originY + event.clientY - dragStartY;
}

function stopDrag(event: PointerEvent) {
  dragging.value = false;
  if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId);
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  zoomTo(scale.value * (event.deltaY < 0 ? 1.1 : 0.9));
}

let resizeObserver: ResizeObserver | null = null;
onMounted(async () => {
  await nextTick();
  fitChart();
  if (viewport.value) {
    resizeObserver = new ResizeObserver(fitChart);
    resizeObserver.observe(viewport.value);
  }
});
onUnmounted(() => resizeObserver?.disconnect());
watch(() => props.departments, () => nextTick(fitChart));
</script>

<template>
  <section class="organization-chart flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    <header class="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
      <div>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">组织全景图</h2>
        <p class="mt-1 text-xs text-slate-500">拖动画布浏览组织，点击左侧数字收起或展开下级，点击右侧人数查看直属人员</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <label class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400 dark:border-slate-700">
          <i class="fas fa-magnifying-glass" />
          <input v-model="search" class="w-40 bg-transparent text-slate-700 outline-none dark:text-slate-200" type="search" placeholder="搜索组织或部门" aria-label="搜索组织或部门" @keydown.enter="findDepartment" />
        </label>
        <button class="btn-primary rounded-lg px-3 py-2 text-sm" :disabled="!matches.length" @click="findDepartment">搜索</button>
        <button class="secondary-button" @click="resetSearch">重置</button>
        <button class="secondary-button" @click="emit('create', null)"><i class="fas fa-plus" />新建顶层机构</button>
      </div>
    </header>
    <div class="relative flex min-h-[400px] flex-1 flex-col">
      <div
        ref="viewport"
        class="organization-viewport relative min-h-[400px] flex-1 overflow-hidden select-none"
        :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="stopDrag"
        @pointercancel="stopDrag"
        @wheel="onWheel"
      >
        <div v-if="departments.length === 0" class="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
          <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-500"><i class="fas fa-sitemap" /></span>
          <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">还没有组织机构</p>
          <button class="btn-primary rounded-lg px-4 py-2 text-sm" @click="emit('create', null)">创建顶层机构</button>
        </div>
        <div v-else class="absolute left-0 top-0 origin-top-left" :style="{ width: `${chart.width}px`, height: `${chart.height}px`, transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }">
          <svg class="pointer-events-none absolute inset-0 overflow-visible" :width="chart.width" :height="chart.height" aria-hidden="true">
            <path v-for="(edge, index) in chart.edges" :key="index" :d="edge" fill="none" stroke="#cbd5e1" stroke-width="1.5" />
          </svg>
          <article
            v-for="node in chart.nodes"
            :key="node.department.id"
            class="organization-card group absolute flex flex-col items-center justify-center rounded-2xl border bg-white px-3 py-2 text-center shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
            :class="[activeMatch === node.department.id ? 'border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-700', node.department.is_active ? '' : 'opacity-60']"
            :style="{ left: `${node.x - cardWidth / 2}px`, top: `${node.y}px`, width: `${cardWidth}px`, height: `${cardHeight}px` }"
          >
            <span class="mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"><i :class="node.department.kind === 'organization' ? 'fas fa-building' : 'fas fa-sitemap'" /></span>
            <strong class="max-w-[126px] truncate text-sm text-slate-800 dark:text-slate-100" :title="node.department.full_name || node.department.name">{{ node.department.name }}</strong>
            <span class="text-[11px] text-slate-400">{{ node.department.kind === 'organization' ? '组织' : '部门' }}{{ node.department.is_active ? '' : ' · 已停用' }}</span>
            <div class="mt-1 flex items-center gap-1.5 text-[11px]">
              <button
                class="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-default disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200"
                :disabled="!(departmentStats.get(node.department.id)?.departments ?? 0)"
                :aria-label="`${collapsedIds.has(node.department.id) ? '展开' : '收起'} ${node.department.name} 的下级部门`"
                :aria-expanded="!collapsedIds.has(node.department.id)"
                :title="collapsedIds.has(node.department.id) ? '展开下级部门' : '收起下级部门'"
                @click="toggleChildren(node)"
              ><i class="fas fa-sitemap mr-1" />{{ departmentStats.get(node.department.id)?.departments ?? 0 }}</button>
              <button
                class="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
                :aria-label="`查看 ${node.department.name} 的直属人员`"
                title="查看直属人员"
                @click="selectedDepartmentId = node.department.id"
              ><i class="fas fa-users mr-1" />{{ departmentStats.get(node.department.id)?.users ?? 0 }}</button>
            </div>
            <div class="organization-actions pointer-events-none absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
              <button class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-sm text-blue-600 hover:bg-blue-100" :aria-label="`向 ${node.department.name} 添加部门或人员`" title="添加部门或人员" @click="emit('add', node.department)"><i class="fas fa-plus" /></button>
              <button class="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600 hover:bg-slate-200" :aria-label="`编辑 ${node.department.name}`" title="编辑" @click="emit('edit', node.department)"><i class="fas fa-pen" /></button>
              <button class="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-xs text-red-500 hover:bg-red-100" :aria-label="`删除 ${node.department.name}`" title="删除" @click="emit('remove', node.department)"><i class="fas fa-trash-can" /></button>
            </div>
          </article>
        </div>
      </div>
      <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <button aria-label="适应画布" title="适应画布" @click="fitChart"><i class="fas fa-arrows-to-circle" /></button>
        <span class="h-5 w-px bg-slate-200 dark:bg-slate-700" />
        <button aria-label="缩小" @click="zoomTo(scale - 0.1)"><i class="fas fa-minus" /></button>
        <span class="min-w-12 text-center">{{ Math.round(scale * 100) }}%</span>
        <button aria-label="放大" @click="zoomTo(scale + 0.1)"><i class="fas fa-plus" /></button>
      </div>
      <aside v-if="selectedDepartment" class="absolute right-4 top-4 z-10 w-[min(20rem,calc(100%-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800" :aria-label="`${selectedDepartment.name} 的人员`">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white">{{ selectedDepartment.name }} · 人员</h3>
            <p class="mt-1 text-xs text-slate-500">直属人员 {{ selectedMembers.length }} 人</p>
          </div>
          <button class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" aria-label="关闭人员列表" @click="selectedDepartmentId = null"><i class="fas fa-xmark" /></button>
        </div>
        <button class="mt-3 w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20" @click="emit('addUsers', selectedDepartment)"><i class="fas fa-user-plus mr-1" />从用户列表添加人员</button>
        <p v-if="selectedMembers.length === 0" class="mt-4 rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-500 dark:bg-slate-900">暂无直属人员</p>
        <ul v-else class="mt-3 max-h-72 space-y-1 overflow-y-auto">
          <li v-for="user in selectedMembers" :key="user.user_id" class="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 dark:text-slate-200">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30"><i class="fas fa-user" /></span>
            <span class="min-w-0 flex-1"><strong class="block truncate font-medium">{{ user.name || user.email || user.user_id }}</strong><small v-if="user.name && user.email" class="block truncate text-slate-400">{{ user.email }}</small></span>
            <span v-if="selectedDepartment.manager_user_id === user.user_id" class="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-600 dark:bg-blue-900/30">负责人</span>
          </li>
        </ul>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.organization-viewport {
  background-color: #f9fbff;
  background-image: radial-gradient(#c9d8f4 1px, transparent 1px);
  background-size: 26px 26px;
}
.secondary-button {
  @apply inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white;
}
:global(.dark) .organization-viewport {
  background-color: #0f172a;
  background-image: radial-gradient(#334155 1px, transparent 1px);
}
@media (hover: none) {
  .organization-actions { opacity: 1; pointer-events: auto; }
}
</style>
