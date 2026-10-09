<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const { dialogCancel, dialogConfirm, dialog } = useMenuConfigContext();
</script>

<template>
  <transition
    enter-active-class="transition duration-150 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-100 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="dialog.open"
      class="fixed inset-0 z-[80] flex items-center justify-center px-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="dialog.confirmOnly ? dialogConfirm() : dialogCancel()"
      ></div>
      <div
        class="relative w-full max-w-sm rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4">
          <div class="flex items-center gap-3">
            <span
              class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0"
            >
              <svg
                class="w-5 h-5 text-amber-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clip-rule="evenodd"
                />
              </svg>
            </span>
            <span class="font-semibold text-slate-800 dark:text-slate-100">{{ dialog.title }}</span>
          </div>
          <button
            @click="dialog.confirmOnly ? dialogConfirm() : dialogCancel()"
            class="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <!-- Body -->
        <div class="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300">
          {{ dialog.message }}
        </div>
        <!-- Footer -->
        <div
          class="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-800/50"
        >
          <button
            v-if="!dialog.confirmOnly"
            @click="dialogCancel"
            class="px-4 py-1.5 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
          <button
            @click="dialogConfirm"
            class="px-4 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>
