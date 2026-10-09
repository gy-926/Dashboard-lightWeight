<script setup lang="ts">
  import { useMenuConfigContext } from '../context';

  const { clearTemplateSelection, openTemplatePicker, form } = useMenuConfigContext();
</script>

<template>
  <div class="flex-1 p-3 min-w-0">
    <div class="grid grid-cols-2 gap-x-5 gap-y-2.5">
      <!-- 显示名称 -->
      <div class="field-group">
        <label class="field-label">显示名称 <span class="text-red-400">*</span></label>
        <input
          v-model="form.displayName"
          type="text"
          class="field-input dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 border-indigo-200 focus:border-indigo-500"
          placeholder="输入显示名称"
        />
      </div>
      <!-- 内部编号 -->
      <div class="field-group">
        <label class="field-label">内部编号</label>
        <input
          v-model="form.internalCode"
          type="text"
          class="field-input dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 border-cyan-200 focus:border-cyan-500"
          placeholder="输入内部编号"
        />
      </div>

      <!-- 使用范围 -->
      <div class="field-group">
        <label class="field-label">使用范围</label>
        <div class="relative">
          <select
            v-model="form.scope"
            class="field-input appearance-none pr-8 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
          >
            <option>内部人员</option>
            <option>访客</option>
            <option>客户</option>
          </select>
          <svg
            class="abs-arrow"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      <!-- 类型 + 排序号 -->
      <div class="grid grid-cols-2 gap-x-4">
        <div class="field-group">
          <label class="field-label">类型</label>
          <div class="relative">
            <select
              v-model="form.type"
              class="field-input appearance-none pr-8 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
            >
              <option>目录</option>
              <option>页面</option>
              <option>功能</option>
            </select>
            <svg
              class="abs-arrow"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <div class="field-group">
          <label class="field-label">排序号</label>
          <input
            v-model.number="form.sortOrder"
            type="number"
            min="0"
            class="field-input text-center dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
            placeholder="0"
          />
        </div>
      </div>

      <!-- 图标路径 -->
      <div class="field-group">
        <label class="field-label">图标路径</label>
        <div class="flex gap-2">
          <input
            v-model="form.iconPath"
            type="text"
            class="field-input flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
            placeholder="输入图标路径或 URL"
          />
          <button
            class="shrink-0 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </button>
        </div>
      </div>
      <!-- 使用模板 -->
      <div class="field-group">
        <label class="field-label">使用模板</label>
        <div class="flex gap-2">
          <input
            v-model="form.template"
            type="text"
            readonly
            class="field-input flex-1 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 cursor-not-allowed"
            placeholder="请选择模板"
          />
          <button
            type="button"
            @click="openTemplatePicker"
            class="shrink-0 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          <button
            v-if="form.template"
            type="button"
            @click="clearTemplateSelection"
            class="shrink-0 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- 功能备注 full width -->
      <div class="col-span-2 field-group">
        <label class="field-label">功能备注</label>
        <textarea
          v-model="form.notes"
          rows="1"
          class="field-input resize-none leading-relaxed dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
          placeholder="输入功能备注（可选）"
        ></textarea>
      </div>
    </div>
  </div>
</template>
