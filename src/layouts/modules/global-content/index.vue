<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '../global-menu/store'

const props = withDefaults(defineProps<{
  showTabs?: boolean
  keepAlive?: boolean
}>(), {
  showTabs: true,
  keepAlive: true,
})

const menuStore = useMenuStore()
const route = useRoute()

// 检查是否为动态路由（需要禁用 keep-alive）
const isDynamicRoute = computed(() => {
  const path = route.path
  // 动态路由通常以 /custom_ 或 /bridge_ 开头
  return path.startsWith('/custom_') || path.startsWith('/bridge_')
})

// 是否应该使用 keep-alive（动态路由不使用）
const shouldKeepAlive = computed(() => {
  return props.keepAlive && !isDynamicRoute.value
})

// 缓存的组件列表（使用路由路径作为缓存 key）
const cachedViews = computed(() => {
  return menuStore.tabsList
    .map(tab => tab.path)
    .filter((path): path is string => !!path)
})

const showTabs = computed(() => props.showTabs && menuStore.theme.showTabs)
</script>

<template>
  <main class="flex-1 flex flex-col min-h-0 bg-transparent dark:bg-transparent">
    <!-- 面包屑和标签页同一行 -->
    <div class="flex items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 h-10">
      <!-- 标签页 -->
      <GlobalTab v-if="showTabs" class="flex-1 min-w-0" />
      <!-- 面包屑 -->
      <div class="flex items-center flex-shrink-0 ml-4 overflow-hidden">
        <GlobalBreadcrumb v-if="menuStore.theme.showBreadcrumb" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-0 relative">
      <!-- Teleport 目标容器：只接收当前激活页面的内容 -->
      <div
        id="global-content-teleport-target"
        class="absolute inset-0 pointer-events-auto"
        style="z-index: 1;"
      />

      <div class="mx-auto max-w-7xl min-h-full relative z-0">
        <template v-if="shouldKeepAlive">
          <router-view v-slot="{ Component }">
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <keep-alive :include="cachedViews">
                <component :is="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </template>

        <template v-else>
          <router-view v-slot="{ Component }">
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <component :is="Component" />
            </transition>
          </router-view>
        </template>
      </div>
    </div>
  </main>
</template>
