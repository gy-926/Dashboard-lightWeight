<script setup lang="ts">
import { ref, watch } from 'vue'
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

// 自定义颜色输入
const customColorInput = ref(menuStore.theme.primaryColor)
const showCustomColor = ref(false)

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

// 选择预设颜色
function selectColor(color: string) {
  localTheme.value.primaryColor = color
  customColorInput.value = color
  showCustomColor.value = false
}

// 自定义颜色选择
function handleCustomColorChange(e: Event) {
  const input = e.target as HTMLInputElement
  const color = input.value
  customColorInput.value = color
  localTheme.value.primaryColor = color
}

// 切换自定义颜色面板
function toggleCustomColor() {
  showCustomColor.value = !showCustomColor.value
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
        class="fixed inset-0 bg-black/50 z-[200]"
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
        class="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-[201] flex flex-col"
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
                    ? 'border-primary bg-primary-bg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                ]"
                @click="localTheme.layout = option.value as any"
              >
                <i :class="['fas', option.icon, 'text-xl', localTheme.layout === option.value ? 'text-primary' : 'text-gray-400']" />
                <span class="text-xs" :class="localTheme.layout === option.value ? 'text-primary' : 'text-gray-500 dark:text-gray-400'">
                  {{ option.label }}
                </span>
              </button>
            </div>
          </div>

          <!-- 主题色 - 预设 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              主题颜色
            </label>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="color in colorPresets"
                :key="color"
                class="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2"
                :style="{ backgroundColor: color }"
                :class="{ 'ring-2 ring-offset-2': localTheme.primaryColor === color, 'ring-white dark:ring-gray-800': localTheme.primaryColor !== color }"
                @click="selectColor(color)"
              />
            </div>
          </div>

          <!-- 自定义颜色 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              自定义颜色
            </label>
            <div class="flex items-center gap-3">
              <!-- 颜色预览 -->
              <div
                class="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 overflow-hidden cursor-pointer"
                @click="toggleCustomColor"
              >
                <input
                  type="color"
                  :value="customColorInput"
                  class="w-14 h-14 -ml-2 -mt-2 cursor-pointer"
                  @input="handleCustomColorChange"
                />
              </div>
              <input
                type="text"
                v-model="customColorInput"
                class="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
                placeholder="#3b82f6"
                @change="(e) => selectColor((e.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <!-- 显示设置 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              显示设置
            </label>
            <div class="space-y-3">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm text-gray-600 dark:text-gray-400">暗色模式</span>
                <div
                  class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                  :class="localTheme.darkMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
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
                  class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                  :class="localTheme.showTabs ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
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
                  class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                  :class="localTheme.showBreadcrumb ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
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
                  class="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                  :class="localTheme.showFooter ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'"
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
            class="w-full py-2.5 bg-primary hover:opacity-90 text-white rounded-lg transition-colors font-medium"
            @click="closeDrawer"
          >
            确定
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
