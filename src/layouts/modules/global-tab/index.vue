<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useMenuStore } from '../global-menu/store';
  import { useKiviiOpenTab } from '@/composables/useKiviiOpenTab';

  const menuStore = useMenuStore();
  const route = useRoute();
  const router = useRouter();
  const { openPath } = useKiviiOpenTab();

  // 标签页列表 - 按添加顺序从左往右排列
  const tabsList = computed(() => menuStore.tabsList);

  // 激活的标签
  const activeTab = computed(() => route.path);

  // 容器引用
  const containerRef = ref<HTMLElement | null>(null);

  // 是否可以关闭（至少保留一个标签）
  function canClose(path: string): boolean {
    return true;
  }

  // 关闭标签
  async function closeTab(path: string, e: Event) {
    e.stopPropagation();
    const index = menuStore.tabsList.findIndex(t => t.path === path);
    if (index > -1) {
      const wasActive = path === activeTab.value;
      await menuStore.removeTab(path);

      // 如果列表为空，跳转到空白页
      if (menuStore.tabsList.length === 0) {
        router.push('/blank');
        return;
      }

      // 如果关闭的是当前激活的标签，跳转到最后一个标签
      if (wasActive) {
        const lastTab = menuStore.tabsList[menuStore.tabsList.length - 1];
        openPath(lastTab.path);
      }
    }
  }

  // 拖拽滚动相关
  const isDragging = ref(false);
  const startX = ref(0);
  const scrollLeft = ref(0);

  // 自动滚动到当前激活的标签
  function scrollToActiveTab() {
    if (!containerRef.value) return;

    const activeTabEl = containerRef.value.querySelector('.bg-primary-bg');
    if (!activeTabEl) return;

    const container = containerRef.value;
    const tabRect = activeTabEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // 如果当前标签在可视区域外，则滚动到可见位置
    if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
      const scrollLeft = tabRect.left - containerRect.left + container.scrollLeft;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }

  // 监听路由变化，自动滚动到当前激活的标签
  watch(
    () => route.path,
    () => {
      nextTick(() => {
        scrollToActiveTab();
      });
    },
    { immediate: true }
  );

  function handleMouseDown(e: MouseEvent) {
    if (!containerRef.value) return;
    isDragging.value = true;
    startX.value = e.pageX;
    scrollLeft.value = containerRef.value.scrollLeft;
    containerRef.value.style.cursor = 'grabbing';
    containerRef.value.style.userSelect = 'none';
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging.value || !containerRef.value) return;
    e.preventDefault();
    const x = e.pageX;
    const walk = (x - startX.value) * 1.5; // 拖拽速度
    containerRef.value.scrollLeft = scrollLeft.value - walk;
  }

  function handleMouseUp() {
    if (!containerRef.value) return;
    isDragging.value = false;
    containerRef.value.style.cursor = 'grab';
    containerRef.value.style.userSelect = '';
  }

  function handleMouseLeave() {
    if (isDragging.value) {
      handleMouseUp();
    }
  }

  onMounted(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
  });

  onUnmounted(() => {
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('mouseleave', handleMouseLeave);
  });
</script>

<template>
  <div class="h-9 bg-white dark:bg-gray-800 flex items-center px-2 overflow-hidden">
    <!-- 标签容器 - 支持横向拖拽滚动 -->
    <div
      ref="containerRef"
      class="flex items-center gap-1 flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-x cursor-grab"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      style="margin-top: 10px"
    >
      <template
        v-for="tab in tabsList"
        :key="tab.path"
      >
        <div
          class="group flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-all duration-200 whitespace-nowrap border border-transparent flex-shrink-0"
          :class="[
            activeTab === tab.path
              ? 'bg-primary-bg text-primary border-primary/30 dark:bg-gray-700'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600',
          ]"
          @click="openPath(tab.path)"
        >
          <i
            v-if="tab.icon"
            :class="[
              'fas',
              tab.icon,
              'text-xs flex-shrink-0',
              activeTab === tab.path ? 'text-primary' : 'text-gray-400 dark:text-gray-500',
            ]"
          />
          <span
            class="truncate max-w-[100px]"
            :class="activeTab === tab.path ? 'text-primary' : ''"
            >{{ tab.title }}</span
          >
          <button
            v-if="canClose(tab.path) || activeTab === tab.path"
            class="w-4 h-4 rounded-full flex items-center justify-center transition-all"
            :class="[
              activeTab === tab.path
                ? 'opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600',
            ]"
            @click="closeTab(tab.path, $event)"
          >
            <i
              class="fas fa-times text-[12px] not-italic"
              :class="
                activeTab === tab.path
                  ? 'text-primary dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              "
            />
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .scrollbar-x {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
  }

  .scrollbar-x::-webkit-scrollbar {
    height: 4px;
  }

  .scrollbar-x::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-x::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);
    border-radius: 4px;
  }

  .scrollbar-x::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.5);
  }

  .cursor-grab {
    cursor: grab;
  }

  .cursor-grab:active {
    cursor: grabbing;
  }
</style>
