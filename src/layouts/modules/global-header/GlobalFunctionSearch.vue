<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useMenuStore } from '../global-menu/store'
import type { MenuItem } from '../global-menu/types'
import { useKiviiOpenTab } from '@/composables/useKiviiOpenTab'

const menuStore = useMenuStore()
const { openMenuItem } = useKiviiOpenTab()

const isOpen = ref(false)
const keyword = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

interface SearchItem {
  item: MenuItem
  breadcrumb: string
}

function collectFunctions(items: MenuItem[], parents: string[] = []): SearchItem[] {
  return items.flatMap(item => {
    if (item.hidden) return []
    const nextParents = [...parents, item.title]
    if (item.children?.length) return collectFunctions(item.children, nextParents)
    if (!item.path || item.path === '/blank' || item.key === 'blank') return []
    return [{ item, breadcrumb: parents.join(' / ') }]
  })
}

const functions = computed(() => collectFunctions(menuStore.menuList))
const results = computed(() => {
  const query = keyword.value.trim().toLocaleLowerCase()
  if (!query) return []

  const keywords = query.split(/\s+/)
  return functions.value
    .filter(({ item, breadcrumb }) => {
      const searchableText = [item.title, item.path, item.key, breadcrumb]
        .join(' ')
        .toLocaleLowerCase()
      return keywords.every(part => searchableText.includes(part))
    })
    .slice(0, 12)
})

watch([isOpen, results], () => {
  activeIndex.value = 0
})

watch(isOpen, async open => {
  if (!open) return
  await nextTick()
  inputRef.value?.focus()
})

function openSearch() {
  isOpen.value = true
}

function closeSearch() {
  isOpen.value = false
  keyword.value = ''
}

async function selectResult(result: SearchItem | undefined) {
  if (!result) return
  const opened = await openMenuItem(result.item)
  if (opened) closeSearch()
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    openSearch()
    return
  }
  if (!isOpen.value) return

  if (event.key === 'Escape') {
    event.preventDefault()
    closeSearch()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    void selectResult(results.value[activeIndex.value])
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <button
    class="flex items-center gap-2 rounded-lg px-2.5 py-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
    title="搜索功能 (Ctrl/⌘ K)"
    aria-label="搜索功能"
    @click="openSearch"
  >
    <i class="fas fa-search" />
    <span class="hidden xl:inline text-sm">搜索功能</span>
    <kbd class="hidden 2xl:inline rounded border border-gray-200 px-1 py-0.5 text-[10px] text-gray-400 dark:border-gray-600">⌘K</kbd>
  </button>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[500] flex items-start justify-center bg-slate-900/35 px-4 pt-[12vh]" @mousedown.self="closeSearch">
        <section class="w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800" role="dialog" aria-modal="true" aria-label="搜索功能">
          <div class="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
            <i class="fas fa-search text-gray-400" />
            <input
              ref="inputRef"
              v-model="keyword"
              class="h-14 min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100"
              placeholder="搜索当前可访问的功能名称或路径"
              autocomplete="off"
            >
            <button class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" @click="closeSearch">ESC</button>
          </div>

          <div class="max-h-[min(55vh,480px)] overflow-y-auto p-2">
            <button
              v-for="(result, index) in results"
              :key="result.item.key"
              class="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors"
              :class="index === activeIndex ? 'bg-primary-bg text-primary' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50'"
              @mouseenter="activeIndex = index"
              @click="selectResult(result)"
            >
              <i :class="['fas', result.item.icon || 'fa-file', 'w-4 text-center']" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium">{{ result.item.title }}</span>
                <span v-if="result.breadcrumb" class="block truncate pt-0.5 text-xs text-gray-400">{{ result.breadcrumb }}</span>
              </span>
              <span class="max-w-40 truncate text-xs text-gray-400">{{ result.item.path }}</span>
            </button>
            <p v-if="!keyword.trim()" class="px-3 py-10 text-center text-sm text-gray-400">输入关键词以搜索可访问的功能</p>
            <p v-else-if="results.length === 0" class="px-3 py-10 text-center text-sm text-gray-400">未找到可访问的功能</p>
          </div>
          <footer class="flex items-center gap-3 border-t border-gray-100 px-4 py-2 text-[11px] text-gray-400 dark:border-gray-700">
            <span>↑ ↓ 选择</span><span>Enter 打开</span><span>Esc 关闭</span>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
