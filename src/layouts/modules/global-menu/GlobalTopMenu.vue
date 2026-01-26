<script setup lang="ts">
import { computed } from 'vue'
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

const selectedKey = computed(() => route.path)
const openKeys = computed(() => menuStore.openKeys)

function hasChildren(item: MenuItem): boolean {
  return !!(item.children && item.children.length > 0)
}

function handleSelect(item: MenuItem) {
  emit('select', item)
  if (!hasChildren(item)) {
    router.push(item.path)
  }
}

function toggleDropdown(key: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  menuStore.toggleOpenKey(key)
}

function handleMouseEnter(key: string) {
  menuStore.openKey(key)
}

function handleMouseLeave() {
  menuStore.closeAllKeys()
}

function isActive(item: MenuItem): boolean {
  if (!hasChildren(item)) {
    return selectedKey.value === item.path
  }
  return selectedKey.value.startsWith(item.path)
}

function isChildActive(child: MenuItem): boolean {
  if (!hasChildren(child)) {
    return selectedKey.value === child.path
  }
  return selectedKey.value.startsWith(child.path)
}
</script>

<template>
  <nav class="flex flex-col h-full overflow-visible">
    <ul class="flex items-center h-14 overflow-visible">
      <template v-for="item in menu" :key="item.key">
        <!-- 一级菜单项 -->
        <li v-if="!hasChildren(item)" class="h-full">
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
            <span>{{ item.title }}</span>
          </router-link>
        </li>

        <!-- 有子菜单的一级菜单项 -->
        <li
          v-else
          class="h-full relative"
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
            <span>{{ item.title }}</span>
            <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': openKeys.includes(item.key) }" />
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
    </ul>
  </nav>
</template>
