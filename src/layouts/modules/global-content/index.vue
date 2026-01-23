<script setup lang="ts">
import { computed } from 'vue'
import { useMenuStore } from '../global-menu/store'

const props = withDefaults(defineProps<{
  showTabs?: boolean
  keepAlive?: boolean
}>(), {
  showTabs: true,
  keepAlive: true,
})

const menuStore = useMenuStore()

const cachedViews = computed(() => {
  return menuStore.tabsList.map(tab => tab.path)
})

const showTabs = computed(() => props.showTabs && menuStore.theme.showTabs)
</script>

<template>
  <main class="flex-1 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900">
    <!-- 面包屑和标签页同一行 -->
    <div class="flex items-center bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 h-10">
      <!-- 标签页 - 固定在左侧 -->
      <GlobalTab v-if="showTabs" class="flex-shrink-0" />
      <!-- 面包屑 - 在标签右侧 -->
      <div class="flex items-center flex-1 min-w-0 ml-4 overflow-hidden">
        <GlobalBreadcrumb v-if="menuStore.theme.showBreadcrumb" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-4 md:p-6">
      <div class="mx-auto max-w-7xl">
        <template v-if="keepAlive">
          <router-view v-slot="{ Component, route: r }">
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <keep-alive :include="cachedViews">
                <component :is="Component" :key="r.path" />
              </keep-alive>
            </transition>
          </router-view>
        </template>

        <template v-else>
          <router-view v-slot="{ Component, route: r }">
            <transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-2"
            >
              <component :is="Component" :key="r.path" />
            </transition>
          </router-view>
        </template>
      </div>
    </div>
  </main>
</template>
