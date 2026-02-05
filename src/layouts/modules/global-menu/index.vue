<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from './store'
import type { MenuItem } from './types'
import { useKiviiOpenTab } from '@/composables/useKiviiOpenTab'

// 递归组件定义
defineOptions({
  name: 'GlobalMenuItem'
})

const props = defineProps<{
  menu: MenuItem[]
  collapsed?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', item: MenuItem): void
}>()

const route = useRoute()
const menuStore = useMenuStore()
const { openPath } = useKiviiOpenTab()

const selectedKey = computed(() => route.path)
const openKeys = computed(() => menuStore.openKeys)

// 当前 hover 的一级菜单
const hoveredKey = ref<string | null>(null)
// 当前 hover 的二级菜单
const subHoveredKey = ref<string | null>(null)

// 延迟关闭时间（毫秒）
const closeDelay = 200
let closeTimer: ReturnType<typeof setTimeout> | null = null

function hasChildren(item: MenuItem): boolean {
  return !!(item.children && item.children.length > 0)
}

function isOpen(key: string): boolean {
  return openKeys.value.includes(key)
}

function toggleOpen(key: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  menuStore.toggleOpenKey(key)
}

async function handleSelect(item: MenuItem) {
  emit('select', item)
  await openPath(item.path)
}

// 检查当前路由是否在某个父菜单下
function isChildOfMenu(menuPath: string): boolean {
  return selectedKey.value.startsWith(menuPath) && selectedKey.value !== menuPath
}

// 判断是否是 hover 的一级菜单
function isHovered(key: string): boolean {
  return hoveredKey.value === key && props.collapsed
}

// 判断是否是 hover 的二级菜单
function isSubHovered(key: string): boolean {
  return subHoveredKey.value === key && props.collapsed
}

// 鼠标进入一级菜单 - 展开子菜单
function handleMouseEnter(key: string) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  hoveredKey.value = key
  if (props.collapsed && hasChildren(menuStore.menuList.find(item => item.key === key)!)) {
    menuStore.openKey(key)
  }
}

// 鼠标进入二级菜单 - 展开三级子菜单
function handleSubMouseEnter(key: string) {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  subHoveredKey.value = key
}

// 鼠标离开菜单区域 - 延迟关闭
function handleMouseLeave() {
  if (closeTimer) {
    clearTimeout(closeTimer)
  }
  closeTimer = setTimeout(() => {
    hoveredKey.value = null
    subHoveredKey.value = null
    if (props.collapsed) {
      menuStore.closeAllKeys()
    }
  }, closeDelay)
}

// 清除延迟关闭定时器
function cancelCloseTimer() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

// 下拉菜单位置状态
const dropdownPosition = ref<{ top: string; left: string } | null>(null)

// 获取下拉菜单位置
function updateDropdownPosition(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  dropdownPosition.value = {
    top: `${rect.top}px`,
    left: `${rect.right}px`
  }
}

// 重置下拉菜单位置
function resetDropdownPosition() {
  dropdownPosition.value = null
}
</script>

<template>
  <ul class="space-y-1">
    <template v-for="item in menu" :key="item.key">
      <!-- 无子菜单的菜单项 -->
      <li v-if="!hasChildren(item)">
        <button
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left"
          :class="[
            selectedKey === item.path
              ? 'bg-primary-bg text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          ]"
          :title="item.title"
          @click="handleSelect(item)"
        >
          <i v-if="item.icon" :class="['fas', item.icon, 'w-5 h-5 flex-shrink-0']" />
          <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
        </button>
      </li>

      <!-- 有子菜单的菜单项 -->
      <li v-else class="relative">
        <!-- 父级菜单 - 折叠时不可点击，展开时点击展开/收起 -->
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
          :class="[
            selectedKey.startsWith(item.path)
              ? 'bg-primary-bg text-primary font-medium'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          ]"
          :title="item.title"
          @click="collapsed ? undefined : toggleOpen(item.key, $event)"
          @mouseenter="handleMouseEnter(item.key); updateDropdownPosition($event)"
          @mouseleave="handleMouseLeave"
        >
          <i v-if="item.icon" :class="['fas', item.icon, 'w-5 h-5 flex-shrink-0']" />
          <template v-if="!collapsed">
            <span class="flex-1 truncate">{{ item.title }}</span>
            <i
              class="fas text-xs transition-transform duration-200"
              :class="[
                isOpen(item.key) || isChildOfMenu(item.path) ? 'fa-chevron-up rotate-180' : 'fa-chevron-down'
              ]"
            />
          </template>
          <template v-else>
            <span class="sr-only">{{ item.title }}</span>
          </template>
        </button>

        <!-- 折叠状态下的 hover 下拉面板 -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-x-2"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-2"
        >
          <div
            v-if="collapsed && isHovered(item.key)"
            class="fixed z-[999] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-[calc(100vh-64px)] overflow-y-auto"
            :style="dropdownPosition ? { top: dropdownPosition.top, left: dropdownPosition.left } : {}"
            @mouseenter="cancelCloseTimer"
            @mouseleave="handleMouseLeave"
          >
            <!-- 父级标题 -->
            <div class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              {{ item.title }}
            </div>
            <!-- 子菜单列表 -->
            <div class="py-1">
              <template v-for="child in item.children" :key="child.key">
                <!-- 无三级子菜单的二级菜单 -->
                <button
                  v-if="!hasChildren(child)"
                  class="flex items-center gap-2 px-3 py-2 text-sm transition-colors mx-1 rounded w-full text-left"
                  :class="[
                    selectedKey === child.path
                      ? 'bg-primary-bg text-primary font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  ]"
                  :title="child.title"
                  @click="handleSelect(child)"
                >
                  <i v-if="child.icon" :class="['fas', child.icon, 'w-4 h-4 flex-shrink-0']" />
                  <span class="truncate">{{ child.title }}</span>
                </button>
                <!-- 有三级子菜单的二级菜单 -->
                <div
                  v-else
                  class="relative"
                  @mouseenter="handleSubMouseEnter(child.key); updateDropdownPosition($event)"
                  @mouseleave="handleMouseLeave"
                >
                  <button
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors mx-1 rounded text-left"
                    :class="[
                      selectedKey.startsWith(child.path)
                        ? 'bg-primary-bg text-primary font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    ]"
                    :title="child.title"
                  >
                    <i v-if="child.icon" :class="['fas', child.icon, 'w-4 h-4 flex-shrink-0']" />
                    <span class="flex-1 truncate">{{ child.title }}</span>
                    <i class="fas fa-chevron-right text-xs opacity-50" />
                  </button>
                  <!-- 三级子菜单下拉面板 -->
                  <Transition
                    enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 translate-x-1"
                    enter-to-class="opacity-100 translate-x-0"
                    leave-active-class="transition-all duration-150 ease-in"
                    leave-from-class="opacity-100 translate-x-0"
                    leave-to-class="opacity-0 translate-x-1"
                  >
                    <div
                      v-if="isSubHovered(child.key)"
                      class="fixed z-[999] w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 max-h-[calc(100vh-64px)] overflow-y-auto"
                      :style="dropdownPosition ? { top: dropdownPosition.top, left: dropdownPosition.left } : {}"
                      @mouseenter="cancelCloseTimer"
                      @mouseleave="handleMouseLeave"
                    >
                      <!-- 三级子菜单列表 -->
                      <div class="py-1">
                        <div class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                          {{ child.title }}
                        </div>
                        <button
                          v-for="subChild in child.children"
                          :key="subChild.key"
                          class="flex items-center gap-2 px-3 py-2 text-sm transition-colors mx-1 rounded w-full text-left"
                          :class="[
                            selectedKey === subChild.path
                              ? 'bg-primary-bg text-primary font-medium'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          ]"
                          :title="subChild.title"
                          @click="handleSelect(subChild)"
                        >
                          <i v-if="subChild.icon" :class="['fas', subChild.icon, 'w-3.5 h-3.5 flex-shrink-0']" />
                          <span class="truncate">{{ subChild.title }}</span>
                        </button>
                      </div>
                    </div>
                  </Transition>
                </div>
              </template>
            </div>
          </div>
        </Transition>

        <!-- 展开状态下的子菜单 -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div v-if="!collapsed && (isOpen(item.key) || isChildOfMenu(item.path))" class="ml-4 mt-1 space-y-1">
            <GlobalMenuItem
              :menu="item.children || []"
              :collapsed="collapsed"
              @select="emit('select', $event)"
            />
          </div>
        </Transition>
      </li>
    </template>
  </ul>
</template>
