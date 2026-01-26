<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMenuStore } from './store'
import type { MenuItem } from './types'

defineOptions({
  name: 'GlobalTopMenu'
})

const props = defineProps<{
  menu: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'select', item: MenuItem): void
}>()

const router = useRouter()
const route = useRoute()
const menuStore = useMenuStore()

// 菜单容器引用
const containerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

// 更多菜单状态
const moreMenuVisible = ref(false)
const moreMenuOpenKeys = ref<string[]>([])

// 配置
const MENU_ITEM_EST_WIDTH = 120 // 每个菜单项估算宽度
const MORE_BUTTON_WIDTH = 80 // 更多按钮宽度

const selectedKey = computed(() => route.path)
const openKeys = computed(() => menuStore.openKeys)

// 可见菜单（未隐藏的）
const visibleMenus = computed(() => {
  return props.menu.filter(item => !item.hidden)
})

// 计算可见菜单数量
const visibleCount = computed(() => {
  if (!containerRef.value || !menuRef.value) {
    return visibleMenus.value.length
  }

  const containerWidth = containerRef.value.clientWidth
  const menuWidth = menuRef.value.scrollWidth

  // 如果菜单宽度小于容器宽度，全部显示
  if (menuWidth <= containerWidth) {
    return visibleMenus.value.length
  }

  // 计算能显示多少个菜单项
  const availableWidth = containerWidth - MORE_BUTTON_WIDTH
  const count = Math.floor(availableWidth / MENU_ITEM_EST_WIDTH)

  return Math.max(1, count) // 至少显示1个
})

// 溢出的菜单项
const overflowedMenus = computed(() => {
  return visibleMenus.value.slice(visibleCount.value)
})

// 是否显示更多按钮
const showMoreButton = computed(() => {
  return overflowedMenus.value.length > 0
})

// 判断是否应该显示下拉箭头
function hasChildren(item: MenuItem): boolean {
  return !!(item.children && item.children.length > 0)
}

// 处理菜单选择
function handleSelect(item: MenuItem) {
  emit('select', item)
  if (!hasChildren(item)) {
    router.push(item.path)
  }
}

// 鼠标进入菜单项（主菜单）
function handleMouseEnter(key: string) {
  menuStore.openKey(key)
}

// 鼠标离开菜单项（主菜单）
function handleMouseLeave() {
  menuStore.closeAllKeys()
}

// 判断菜单项是否激活
function isActive(item: MenuItem): boolean {
  if (!hasChildren(item)) {
    return selectedKey.value === item.path
  }
  return selectedKey.value.startsWith(item.path)
}

// 显示更多菜单
function showMoreMenu() {
  moreMenuVisible.value = true
}

// 隐藏更多菜单
function hideMoreMenu() {
  moreMenuVisible.value = false
  moreMenuOpenKeys.value = [] // 重置更多菜单的展开状态
}

// 鼠标进入更多菜单中的项
function handleMoreMenuEnter(key: string) {
  if (!moreMenuOpenKeys.value.includes(key)) {
    moreMenuOpenKeys.value.push(key)
  }
}

// 鼠标离开更多菜单中的项
function handleMoreMenuLeave() {
  moreMenuOpenKeys.value = []
}

// 检查更多菜单中某个 key 是否展开
function isMoreMenuOpen(key: string): boolean {
  return moreMenuOpenKeys.value.includes(key)
}

// 监听窗口大小变化，重置更多菜单状态
function handleResize() {
  moreMenuVisible.value = false
  moreMenuOpenKeys.value = []
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <nav class="h-full relative">
    <!-- 菜单容器 -->
    <div ref="containerRef" class="h-full w-full">
      <ul ref="menuRef" class="flex items-center h-full">
        <template v-for="(item, index) in visibleMenus" :key="item.key">
          <!-- 只显示在可见范围内的菜单项 -->
          <template v-if="index < visibleCount">
            <!-- 一级菜单项（无子菜单） -->
            <li v-if="!hasChildren(item)" class="h-full flex-shrink-0">
              <router-link
                :to="item.path"
                class="h-full flex items-center gap-2 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px"
                :class="[
                  selectedKey === item.path
                    ? 'text-primary border-primary dark:text-primary-dark dark:border-primary-dark'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                ]"
                @click="handleSelect(item)"
              >
                <i v-if="item.icon" :class="['fas', item.icon, 'text-base']" />
                <span class="truncate max-w-[100px]">{{ item.title }}</span>
              </router-link>
            </li>

            <!-- 有子菜单的一级菜单项 -->
            <li
              v-else
              class="h-full relative flex-shrink-0"
              @mouseenter="handleMouseEnter(item.key)"
              @mouseleave="handleMouseLeave"
            >
              <button
                class="h-full flex items-center gap-2 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px"
                :class="[
                  openKeys.includes(item.key) || isActive(item)
                    ? 'text-primary border-primary dark:text-primary-dark dark:border-primary-dark'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
                ]"
              >
                <i v-if="item.icon" :class="['fas', item.icon, 'text-base']" />
                <span class="truncate max-w-[100px]">{{ item.title }}</span>
                <i class="fas fa-chevron-down text-xs transition-transform duration-200 flex-shrink-0" :class="{ 'rotate-180': openKeys.includes(item.key) }" />
              </button>

              <!-- 子菜单水平展示在父菜单下方 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div
                  v-if="openKeys.includes(item.key)"
                  class="absolute left-0 top-full pt-1 z-50"
                  @mouseenter="handleMouseEnter(item.key)"
                  @mouseleave="handleMouseLeave"
                >
                  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48">
                    <ul class="flex flex-col">
                      <template v-for="child in item.children" :key="child.key">
                        <!-- 二级菜单项 -->
                        <li v-if="!hasChildren(child)">
                          <router-link
                            :to="child.path"
                            class="flex items-center gap-3 px-4 py-2 text-sm transition-colors whitespace-nowrap"
                            :class="[
                              selectedKey === child.path
                                ? 'bg-primary-bg text-primary dark:text-primary-dark'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                            ]"
                            @click="handleSelect(child)"
                          >
                            <i v-if="child.icon" :class="['fas', child.icon, 'w-5']" />
                            <span>{{ child.title }}</span>
                          </router-link>
                        </li>
                        <!-- 有三级菜单的二级菜单 -->
                        <li
                          v-else
                          class="relative group/submenu"
                          @mouseenter="handleMouseEnter(child.key)"
                          @mouseleave="handleMouseLeave"
                        >
                          <button
                            class="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors whitespace-nowrap text-left"
                            :class="[
                              selectedKey.startsWith(child.path)
                                ? 'bg-primary-bg text-primary dark:text-primary-dark'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                            ]"
                          >
                            <i v-if="child.icon" :class="['fas', child.icon, 'w-5']" />
                            <span>{{ child.title }}</span>
                            <i class="fas fa-chevron-right text-xs ml-auto transition-transform" :class="{ 'rotate-90': openKeys.includes(child.key) }" />
                          </button>
                          <!-- 三级菜单 -->
                          <Transition
                            enter-active-class="transition-all duration-200 ease-out"
                            enter-from-class="opacity-0 translate-x-2"
                            enter-to-class="opacity-100 translate-x-0"
                            leave-active-class="transition-all duration-150 ease-in"
                            leave-from-class="opacity-100 translate-x-0"
                            leave-to-class="opacity-0 translate-x-2"
                          >
                            <div
                              v-if="openKeys.includes(child.key)"
                              class="absolute left-full top-0 z-50"
                              @mouseenter="handleMouseEnter(child.key)"
                              @mouseleave="handleMouseLeave"
                            >
                              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48 ml-1">
                                <ul class="flex flex-col">
                                  <li v-for="grandchild in child.children" :key="grandchild.key">
                                    <router-link
                                      :to="grandchild.path"
                                      class="flex items-center gap-3 px-4 py-2 text-sm transition-colors whitespace-nowrap"
                                      :class="[
                                        selectedKey === grandchild.path
                                          ? 'bg-primary-bg text-primary dark:text-primary-dark'
                                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                                      ]"
                                      @click="handleSelect(grandchild)"
                                    >
                                      <i v-if="grandchild.icon" :class="['fas', grandchild.icon, 'w-5']" />
                                      <span>{{ grandchild.title }}</span>
                                    </router-link>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </Transition>
                        </li>
                      </template>
                    </ul>
                  </div>
                </div>
              </Transition>
            </li>
          </template>
        </template>

        <!-- 更多按钮 -->
        <li
          v-if="showMoreButton"
          class="h-full relative flex-shrink-0"
          @mouseenter="showMoreMenu"
          @mouseleave="hideMoreMenu"
        >
          <button
            class="h-full flex items-center gap-1 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px"
            :class="[
              moreMenuVisible
                ? 'text-primary border-primary dark:text-primary-dark dark:border-primary-dark'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            ]"
          >
            <span>更多</span>
            <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': moreMenuVisible }" />
          </button>

          <!-- 更多菜单下拉列表 -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2"
          >
            <div
              v-if="moreMenuVisible"
              class="absolute right-0 top-full pt-1 z-50"
              @mouseenter="showMoreMenu"
              @mouseleave="hideMoreMenu"
            >
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48">
                <ul class="flex flex-col">
                  <template v-for="item in overflowedMenus" :key="item.key">
                    <!-- 一级菜单项（无子菜单） -->
                    <li v-if="!hasChildren(item)">
                      <router-link
                        :to="item.path"
                        class="flex items-center gap-3 px-4 py-2 text-sm transition-colors whitespace-nowrap"
                        :class="[
                          selectedKey === item.path
                            ? 'bg-primary-bg text-primary dark:text-primary-dark'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                        ]"
                        @click="handleSelect(item)"
                      >
                        <i v-if="item.icon" :class="['fas', item.icon, 'w-5']" />
                        <span>{{ item.title }}</span>
                      </router-link>
                    </li>

                    <!-- 有子菜单的溢出项 - 使用独立状态 -->
                    <li
                      v-else
                      class="relative"
                      @mouseenter="handleMoreMenuEnter(item.key)"
                      @mouseleave="handleMoreMenuLeave"
                    >
                      <button
                        class="w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors whitespace-nowrap text-left"
                        :class="[
                          isMoreMenuOpen(item.key) || isActive(item)
                            ? 'bg-primary-bg text-primary dark:text-primary-dark'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                        ]"
                      >
                        <i v-if="item.icon" :class="['fas', item.icon, 'w-5']" />
                        <span>{{ item.title }}</span>
                        <i class="fas fa-chevron-down text-xs ml-auto transition-transform duration-200" :class="{ 'rotate-180': isMoreMenuOpen(item.key) }" />
                      </button>

                      <!-- 子菜单 - 使用独立状态控制 -->
                      <Transition
                        enter-active-class="transition-all duration-200 ease-out"
                        enter-from-class="opacity-0 -translate-y-2"
                        enter-to-class="opacity-100 translate-y-0"
                        leave-active-class="transition-all duration-150 ease-in"
                        leave-from-class="opacity-100 translate-y-0"
                        leave-to-class="opacity-0 -translate-y-2"
                      >
                        <div
                          v-if="isMoreMenuOpen(item.key)"
                          class="absolute left-full top-0 z-50 ml-1"
                          @mouseenter="handleMoreMenuEnter(item.key)"
                          @mouseleave="handleMoreMenuLeave"
                        >
                          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-48">
                            <ul class="flex flex-col">
                              <template v-for="child in item.children" :key="child.key">
                                <li>
                                  <router-link
                                    :to="child.path"
                                    class="flex items-center gap-3 px-4 py-2 text-sm transition-colors whitespace-nowrap"
                                    :class="[
                                      selectedKey === child.path
                                        ? 'bg-primary-bg text-primary dark:text-primary-dark'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                                    ]"
                                    @click="handleSelect(child)"
                                  >
                                    <i v-if="child.icon" :class="['fas', child.icon, 'w-5']" />
                                    <span>{{ child.title }}</span>
                                  </router-link>
                                </li>
                              </template>
                            </ul>
                          </div>
                        </div>
                      </Transition>
                    </li>
                  </template>
                </ul>
              </div>
            </div>
          </Transition>
        </li>
      </ul>
    </div>
  </nav>
</template>
