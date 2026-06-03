<template>
  <div
    class="menu-config flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-sm text-slate-700 dark:text-slate-300 overflow-hidden transition-colors duration-300"
  >
    <!-- ══════════════════════ LEFT SIDEBAR ══════════════════════ -->
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

    <!-- ══════════════════════ MAIN AREA ══════════════════════ -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Top bar -->
      <header
        class="flex items-center justify-between px-6 py-3.5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
      >
        <div class="flex items-center gap-2">
          <div class="w-1 h-5 rounded-full bg-indigo-500"></div>
          <span class="text-slate-400 dark:text-slate-400 text-xs">当前菜单</span>
          <span class="font-semibold text-slate-800 dark:text-slate-100">{{
            selectedNode?.label ?? '—'
          }}</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            :disabled="!selectedNode || saving"
            @click="saveCurrent"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            保存
          </button>
          <button
            :disabled="!selectedId"
            @click="deleteSelected"
            class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            删除
          </button>
        </div>
      </header>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <div class="p-5 flex flex-col gap-4 flex-1 min-h-0">
          <!-- ── Basic Info + Param Config Card (side by side) ── -->
          <section
            class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden shrink-0"
          >
            <!-- Card header -->
            <div
              class="flex items-center gap-2 px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
            >
              <svg
                class="w-4 h-4 text-indigo-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <span
                class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                >基本信息</span
              >
            </div>

            <!-- Body: form fields (left) + param panel (right) -->
            <div class="flex min-h-0">
              <!-- Form fields -->
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

              <!-- ── Param Config Panel (right side) ── -->
              <div
                class="w-[420px] shrink-0 border-l border-slate-100 dark:border-slate-700/50 flex flex-col"
              >
                <!-- Param header -->
                <div
                  class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
                >
                  <div class="flex items-center gap-2">
                    <svg
                      class="w-4 h-4 text-amber-500 dark:text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span
                      class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                      >参数配置</span
                    >
                  </div>
                  <div class="flex items-center gap-1">
                    <button
                      @click="addParam"
                      class="w-6 h-6 flex items-center justify-center rounded-md text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 transition-colors"
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
                          stroke-width="2.5"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                    <button
                      @click="clearParams"
                      class="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-700 transition-colors"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Param table header -->
                <div
                  class="grid grid-cols-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50 text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  <span class="flex items-center gap-1">
                    名称
                    <svg
                      class="w-3 h-3 text-slate-400 dark:text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </span>
                  <span>值</span>
                </div>

                <!-- Param rows -->
                <div class="flex-1 divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto">
                  <div
                    v-for="(param, idx) in params"
                    :key="idx"
                    class="grid grid-cols-2 group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div class="px-3 py-2 border-r border-slate-100 dark:border-slate-700/50">
                      <input
                        v-model="param.name"
                        type="text"
                        placeholder="参数名"
                        class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                      />
                    </div>
                    <div class="px-3 py-2 flex items-center gap-2">
                      <input
                        v-model="param.value"
                        type="text"
                        placeholder="参数值"
                        class="min-w-0 flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                      />
                      <button
                        @click="removeParam(idx)"
                        class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                        title="删除"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="params.length === 0"
                    class="px-3 py-6 text-center text-xs text-slate-400 dark:text-slate-400"
                  >
                    暂无参数
                  </div>
                </div>

                <!-- Add param inline form -->
                <div
                  v-if="showParamForm"
                  class="border-t border-dashed border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/50"
                >
                  <div class="flex gap-2 mb-2">
                    <input
                      v-model="newParam.name"
                      type="text"
                      placeholder="参数名"
                      class="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    />
                    <input
                      v-model="newParam.value"
                      type="text"
                      placeholder="参数值"
                      class="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                    />
                  </div>
                  <div class="flex gap-2">
                    <button
                      @click="confirmAddParam"
                      class="flex-1 py-1 text-xs rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                    >
                      确认
                    </button>
                    <button
                      @click="showParamForm = false"
                      class="flex-1 py-1 text-xs rounded bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Function Collection Card (full width) ── -->
          <div class="flex-1 min-h-0 flex flex-col">
            <!-- ── Function Collection Card ── -->
            <section
              class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col"
            >
              <div
                class="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
              >
                <div class="flex items-center gap-2">
                  <svg
                    class="w-4 h-4 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  <span
                    class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider"
                    >功能集合</span
                  >
                  <span
                    class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400 font-medium"
                    >{{ functions.length }}</span
                  >
                </div>
                <button
                  type="button"
                  @click="openRelatePicker"
                  :disabled="!canRelateFunctions"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors"
                  :class="
                    canRelateFunctions
                      ? 'text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      : 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed'
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  关联
                </button>
              </div>

              <!-- Table header：固定不滚动 -->
              <div class="overflow-x-auto shrink-0">
                <div class="min-w-[800px]">
                  <div
                    class="fn-grid text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700/50"
                  >
                    <span class="flex items-center gap-1">
                      显示名称
                      <span class="text-slate-400 dark:text-slate-400 font-normal normal-case"
                        >【原功能项名称】</span
                      >
                      <svg
                        class="w-3 h-3 text-slate-400 dark:text-slate-400 ml-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </span>
                    <span class="flex items-center gap-1"
                      >排序号
                      <svg
                        class="w-3 h-3 text-slate-400 dark:text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M5 15l7-7 7 7"
                        /></svg
                    ></span>
                    <span>图标</span>
                    <span>参数配置</span>
                    <span>功能备注</span>
                    <span class="text-right pr-4">操作</span>
                  </div>
                </div>
              </div>

              <!-- Table body：内部滚动 -->
              <div class="overflow-y-auto overflow-x-auto flex-1 min-h-0">
                <div class="min-w-[800px]">
                  <div class="divide-y divide-slate-100 dark:divide-slate-700">
                    <div
                      v-for="(fn, idx) in functions"
                      :key="idx"
                      class="fn-grid px-4 py-3 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group items-center"
                    >
                      <div class="pr-2">
                        <div
                          class="fn-cell"
                          @dblclick="startFnEdit(fn, 'name')"
                        >
                          <span
                            v-if="fn.__editing !== 'name'"
                            class="block truncate text-slate-700 dark:text-slate-200"
                          >
                            {{ fn.DisplayName || '—' }}
                          </span>
                          <input
                            v-else
                            v-model="fn.DisplayName"
                            type="text"
                            placeholder="显示名称"
                            class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                            @blur="commitFnEdit(fn)"
                            @keydown.enter.prevent="commitFnEdit(fn)"
                          />
                        </div>
                      </div>
                      <div class="text-center">
                        <div
                          class="fn-cell flex items-center justify-center"
                          @dblclick="startFnEdit(fn, 'sort')"
                        >
                          <span
                            v-if="fn.__editing !== 'sort'"
                            class="block w-20 text-center text-slate-600 dark:text-slate-300"
                          >
                            {{ fn.SortId ?? 0 }}
                          </span>
                          <input
                            v-else
                            v-model.number="fn.SortId"
                            type="number"
                            min="0"
                            placeholder="0"
                            class="w-20 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                            @blur="commitFnEdit(fn)"
                            @keydown.enter.prevent="commitFnEdit(fn)"
                          />
                        </div>
                      </div>
                      <div class="flex items-center justify-center">
                        <div
                          class="fn-cell w-full flex items-center justify-center"
                          @dblclick="startFnEdit(fn, 'icon')"
                        >
                          <div
                            v-if="fn.__editing !== 'icon'"
                            class="flex items-center gap-2 w-full justify-center"
                          >
                            <span class="w-28 truncate text-slate-600 dark:text-slate-300">{{
                              fn.Icon || '—'
                            }}</span>
                            <i :class="fn.Icon || ''"></i>
                          </div>
                          <div
                            v-else
                            class="flex items-center gap-2"
                          >
                            <input
                              v-model="fn.Icon"
                              type="text"
                              placeholder="Icon"
                              class="w-28 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                              @blur="commitFnEdit(fn)"
                              @keydown.enter.prevent="commitFnEdit(fn)"
                            />
                            <i :class="fn.Icon || ''"></i>
                          </div>
                        </div>
                      </div>
                      <div class="pr-2">
                        <div class="flex items-center gap-2">
                          <input
                            :value="formatFnParameters(fn.Parameters)"
                            type="text"
                            readonly
                            class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 cursor-not-allowed focus:outline-none"
                            placeholder="—"
                          />
                          <button
                            type="button"
                            @click="openFnParamEditor(fn)"
                            class="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
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
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div class="pr-2">
                        <div
                          class="fn-cell"
                          @dblclick="startFnEdit(fn, 'remark')"
                        >
                          <span
                            v-if="fn.__editing !== 'remark'"
                            class="block truncate text-slate-600 dark:text-slate-300"
                          >
                            {{ fn.Remark || '—' }}
                          </span>
                          <input
                            v-else
                            v-model="fn.Remark"
                            type="text"
                            placeholder="备注"
                            class="w-full text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                            @blur="commitFnEdit(fn)"
                            @keydown.enter.prevent="commitFnEdit(fn)"
                          />
                        </div>
                      </div>
                      <div class="flex justify-end items-center pr-4">
                        <button
                          @click="removeFunction(idx)"
                          class="w-7 h-7 flex items-center justify-center rounded text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                          title="删除"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <!-- Empty state -->
                    <div
                      v-if="functions.length === 0"
                      class="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-400"
                    >
                      <svg
                        class="w-10 h-10 mb-2 text-slate-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <span class="text-xs">没有数据</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div
                class="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
              >
                <div class="flex items-center gap-2">
                  <button
                    class="pager-btn"
                    :disabled="page <= 1"
                    @click="page = 1"
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
                        d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    class="pager-btn"
                    :disabled="page <= 1"
                    @click="page--"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>第</span>
                    <input
                      v-model.number="page"
                      type="number"
                      min="1"
                      class="w-10 text-center rounded border border-slate-200 dark:border-slate-700 py-0.5 text-xs focus:outline-none focus:border-indigo-400"
                    />
                    <span>页，共 {{ totalPages }} 页</span>
                  </div>
                  <button
                    class="pager-btn"
                    :disabled="page >= totalPages"
                    @click="page++"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <button
                    class="pager-btn"
                    :disabled="page >= totalPages"
                    @click="page = totalPages"
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
                        d="M13 5l7 7-7 7M5 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <button class="pager-btn">
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
                <span class="text-xs text-slate-400 dark:text-slate-400">{{
                  functions.length === 0
                    ? '没有数据'
                    : `共
                  ${functions.length} 条`
                }}</span>
              </div>
            </section>
          </div>
          <!-- end function collection wrapper -->
        </div>
      </div>
    </main>

    <div
      v-if="templatePickerOpen"
      class="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="closeTemplatePicker"
      ></div>
      <div
        class="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
        >
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">选择模板</div>
          <button
            type="button"
            class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            @click="closeTemplatePicker"
          >
            <svg
              class="w-4 h-4 mx-auto"
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

        <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div class="relative">
            <svg
              class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400"
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
              v-model="templateSearch"
              type="text"
              placeholder="搜索模板（显示名/内部编码）"
              class="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
            />
          </div>
        </div>

        <div class="max-h-[420px] overflow-auto">
          <div
            v-if="templateLoading"
            class="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            加载中…
          </div>
          <div
            v-else-if="templateError"
            class="px-5 py-8 text-center text-sm text-red-600 dark:text-red-400"
          >
            {{ templateError }}
          </div>
          <div v-else>
            <div
              v-if="filteredTemplateItems.length === 0"
              class="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              暂无数据
            </div>
            <div
              v-else
              class="divide-y divide-slate-100 dark:divide-slate-700"
            >
              <div
                v-for="t in filteredTemplateItems"
                :key="t.Kvid"
                class="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="truncate font-medium text-slate-800 dark:text-slate-100">{{
                      t.DisplayName || '未命名模板'
                    }}</span>
                    <span
                      v-if="t.ScopeLabel"
                      class="shrink-0 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      {{ t.ScopeLabel }}
                    </span>
                  </div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {{ t.InternalCode || t.Handler || '' }}
                  </div>
                </div>
                <button
                  type="button"
                  @click="pickTemplate(t)"
                  class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  选择
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="relatePickerOpen"
      class="fixed inset-0 z-[55] flex items-center justify-center px-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="closeRelatePicker"
      ></div>
      <div
        class="relative w-full max-w-4xl rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
        >
          <div class="flex items-center gap-2">
            <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">关联功能</div>
            <span
              class="px-2 py-0.5 rounded-full text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 font-medium"
              >{{ relateTotalDisplay }}</span
            >
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            @click="closeRelatePicker"
          >
            <svg
              class="w-4 h-4 mx-auto"
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

        <div class="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <svg
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400"
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
                v-model="relateSearch"
                type="text"
                placeholder="搜索功能（显示名/内部编码/Handler）"
                class="w-full pl-10 pr-3 py-2 text-sm rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 shrink-0">
              已选 {{ relateCheckedCount }}
            </div>
            <button
              type="button"
              @click="loadRelateItems(true)"
              class="px-3 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              刷新
            </button>
          </div>
        </div>

        <div
          ref="relateScrollEl"
          class="max-h-[520px] overflow-auto"
          @scroll="onRelateScroll"
        >
          <div
            v-if="relateLoading"
            class="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            加载中…
          </div>
          <div
            v-else-if="relateError"
            class="px-5 py-10 text-center text-sm text-red-600 dark:text-red-400"
          >
            {{ relateError }}
          </div>
          <div v-else>
            <div
              v-if="filteredRelateItems.length === 0"
              class="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
            >
              暂无数据
            </div>
            <div
              v-else
              class="divide-y divide-slate-100 dark:divide-slate-700"
            >
              <div
                v-for="t in filteredRelateItems"
                :key="t.Kvid"
                class="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div class="min-w-0 flex items-center gap-3">
                  <input
                    type="checkbox"
                    class="w-4 h-4 accent-indigo-600"
                    :checked="Boolean(relateChecked[t.Kvid])"
                    @change="toggleRelateChecked(t.Kvid, $event, t)"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="truncate font-medium text-slate-800 dark:text-slate-100">{{
                        t.DisplayName || '未命名功能'
                      }}</span>
                      <span
                        v-if="t.ScopeLabel"
                        class="shrink-0 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      >
                        {{ t.ScopeLabel }}
                      </span>
                    </div>
                    <div class="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                      {{ t.InternalCode || t.Handler || '' }}
                    </div>
                  </div>
                </div>
                <div class="shrink-0 text-xs text-slate-400 dark:text-slate-400">
                  Kvid: {{ t.Kvid }}
                </div>
              </div>
            </div>
            <div
              v-if="relateLoadingMore"
              class="px-5 py-4 text-center text-xs text-slate-500 dark:text-slate-400"
            >
              加载更多…
            </div>
            <div
              v-else-if="!relateHasMore && relateItems.length > 0"
              class="px-5 py-4 text-center text-xs text-slate-400 dark:text-slate-400"
            >
              没有更多了
            </div>
          </div>
        </div>

        <div
          class="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-2 bg-white dark:bg-slate-800"
        >
          <button
            type="button"
            @click="closeRelatePicker"
            class="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            取消
          </button>
          <button
            type="button"
            @click="confirmRelatePicker"
            class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="fnParamEditorOpen"
      class="fixed inset-0 z-[60] flex items-center justify-center px-4"
    >
      <div
        class="absolute inset-0 bg-black/30"
        @click="closeFnParamEditor"
      ></div>
      <div
        class="relative w-full max-w-3xl rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50"
        >
          <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">参数配置</div>
          <button
            type="button"
            class="w-8 h-8 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
            @click="closeFnParamEditor"
          >
            <svg
              class="w-4 h-4 mx-auto"
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

        <div
          class="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between"
        >
          <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
            {{ fnParamEditorTitle || '' }}
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="addFnParamDraft"
              class="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              新增
            </button>
            <button
              type="button"
              @click="clearFnParamDraft"
              class="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              清空
            </button>
          </div>
        </div>

        <div class="max-h-[420px] overflow-auto">
          <div
            v-if="fnParamDraft.length === 0"
            class="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
          >
            暂无参数
          </div>
          <div
            v-else
            class="px-5 py-4 space-y-2"
          >
            <div
              v-for="(p, idx) in fnParamDraft"
              :key="idx"
              class="grid grid-cols-2 gap-2 items-center"
            >
              <input
                v-model="p.name"
                type="text"
                placeholder="参数名"
                class="w-full text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
              <div class="flex items-center gap-2">
                <input
                  v-model="p.value"
                  type="text"
                  placeholder="参数值"
                  class="min-w-0 flex-1 text-sm px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
                />
                <button
                  type="button"
                  @click="removeFnParamDraft(idx)"
                  class="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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
            </div>
          </div>
        </div>

        <div
          class="px-5 py-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-end gap-2 bg-white dark:bg-slate-800"
        >
          <button
            type="button"
            @click="closeFnParamEditor"
            class="px-4 py-2 text-sm font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
          >
            取消
          </button>
          <button
            type="button"
            @click="saveFnParamDraft"
            class="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            确认
          </button>
        </div>
      </div>
    </div>

    <!-- ══════════════════════ 通用弹框 ══════════════════════ -->
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
              <span class="font-semibold text-slate-800 dark:text-slate-100">{{
                dialog.title
              }}</span>
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
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent, onMounted, ref, watch } from 'vue';
  import { adminSupabase } from '@/utils/supabase-admin';
  import { clearDynamicRoutesCache } from '@/router/routes';

  export const manifest = {
    name: 'MenuConfig',
    type: 'component',
    description: '菜单配置页面：支持树形菜单管理、菜单信息编辑、参数配置与功能集合维护。',
    version: '1.0.0',
    author: 'Kivii Team',
  };

  interface MenuRootRow {
    kvid: string;
    title: string;
    display_name: string | null;
    internal_code: string;
    scope?: string | null;
    sort_order?: number | null;
    icon?: string | null;
    remark?: string | null;
    parameters?: Record<string, any> | null;
  }

  interface MenuRow {
    kvid: string;
    parent_kvid: string | null;
    menu_root_kvid: string;
    title: string;
    display_name: string | null;
    internal_code?: string | null;
    scope?: string | null;
    type: 'Page' | 'Folder' | 'Link' | 'System';
    icon: string | null;
    sort_order: number;
    remark: string | null;
    function_kvid: string | null;
    parameters: Record<string, any> | null;
    is_active: boolean;
  }

  interface FunctionRow {
    kvid: string;
    title: string | null;
    handler: string;
    remark: string | null;
    parameters: Record<string, any> | null;
    render_type: 'webview' | 'vue' | 'umd';
    source_type: 'manual' | 'umd' | 'system';
    source_module: string | null;
    source_url: string | null;
    source_component: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
  }

  interface TreeNodeData {
    id: string;
    label: string;
    type?: 'folder' | 'page';
    children?: TreeNodeData[];
    parentId?: string | null;
    raw?: MenuRootRow | MenuRow | null;
    __isNew?: boolean;
    __parentKvid?: string | null;
    __rootKvid?: string;
    __entityKind?: 'root' | 'menu';
  }

  interface FlatTreeItem {
    node: TreeNodeData;
    depth: number;
    hasChildren: boolean;
    open: boolean;
  }

  interface Param {
    name: string;
    value: string;
  }

  interface FnItem {
    Kvid: string;
    DisplayName: string;
    SortId: number;
    Icon: string;
    Parameters: Param[];
    Remark: string;
    FunctionKvid?: string;
    FunctionName?: string;
    __raw?: MenuRow;
    __editing?: '' | 'name' | 'sort' | 'icon' | 'remark';
    __snapshot?: {
      DisplayName: string;
      SortId: number;
      Icon: string;
      Remark: string;
      ParametersText: string;
    };
  }

  export default defineComponent({
    name: 'MenuConfig',
    setup(_props, { expose }) {
      expose({ manifest });

      const menuRoots = ref<MenuRootRow[]>([]);
      const menuRows = ref<MenuRow[]>([]);
      const functionRows = ref<FunctionRow[]>([]);
      const treeData = ref<TreeNodeData[]>([]);

      const showTreeMenu = ref(false);
      const openIds = ref<Set<string>>(new Set<string>());
      const searchQuery = ref('');
      const selectedId = ref('');
      const selectedNode = ref<TreeNodeData | null>(null);
      const loading = ref(false);
      const saving = ref(false);

      const form = ref({
        displayName: '',
        internalCode: '',
        scope: '内部人员',
        type: '目录',
        sortOrder: 0,
        iconPath: '',
        template: '',
        notes: '',
      });

      watch(
        () => form.value.sortOrder,
        v => {
          const next = clampMinZero(v);
          if (next !== v) form.value.sortOrder = next;
        }
      );

      const params = ref<Param[]>([]);
      const showParamForm = ref(false);
      const newParam = ref<Param>({ name: '', value: '' });

      const functions = ref<FnItem[]>([]);
      const page = ref(1);
      const totalPages = computed(() => Math.max(1, Math.ceil(functions.value.length / 10)));

      const templatePickerOpen = ref(false);
      const templateLoading = ref(false);
      const templateError = ref('');
      const templateSearch = ref('');
      const templateItems = ref<Array<any>>([]);
      const templateFunctionKvid = ref('');
      const templateFunctionName = ref('');

      const relatePickerOpen = ref(false);
      const relateLoading = ref(false);
      const relateLoadingMore = ref(false);
      const relateError = ref('');
      const relateSearch = ref('');
      const relateItems = ref<Array<any>>([]);
      const relateTotal = ref<number | null>(null);
      const relateScrollEl = ref<HTMLElement | null>(null);
      const relateHasMore = ref(false);
      const relateChecked = ref<Record<string, boolean>>({});
      const relateCheckedMap = ref<Record<string, any>>({});
      const relateCheckedCount = computed(
        () => Object.values(relateChecked.value).filter(Boolean).length
      );
      const relateTotalDisplay = computed(() =>
        typeof relateTotal.value === 'number' ? relateTotal.value : relateItems.value.length
      );
      const canRelateFunctions = computed(() =>
        Boolean(selectedNode.value && selectedNode.value.type === 'folder')
      );

      const dialog = ref<{
        open: boolean;
        title: string;
        message: string;
        confirmOnly: boolean;
        resolve: ((v: boolean) => void) | null;
      }>({ open: false, title: '', message: '', confirmOnly: false, resolve: null });

      const functionMap = computed(() => {
        const map = new Map<string, FunctionRow>();
        functionRows.value.forEach(item => map.set(item.kvid, item));
        return map;
      });

      function clampMinZero(input: any): number {
        const n = typeof input === 'number' ? input : Number(input);
        if (!Number.isFinite(n)) return 0;
        return n < 0 ? 0 : n;
      }

      function normalizeScopeLabel(input: any): string {
        const v = String(input ?? '').trim();
        if (!v) return '内部人员';
        const lower = v.toLowerCase();
        if (lower === 'guest' || v === '访客') return '访客';
        if (lower === 'contact' || v === '客户') return '客户';
        return '内部人员';
      }

      function scopeLabelToCode(label: string): 'Member' | 'Guest' | 'Contact' {
        const v = String(label ?? '').trim();
        if (v === '访客' || v.toLowerCase() === 'guest') return 'Guest';
        if (v === '客户' || v.toLowerCase() === 'contact') return 'Contact';
        return 'Member';
      }

      function paramsArrayToObject(list: Param[]): Record<string, any> {
        const obj: Record<string, any> = {};
        (Array.isArray(list) ? list : []).forEach(p => {
          const key = String(p?.name ?? '').trim();
          if (!key) return;
          const raw = String(p?.value ?? '');
          const trimmed = raw.trim();
          if (trimmed === 'true') {
            obj[key] = true;
            return;
          }
          if (trimmed === 'false') {
            obj[key] = false;
            return;
          }
          if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
            obj[key] = Number(trimmed);
            return;
          }
          if (
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))
          ) {
            try {
              obj[key] = JSON.parse(trimmed);
              return;
            } catch {
              obj[key] = raw;
              return;
            }
          }
          obj[key] = raw;
        });
        return obj;
      }

      function normalizeParametersToParams(input: any): Param[] {
        let value = input;
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value);
          } catch {
            return [];
          }
        }
        if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
        return Object.entries(value).map(([name, item]) => ({
          name,
          value: typeof item === 'string' ? item : JSON.stringify(item),
        }));
      }

      function getFunctionDisplayName(func: FunctionRow | null | undefined): string {
        if (!func) return '';
        return String(func.title ?? func.source_component ?? func.handler ?? '').trim();
      }

      function getNodeRootKvid(node: TreeNodeData | null): string {
        if (!node) return '';
        if (node.__entityKind === 'root') return node.id;
        return String(node.__rootKvid ?? (node.raw as MenuRow | undefined)?.menu_root_kvid ?? '');
      }

      function buildTreeData(rootsInput: MenuRootRow[], menusInput: MenuRow[]): TreeNodeData[] {
        const rootMap = new Map<string, TreeNodeData>();
        const roots = [...rootsInput].sort(
          (a, b) =>
            Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
            String(a.title ?? '').localeCompare(String(b.title ?? ''))
        );
        roots.forEach(root => {
          rootMap.set(root.kvid, {
            id: root.kvid,
            label: String(root.display_name ?? root.title ?? '未命名根目录'),
            type: 'folder',
            children: [],
            parentId: null,
            raw: root,
            __entityKind: 'root',
            __rootKvid: root.kvid,
          });
        });

        const menuMap = new Map<string, TreeNodeData>();
        const menus = [...menusInput].sort(
          (a, b) =>
            Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
            String(a.display_name ?? a.title ?? '').localeCompare(
              String(b.display_name ?? b.title ?? '')
            )
        );

        menus.forEach(menu => {
          menuMap.set(menu.kvid, {
            id: menu.kvid,
            label: String(menu.display_name ?? menu.title ?? '未命名菜单'),
            type: menu.type === 'Folder' ? 'folder' : 'page',
            children: [],
            parentId: menu.parent_kvid ?? menu.menu_root_kvid,
            raw: menu,
            __entityKind: 'menu',
            __rootKvid: menu.menu_root_kvid,
          });
        });

        menus.forEach(menu => {
          const node = menuMap.get(menu.kvid)!;
          if (menu.parent_kvid && menuMap.has(menu.parent_kvid)) {
            menuMap.get(menu.parent_kvid)!.children!.push(node);
          } else {
            rootMap.get(menu.menu_root_kvid)?.children?.push(node);
          }
        });

        const sortNodes = (nodes: TreeNodeData[]) => {
          nodes.sort((a, b) => {
            const aSort = Number((a.raw as any)?.sort_order ?? 0);
            const bSort = Number((b.raw as any)?.sort_order ?? 0);
            if (aSort !== bSort) return aSort - bSort;
            return String(a.label).localeCompare(String(b.label));
          });
          nodes.forEach(node => node.children?.length && sortNodes(node.children));
        };

        const tree = Array.from(rootMap.values());
        sortNodes(tree);
        return tree;
      }

      function findNodeById(nodes: TreeNodeData[], id: string): TreeNodeData | null {
        for (const node of nodes) {
          if (node.id === id) return node;
          const child = node.children?.length ? findNodeById(node.children, id) : null;
          if (child) return child;
        }
        return null;
      }

      function removeNodeById(nodes: TreeNodeData[], id: string): boolean {
        const index = nodes.findIndex(node => node.id === id);
        if (index !== -1) {
          nodes.splice(index, 1);
          return true;
        }
        return nodes.some(node => removeNodeById(node.children ?? [], id));
      }

      function flattenTree(nodes: TreeNodeData[], depth = 0, q = ''): FlatTreeItem[] {
        const result: FlatTreeItem[] = [];
        for (const node of nodes) {
          const matchesSelf = !q || node.label.includes(q);
          const children = node.children ?? [];
          const flatChildren = flattenTree(children, depth + 1, q);
          const hasMatchingDescendants = flatChildren.length > 0;
          if (!matchesSelf && !hasMatchingDescendants) continue;
          const isOpen = openIds.value.has(node.id);
          result.push({ node, depth, hasChildren: children.length > 0, open: isOpen });
          if (isOpen || q) result.push(...flatChildren);
        }
        return result;
      }

      const flatTree = computed(() => flattenTree(treeData.value, 0, searchQuery.value));

      function toggleNode(id: string) {
        const next = new Set(openIds.value);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        openIds.value = next;
      }

      function buildRelatedFunctions(node: TreeNodeData | null): FnItem[] {
        if (!node || node.type !== 'folder') return [];
        const rootKvid = getNodeRootKvid(node);
        const parentKvid = node.__entityKind === 'root' ? null : node.id;
        return menuRows.value
          .filter(
            menu =>
              menu.menu_root_kvid === rootKvid &&
              menu.parent_kvid === parentKvid &&
              menu.type === 'Page'
          )
          .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
          .map(menu => {
            const func = functionMap.value.get(String(menu.function_kvid ?? ''));
            const displayName = String(
              menu.display_name ?? menu.title ?? getFunctionDisplayName(func) ?? ''
            );
            return {
              Kvid: menu.kvid,
              DisplayName: displayName,
              SortId: Number(menu.sort_order ?? 0),
              Icon: String(menu.icon ?? func?.icon ?? ''),
              Parameters: normalizeParametersToParams(menu.parameters),
              Remark: String(menu.remark ?? ''),
              FunctionKvid: menu.function_kvid ?? undefined,
              FunctionName: getFunctionDisplayName(func),
              __raw: { ...menu },
              __editing: '',
              __snapshot: {
                DisplayName: displayName,
                SortId: Number(menu.sort_order ?? 0),
                Icon: String(menu.icon ?? func?.icon ?? ''),
                Remark: String(menu.remark ?? ''),
                ParametersText: JSON.stringify(
                  paramsArrayToObject(normalizeParametersToParams(menu.parameters))
                ),
              },
            };
          });
      }

      function applySelectedToForm(node: TreeNodeData | null) {
        if (!node) {
          form.value = {
            displayName: '',
            internalCode: '',
            scope: '内部人员',
            type: '目录',
            sortOrder: 0,
            iconPath: '',
            template: '',
            notes: '',
          };
          params.value = [];
          templateFunctionKvid.value = '';
          templateFunctionName.value = '';
          return;
        }

        const raw = (node.raw ?? {}) as any;
        form.value.displayName = String(raw.display_name ?? raw.title ?? node.label ?? '');
        form.value.internalCode = String(raw.internal_code ?? '');
        form.value.scope = normalizeScopeLabel(raw.scope);
        form.value.type = node.type === 'folder' ? '目录' : '功能';
        form.value.sortOrder = clampMinZero(raw.sort_order ?? 0);
        form.value.iconPath = String(raw.icon ?? '');
        form.value.notes = String(raw.remark ?? '');
        params.value = normalizeParametersToParams(raw.parameters);

        const func = functionMap.value.get(String(raw.function_kvid ?? ''));
        templateFunctionKvid.value = String(raw.function_kvid ?? '');
        templateFunctionName.value = getFunctionDisplayName(func);
        form.value.template = templateFunctionName.value;

        showParamForm.value = false;
        newParam.value = { name: '', value: '' };
      }

      function refreshSelectedNode(preferredId = selectedId.value) {
        treeData.value = buildTreeData(menuRoots.value, menuRows.value);
        if (openIds.value.size === 0) {
          const initialOpenIds = new Set<string>();
          treeData.value.forEach(root => {
            initialOpenIds.add(root.id);
            (root.children ?? []).forEach(
              child => child.type === 'folder' && initialOpenIds.add(child.id)
            );
          });
          openIds.value = initialOpenIds;
        }

        const nextSelected = preferredId
          ? findNodeById(treeData.value, preferredId)
          : (treeData.value[0] ?? null);
        if (nextSelected) {
          selectedId.value = nextSelected.id;
          selectedNode.value = nextSelected;
          applySelectedToForm(nextSelected);
          functions.value = buildRelatedFunctions(nextSelected);
          page.value = 1;
        } else {
          selectedId.value = '';
          selectedNode.value = null;
          applySelectedToForm(null);
          functions.value = [];
        }
      }

      async function loadTree() {
        loading.value = true;
        try {
          const [
            { data: rootsData, error: rootsError },
            { data: menusData, error: menusError },
            { data: functionsData, error: functionsError },
          ] = await Promise.all([
            adminSupabase
              .from('menu_roots')
              .select('*')
              .order('sort_order', { ascending: true })
              .order('title', { ascending: true }),
            adminSupabase
              .from('menus')
              .select('*')
              .order('sort_order', { ascending: true })
              .order('title', { ascending: true }),
            adminSupabase
              .from('functions')
              .select('*')
              .order('is_active', { ascending: false })
              .order('sort_order', { ascending: true })
              .order('title', { ascending: true }),
          ]);

          if (rootsError) throw rootsError;
          if (menusError) throw menusError;
          if (functionsError) throw functionsError;

          menuRoots.value = (rootsData ?? []) as MenuRootRow[];
          menuRows.value = (menusData ?? []) as MenuRow[];
          functionRows.value = (functionsData ?? []) as FunctionRow[];

          refreshSelectedNode();
        } catch (e) {
          console.error('[MenuConfig] loadTree failed', e);
        } finally {
          loading.value = false;
        }
      }

      function selectNode(node: TreeNodeData) {
        selectedId.value = node.id;
        selectedNode.value = node;
        applySelectedToForm(node);
        functions.value = buildRelatedFunctions(node);
        page.value = 1;
      }

      function addParam() {
        showParamForm.value = true;
        newParam.value = { name: '', value: '' };
      }

      function confirmAddParam() {
        if (!newParam.value.name.trim()) return;
        params.value.push({ ...newParam.value });
        showParamForm.value = false;
        newParam.value = { name: '', value: '' };
      }

      function removeParam(idx: number) {
        params.value.splice(idx, 1);
      }

      function clearParams() {
        params.value = [];
        showParamForm.value = false;
        newParam.value = { name: '', value: '' };
      }

      async function removeFunction(idx: number) {
        const fn = functions.value[idx];
        if (!fn?.Kvid) {
          functions.value.splice(idx, 1);
          return;
        }

        if (
          !(await showConfirm(`确定要删除关联功能“${fn.DisplayName || fn.Kvid}”吗？`, '确认删除'))
        ) {
          return;
        }

        try {
          const { error } = await adminSupabase.from('menus').delete().eq('kvid', fn.Kvid);
          if (error) throw error;
          await loadTree();
          clearDynamicRoutesCache();
        } catch (e: any) {
          await showAlert('删除失败：' + (e?.message || e), '删除失败');
        }
      }

      function addFunctionParam(fn: FnItem) {
        fn.Parameters = Array.isArray(fn.Parameters) ? fn.Parameters : [];
        fn.Parameters.push({ name: '', value: '' });
      }

      function removeFunctionParam(fn: FnItem, idx: number) {
        fn.Parameters = Array.isArray(fn.Parameters) ? fn.Parameters : [];
        fn.Parameters.splice(idx, 1);
      }

      function clearFunctionParams(fn: FnItem) {
        fn.Parameters = [];
      }

      function makeFnSnapshot(fn: FnItem) {
        return {
          DisplayName: String(fn?.DisplayName ?? ''),
          SortId: clampMinZero(fn?.SortId),
          Icon: String(fn?.Icon ?? ''),
          Remark: String(fn?.Remark ?? ''),
          ParametersText: JSON.stringify(paramsArrayToObject(fn?.Parameters ?? [])),
        };
      }

      async function updateFnItem(fn: FnItem, nextSnapshot?: FnItem['__snapshot']) {
        const raw = fn.__raw;
        if (!raw?.kvid) return;

        const payload: MenuRow = {
          ...raw,
          display_name: fn.DisplayName || null,
          icon: fn.Icon || null,
          sort_order: clampMinZero(fn.SortId),
          remark: fn.Remark || null,
          parameters: paramsArrayToObject(fn.Parameters),
        };

        try {
          const { error } = await adminSupabase.from('menus').upsert(payload);
          if (error) throw error;
          fn.__raw = payload;
          fn.__snapshot = nextSnapshot ?? makeFnSnapshot(fn);
          const target = menuRows.value.find(item => item.kvid === payload.kvid);
          if (target) Object.assign(target, payload);
          refreshSelectedNode(selectedId.value);
          clearDynamicRoutesCache();
        } catch (e) {
          console.error('[MenuConfig] update function item failed', e);
        }
      }

      function startFnEdit(fn: FnItem, field: NonNullable<FnItem['__editing']>) {
        if (!fn.__snapshot) fn.__snapshot = makeFnSnapshot(fn);
        fn.__editing = field;
      }

      function commitFnEdit(fn: FnItem) {
        fn.SortId = clampMinZero(fn.SortId);
        const before = fn.__snapshot ?? makeFnSnapshot(fn);
        const after = makeFnSnapshot(fn);
        fn.__editing = '';
        const changed =
          before.DisplayName !== after.DisplayName ||
          before.SortId !== after.SortId ||
          before.Icon !== after.Icon ||
          before.Remark !== after.Remark ||
          before.ParametersText !== after.ParametersText;
        if (!changed) return;
        updateFnItem(fn, after);
      }

      const fnParamEditorOpen = ref(false);
      const fnParamEditorTarget = ref<FnItem | null>(null);
      const fnParamDraft = ref<Param[]>([]);
      const fnParamEditorTitle = computed(() => fnParamEditorTarget.value?.DisplayName ?? '');

      function formatFnParameters(list: Param[]): string {
        const pairs = (Array.isArray(list) ? list : [])
          .map(p => {
            const n = String(p?.name ?? '').trim();
            const v = String(p?.value ?? '').trim();
            if (!n && !v) return '';
            if (!n) return v;
            if (!v) return n;
            return `${n}:${v}`;
          })
          .filter(Boolean);
        return pairs.length ? pairs.join('; ') : '';
      }

      function openFnParamEditor(fn: FnItem) {
        fnParamEditorTarget.value = fn;
        fnParamDraft.value = normalizeParametersToParams(fn.__raw?.parameters ?? fn.Parameters).map(
          p => ({
            name: String(p?.name ?? ''),
            value: String(p?.value ?? ''),
          })
        );
        fnParamEditorOpen.value = true;
      }

      function closeFnParamEditor() {
        fnParamEditorOpen.value = false;
        fnParamEditorTarget.value = null;
        fnParamDraft.value = [];
      }

      function addFnParamDraft() {
        fnParamDraft.value.push({ name: '', value: '' });
      }

      function removeFnParamDraft(idx: number) {
        fnParamDraft.value.splice(idx, 1);
      }

      function clearFnParamDraft() {
        fnParamDraft.value = [];
      }

      function saveFnParamDraft() {
        const target = fnParamEditorTarget.value;
        if (!target) {
          closeFnParamEditor();
          return;
        }
        target.Parameters = fnParamDraft.value
          .map(p => ({ name: String(p?.name ?? '').trim(), value: String(p?.value ?? '').trim() }))
          .filter(p => p.name || p.value);
        updateFnItem(target, makeFnSnapshot(target));
        closeFnParamEditor();
      }

      function clearTemplateSelection() {
        form.value.template = '';
        templateFunctionKvid.value = '';
        templateFunctionName.value = '';
      }

      const filteredTemplateItems = computed(() => {
        const q = templateSearch.value.trim().toLowerCase();
        if (!q) return templateItems.value;
        return templateItems.value.filter(item => {
          const hay =
            `${item.DisplayName ?? ''} ${item.InternalCode ?? ''} ${item.Handler ?? ''}`.toLowerCase();
          return hay.includes(q);
        });
      });

      async function loadTemplateItems() {
        templateLoading.value = true;
        templateError.value = '';
        try {
          templateItems.value = functionRows.value
            .filter(item => item.is_active)
            .map(item => ({
              Kvid: item.kvid,
              DisplayName: getFunctionDisplayName(item),
              InternalCode: String(item.source_component ?? item.kvid ?? ''),
              Handler: String(item.handler ?? ''),
              ScopeLabel: '',
              __raw: item,
            }));
        } catch (e: any) {
          templateError.value = e?.message ? String(e.message) : '加载失败';
        } finally {
          templateLoading.value = false;
        }
      }

      function openTemplatePicker() {
        if (selectedNode.value?.type === 'folder') {
          showAlert('目录节点不需要绑定模板功能');
          return;
        }
        templatePickerOpen.value = true;
        templateSearch.value = '';
        loadTemplateItems();
      }

      function closeTemplatePicker() {
        templatePickerOpen.value = false;
      }

      function pickTemplate(item: any) {
        const func = item?.__raw as FunctionRow | undefined;
        templateFunctionKvid.value = String(func?.kvid ?? item?.Kvid ?? '');
        templateFunctionName.value = getFunctionDisplayName(func);
        form.value.template = templateFunctionName.value;
        templatePickerOpen.value = false;
      }

      function toggleRelateChecked(kvid: string, ev: Event, item: any) {
        const checked = Boolean((ev.target as HTMLInputElement | null)?.checked);
        relateChecked.value = { ...relateChecked.value, [kvid]: checked };
        if (checked) relateCheckedMap.value[kvid] = item;
        else delete relateCheckedMap.value[kvid];
      }

      const filteredRelateItems = computed(() => relateItems.value);

      watch(relateSearch, () => {
        if (relatePickerOpen.value) {
          loadRelateItems(true);
        }
      });

      async function loadRelateItems(_reset = true) {
        relateLoading.value = true;
        relateLoadingMore.value = false;
        relateError.value = '';
        try {
          const current = selectedNode.value;
          if (!current) {
            relateItems.value = [];
            relateTotal.value = 0;
            return;
          }
          const q = relateSearch.value.trim().toLowerCase();
          const usedFunctionKvids = new Set(
            buildRelatedFunctions(current)
              .map(item => item.FunctionKvid)
              .filter(Boolean) as string[]
          );

          const list = functionRows.value
            .filter(item => item.is_active && !usedFunctionKvids.has(item.kvid))
            .filter(item => {
              if (!q) return true;
              const hay =
                `${getFunctionDisplayName(item)} ${item.handler ?? ''} ${item.source_component ?? ''}`.toLowerCase();
              return hay.includes(q);
            })
            .map(item => ({
              Kvid: item.kvid,
              DisplayName: getFunctionDisplayName(item),
              InternalCode: String(item.source_component ?? ''),
              Handler: String(item.handler ?? ''),
              ScopeLabel: '',
              __raw: item,
            }));

          relateItems.value = list;
          relateTotal.value = list.length;
          relateHasMore.value = false;
          relateChecked.value = {};
          relateCheckedMap.value = {};
        } catch (e: any) {
          relateError.value = e?.message ? String(e.message) : '加载失败';
        } finally {
          relateLoading.value = false;
        }
      }

      function onRelateScroll() {
        // Supabase 数据源下当前使用本地筛选，无需分页加载
      }

      function openRelatePicker() {
        if (!canRelateFunctions.value) {
          showAlert('请先选择根目录或功能目录，再关联功能');
          return;
        }
        relatePickerOpen.value = true;
        relateSearch.value = '';
        loadRelateItems(true);
      }

      function closeRelatePicker() {
        relatePickerOpen.value = false;
      }

      async function confirmRelatePicker() {
        const current = selectedNode.value;
        if (!current) {
          await showAlert('未找到当前菜单数据，请重新选择左侧菜单');
          return;
        }

        const selectedFunctions = Object.values(relateCheckedMap.value).map(
          (item: any) => item.__raw as FunctionRow
        );
        if (selectedFunctions.length === 0) {
          closeRelatePicker();
          return;
        }

        const rootKvid = getNodeRootKvid(current);
        const parentKvid = current.__entityKind === 'root' ? null : current.id;
        const siblingPages = menuRows.value.filter(
          item =>
            item.menu_root_kvid === rootKvid &&
            item.parent_kvid === parentKvid &&
            item.type === 'Page'
        );
        const maxSort =
          siblingPages.length > 0
            ? Math.max(...siblingPages.map(item => Number(item.sort_order ?? 0)))
            : 0;

        const payload = selectedFunctions.map((func, index) => ({
          kvid: generateId(),
          parent_kvid: parentKvid,
          menu_root_kvid: rootKvid,
          title: getFunctionDisplayName(func) || func.handler,
          display_name: getFunctionDisplayName(func) || func.handler,
          internal_code: func.source_component ?? null,
          scope: 'Member',
          type: 'Page' as const,
          icon: func.icon ?? null,
          sort_order: maxSort + index + 1,
          remark: func.remark ?? null,
          function_kvid: func.kvid,
          parameters: func.parameters ?? {},
          is_active: true,
        }));

        try {
          const { error } = await adminSupabase.from('menus').insert(payload);
          if (error) throw error;
          await loadTree();
          clearDynamicRoutesCache();
          closeRelatePicker();
        } catch (e: any) {
          await showAlert('关联失败：' + (e?.message || e), '关联失败');
        }
      }

      function showAlert(message: string, title = '提示'): Promise<void> {
        return new Promise<void>(resolve => {
          dialog.value = {
            open: true,
            title,
            message,
            confirmOnly: true,
            resolve: () => resolve(),
          };
        });
      }

      function showConfirm(message: string, title = '确认'): Promise<boolean> {
        return new Promise<boolean>(resolve => {
          dialog.value = { open: true, title, message, confirmOnly: false, resolve };
        });
      }

      function dialogCancel() {
        dialog.value.resolve?.(false);
        dialog.value.open = false;
      }

      function dialogConfirm() {
        dialog.value.resolve?.(true);
        dialog.value.open = false;
      }

      async function saveCurrent() {
        const node = selectedNode.value;
        if (!node) return;

        const displayName = form.value.displayName.trim();
        if (!displayName) {
          await showAlert('显示名称不能为空');
          return;
        }

        saving.value = true;
        try {
          if (node.__entityKind === 'root') {
            const payload: MenuRootRow = {
              kvid: node.id,
              title: displayName,
              display_name: displayName,
              internal_code: form.value.internalCode.trim(),
              scope: scopeLabelToCode(form.value.scope),
              sort_order: clampMinZero(form.value.sortOrder),
              icon: form.value.iconPath.trim() || null,
              remark: form.value.notes.trim() || null,
              parameters: paramsArrayToObject(params.value),
            };
            if (!payload.internal_code) {
              await showAlert('根目录必须填写内部编号');
              return;
            }
            const { error } = await adminSupabase.from('menu_roots').upsert(payload);
            if (error) throw error;
            await loadTree();
            clearDynamicRoutesCache();
            return;
          }

          const raw = (node.raw ?? {}) as Partial<MenuRow>;
          const isFolder = form.value.type === '目录';
          const payload: MenuRow = {
            kvid: raw.kvid ?? node.id,
            parent_kvid: node.__parentKvid ?? raw.parent_kvid ?? null,
            menu_root_kvid: getNodeRootKvid(node),
            title: raw.title ?? displayName,
            display_name: displayName,
            internal_code: form.value.internalCode.trim() || null,
            scope: scopeLabelToCode(form.value.scope),
            type: isFolder ? 'Folder' : 'Page',
            icon: form.value.iconPath.trim() || null,
            sort_order: clampMinZero(form.value.sortOrder),
            remark: form.value.notes.trim() || null,
            function_kvid: isFolder
              ? null
              : templateFunctionKvid.value || raw.function_kvid || null,
            parameters: paramsArrayToObject(params.value),
            is_active: raw.is_active ?? true,
          };

          if (!isFolder && !payload.function_kvid) {
            await showAlert('功能节点必须绑定模板功能');
            return;
          }

          const { error } = await adminSupabase.from('menus').upsert(payload);
          if (error) throw error;
          await loadTree();
          clearDynamicRoutesCache();
        } catch (e: any) {
          console.error('[MenuConfig] saveCurrent failed', e);
          await showAlert('保存失败：' + (e?.message || e), '保存失败');
        } finally {
          saving.value = false;
        }
      }

      function generateId(): string {
        return (
          (crypto as any).randomUUID?.() ??
          Math.random().toString(36).slice(2) + Date.now().toString(36)
        );
      }

      function addRootFolder() {
        const id = generateId();
        const newNode: TreeNodeData = {
          id,
          label: '新建根目录',
          type: 'folder',
          children: [],
          raw: {
            kvid: id,
            title: '新建根目录',
            display_name: '新建根目录',
            internal_code: '',
            scope: 'Member',
            sort_order: menuRoots.value.length + 1,
            icon: null,
            remark: null,
            parameters: {},
          },
          __isNew: true,
          __entityKind: 'root',
          __rootKvid: id,
        };
        treeData.value.push(newNode);
        openIds.value = new Set([...openIds.value, newNode.id]);
        selectNode(newNode);
      }

      function addChildFolder() {
        if (!selectedNode.value || selectedNode.value.type !== 'folder') return;
        const target = selectedNode.value;
        if (!target.children) target.children = [];
        const id = generateId();
        const rootKvid = getNodeRootKvid(target);
        const parentKvid = target.__entityKind === 'root' ? null : target.id;
        const newNode: TreeNodeData = {
          id,
          label: '新建功能目录',
          type: 'folder',
          children: [],
          parentId: target.id,
          raw: {
            kvid: id,
            parent_kvid: parentKvid,
            menu_root_kvid: rootKvid,
            title: '新建功能目录',
            display_name: '新建功能目录',
            internal_code: '',
            scope: 'Member',
            type: 'Folder',
            icon: null,
            sort_order: (target.children?.length ?? 0) + 1,
            remark: null,
            function_kvid: null,
            parameters: {},
            is_active: true,
          },
          __isNew: true,
          __parentKvid: parentKvid,
          __entityKind: 'menu',
          __rootKvid: rootKvid,
        };
        target.children.push(newNode);
        openIds.value = new Set([...openIds.value, target.id]);
        selectNode(newNode);
      }

      async function deleteSelected() {
        if (!selectedId.value || !selectedNode.value) return;
        const node = selectedNode.value;

        if ((node.children ?? []).length > 0) {
          await showAlert('请先删除子节点，再删除当前节点', '无法删除');
          return;
        }

        if (!(await showConfirm(`确定要删除“${node.label}”吗？`, '确认删除'))) return;

        if (node.__isNew) {
          removeNodeById(treeData.value, node.id);
          selectedId.value = '';
          selectedNode.value = null;
          applySelectedToForm(null);
          functions.value = [];
          return;
        }

        try {
          if (node.__entityKind === 'root') {
            const { error } = await adminSupabase.from('menu_roots').delete().eq('kvid', node.id);
            if (error) throw error;
          } else {
            const { error } = await adminSupabase.from('menus').delete().eq('kvid', node.id);
            if (error) throw error;
          }
          await loadTree();
          clearDynamicRoutesCache();
        } catch (e: any) {
          await showAlert('删除失败：' + (e?.message || e), '删除失败');
        }
      }

      function refreshTree() {
        loadTree();
      }

      onMounted(() => {
        loadTree();
      });

      return {
        showTreeMenu,
        searchQuery,
        flatTree,
        selectedId,
        selectedNode,
        loading,
        canRelateFunctions,
        toggleNode,
        selectNode,
        form,
        params,
        clearParams,
        showParamForm,
        newParam,
        addParam,
        confirmAddParam,
        removeParam,
        functions,
        removeFunction,
        addFunctionParam,
        removeFunctionParam,
        clearFunctionParams,
        startFnEdit,
        commitFnEdit,
        formatFnParameters,
        fnParamEditorOpen,
        fnParamEditorTitle,
        fnParamDraft,
        openFnParamEditor,
        closeFnParamEditor,
        addFnParamDraft,
        removeFnParamDraft,
        clearFnParamDraft,
        saveFnParamDraft,
        templatePickerOpen,
        templateLoading,
        templateError,
        templateSearch,
        filteredTemplateItems,
        openTemplatePicker,
        closeTemplatePicker,
        pickTemplate,
        clearTemplateSelection,
        relatePickerOpen,
        relateLoading,
        relateLoadingMore,
        relateError,
        relateSearch,
        relateItems,
        relateTotalDisplay,
        relateHasMore,
        relateScrollEl,
        relateChecked,
        relateCheckedCount,
        filteredRelateItems,
        openRelatePicker,
        closeRelatePicker,
        confirmRelatePicker,
        loadRelateItems,
        toggleRelateChecked,
        onRelateScroll,
        saving,
        saveCurrent,
        page,
        totalPages,
        addRootFolder,
        addChildFolder,
        deleteSelected,
        refreshTree,
        dialog,
        dialogCancel,
        dialogConfirm,
      };
    },
  });
</script>

<style scoped>
  .tree-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: transparent;
    text-align: left;
    transition: background-color 100ms;
  }

  .tree-menu-item:disabled {
    cursor: not-allowed;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748b;
  }

  :global(.dark) .field-label {
    color: #94a3b8;
  }

  .field-input {
    width: 100%;
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    outline: none;
    transition:
      border-color 150ms,
      box-shadow 150ms,
      background-color 150ms,
      color 150ms;
  }

  :global(html.dark) .field-input,
  :global(.dark) .field-input {
    background: #1e293b !important;
    border-color: #334155 !important;
    color: #e2e8f0 !important;
  }

  .field-input::placeholder {
    color: #94a3b8;
  }

  :global(.dark) .field-input::placeholder {
    color: #64748b;
  }

  .field-input:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 2px rgba(238, 242, 255, 1);
  }

  .abs-arrow {
    position: absolute;
    right: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.875rem;
    height: 0.875rem;
    color: #94a3b8;
    pointer-events: none;
  }

  .fn-grid {
    display: grid;
    grid-template-columns: minmax(140px, 2fr) 70px minmax(120px, 1.5fr) minmax(150px, 2fr) minmax(
        120px,
        1.5fr
      ) 60px;
    column-gap: 0.75rem;
    align-items: center;
  }

  .fn-cell {
    min-height: 2.25rem;
    display: flex;
    align-items: center;
  }

  .pager-btn {
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.375rem;
    border: 1px solid #e2e8f0;
    color: #64748b;
    background: transparent;
    transition:
      color 150ms,
      background-color 150ms,
      border-color 150ms;
  }

  :global(.dark) .pager-btn {
    border-color: #334155;
    color: #94a3b8;
  }

  .pager-btn:hover:not(:disabled) {
    border-color: #a5b4fc;
    color: #4f46e5;
    background: #eef2ff;
  }

  :global(.dark) .pager-btn:hover:not(:disabled) {
    border-color: #4f46e5;
    color: #818cf8;
    background: rgba(49, 46, 129, 0.5);
  }

  .pager-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
