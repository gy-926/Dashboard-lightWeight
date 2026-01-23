<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMenuStore } from '../global-menu/store'

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), {
  modelValue: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const menuStore = useMenuStore()

// 布局模式选项
const layoutOptions = [
  { value: 'side', label: '侧边菜单', icon: 'fa-columns' },
  { value: 'top', label: '顶部菜单', icon: 'fa-window-maximize' },
  { value: 'mix', label: '混合菜单', icon: 'fa-th' },
]

// 主题颜色预设
const colorPresets = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
]

// 主题配置（本地副本）
const localTheme = ref({
  layout: menuStore.theme.layout,
  primaryColor: menuStore.theme.primaryColor,
  darkMode: menuStore.theme.darkMode,
  showTabs: menuStore.theme.showTabs,
  showBreadcrumb: menuStore.theme.showBreadcrumb,
  showFooter: menuStore.theme.showFooter,
})

// 同步本地配置到 store
watch(localTheme, (val) => {
  menuStore.setTheme(val)
}, { deep: true })

// 关闭抽屉
function closeDrawer() {
  emit('update:modelValue', false)
}

// 选择颜色
function selectColor(color: string) {
  localTheme.value.primaryColor = color
}
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/50 z-40"
        @click="closeDrawer"
      />
    </Transition>

    <!-- 抽屉 -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="modelValue"
        class="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
      >
        <!-- 头部 -->
        <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">主题设置</h2>
          <button
            class="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="closeDrawer"
          >
            <i class="fas fa-times" />
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- 布局模式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              布局模式
            </label>
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="option in layoutOptions"
                :key="option.value"
                class="flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all"
                :class="[
                  localTheme.layout === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
                @click="localTheme.layout = option.value as any"
              >
                <i :class="['fas', option.icon, 'text-xl', localTheme.layout === option.value ? 'text-blue-500' : 'text-gray-400']" />
                <span class="text-xs" :class="localTheme.layout === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
                  {{ option.label }}
                </span>
              </button>
            </div>
          </div>

          <!-- 主题色 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              主题颜色
            </label>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="color in colorPresets"
                :key="color"
                class="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :style="{ backgroundColor: color }"
                :class="{ 'ring-2 ring-offset-2 ring-blue-500': localTheme.primaryColor === color }"
                @click="selectColor(color)"
              />
            </div>
          </div>

          <!-- 暗色模式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              显示设置
            </label>
            <div class="space-y-3">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-gray-600 dark:text-gray-400">暗色模式</span>
                <div
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="localTheme.darkMode ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
                  @click="localTheme.darkMode = !localTheme.darkMode"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="localTheme.darkMode ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
              </label>

              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-gray-600 dark:text-gray-400">显示标签页</span>
                <div
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="localTheme.showTabs ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
                  @click="localTheme.showTabs = !localTheme.showTabs"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="localTheme.showTabs ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
              </label>

              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-gray-600 dark:text-gray-400">显示面包屑</span>
                <div
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="localTheme.showBreadcrumb ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
                  @click="localTheme.showBreadcrumb = !localTheme.showBreadcrumb"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="localTheme.showBreadcrumb ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
              </label>

              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-gray-600 dark:text-gray-400">显示页脚</span>
                <div
                  class="relative w-11 h-6 rounded-full transition-colors"
                  :class="localTheme.showFooter ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'"
                  @click="localTheme.showFooter = !localTheme.showFooter"
                >
                  <div
                    class="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                    :class="localTheme.showFooter ? 'translate-x-5' : 'translate-x-0'"
                  />
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            class="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            @click="closeDrawer"
          >
            确定
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
