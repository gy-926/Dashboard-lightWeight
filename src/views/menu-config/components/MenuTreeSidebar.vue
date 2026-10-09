<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const {
    addRootFolder,
    addChildFolder,
    deleteSelected,
    refreshTree,
    showTreeMenu,
    searchQuery,
    selectedId,
    flatTree,
    toggleNode,
    selectNode,
  } = useMenuConfigContext();
</script>

<template>
  <aside
    class="sidebar w-60 shrink-0 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-sm"
  >
    <!-- Search + action dropdown -->
    <div
      class="px-3 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5"
    >
      <div class="relative flex-1">
        <svg
          class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索菜单…"
          class="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all placeholder-slate-400 dark:placeholder-slate-500"
        />
      </div>

      <!-- Dropdown trigger -->
      <div class="relative shrink-0">
        <button
          @click.stop="showTreeMenu = !showTreeMenu"
          class="w-7 h-7 flex items-center justify-center rounded-md border text-slate-500 dark:text-slate-400 transition-colors"
          :class="
            showTreeMenu
              ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-300 text-indigo-700 dark:text-indigo-300'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          "
        >
          <svg
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <!-- Dropdown panel -->
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-1"
        >
          <div
            v-if="showTreeMenu"
            class="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg z-50 py-1 origin-top-right"
          >
            <!-- 新建根目录 -->
            <button
              @click="
                addRootFolder();
                showTreeMenu = false;
              "
              class="tree-menu-item text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <span
                class="w-5 h-5 rounded flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              新建根目录
            </button>

            <!-- 功能目录 -->
            <button
              @click="
                addChildFolder();
                showTreeMenu = false;
              "
              class="tree-menu-item text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <span
                class="w-5 h-5 rounded flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shrink-0"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 11v4m-2-2h4"
                  />
                </svg>
              </span>
              功能目录
            </button>

            <div class="my-1 border-t border-slate-100 dark:border-slate-700/50"></div>

            <!-- 删除 -->
            <button
              @click="
                deleteSelected();
                showTreeMenu = false;
              "
              class="tree-menu-item hover:bg-red-50 dark:hover:bg-red-900/30"
              :class="
                selectedId
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              "
              :disabled="!selectedId"
            >
              <span
                class="w-5 h-5 rounded flex items-center justify-center shrink-0"
                :class="
                  selectedId
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400'
                "
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </span>
              删除节点
            </button>

            <!-- 更新 -->
            <button
              @click="
                refreshTree();
                showTreeMenu = false;
              "
              class="tree-menu-item text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <span
                class="w-5 h-5 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </span>
              更新
            </button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Click-outside overlay to close dropdown -->
    <div
      v-if="showTreeMenu"
      class="fixed inset-0 z-40"
      @click="showTreeMenu = false"
    ></div>

    <!-- Flat tree list -->
    <div class="flex-1 overflow-y-auto py-2">
      <div
        v-for="item in flatTree"
        :key="item.node.id"
        class="flex items-center gap-1.5 py-1 pr-2 cursor-pointer rounded-md mx-1 group transition-colors"
        :class="
          selectedId === item.node.id
            ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        "
        :style="{ paddingLeft: `${item.depth * 14 + 8}px` }"
        @click="selectNode(item.node)"
      >
        <!-- Expand toggle -->
        <span
          v-if="item.hasChildren"
          class="w-4 h-4 flex items-center justify-center shrink-0 transition-transform duration-150"
          :class="item.open ? 'rotate-90' : ''"
          @click.stop="toggleNode(item.node.id)"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
        <span
          v-else
          class="w-4 h-4 shrink-0"
        ></span>

        <!-- Icon: 有子节点或 type===folder 判定为目录，否则为页面 -->
        <span class="w-4 h-4 flex items-center justify-center shrink-0">
          <!-- 根目录（有子节点或目录类型，且无父节点） -->
          <svg
            v-if="(item.hasChildren || item.node.type === 'folder') && !item.node.parentId"
            class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2z"
            />
          </svg>
          <!-- 功能目录（有子节点或目录类型，且有父节点） -->
          <svg
            v-else-if="item.hasChildren || item.node.type === 'folder'"
            class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 11v4m-2-2h4"
            />
          </svg>
          <!-- 叶子节点（页面/功能） -->
          <svg
            v-else
            class="w-3.5 h-3.5 text-blue-400 dark:text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </span>

        <span class="text-xs truncate flex-1">{{ item.node.label }}</span>
      </div>
    </div>
  </aside>
</template>
