<script setup lang="ts">
defineOptions({ name: 'HomePage' });
import { ref, watch } from 'vue';
import * as Vue from 'vue';
import { kivii } from '@kivii.com/bridge';
import { autoStartupKvid, getGlobalConfig } from '@/router/routes';
import UmdComponentPage from '@/views/_builtin/umd-component/index.vue';
import { loadUmdOnDemand } from '@/utils/remoteComponentLoader';
import { getCurrentInstance } from 'vue';

type RenderType = 'webview' | 'umd' | 'vue' | 'default' | 'loading';

const instance = getCurrentInstance();
const renderType = ref<RenderType>('loading');
const renderUrl = ref('');        // webview 用
const umdComponentName = ref(''); // umd 用
const umdComponentTag = ref('');  // umd 原始标签

function determineType(handler: string): RenderType {
  if (!handler) return 'webview';
  if (handler.endsWith('.vue')) return 'vue';
  if (handler.startsWith('<') && handler.includes('>')) return 'umd';
  return 'webview';
}

function extractComponentName(tag: string): string {
  const match = tag.match(/<([a-zA-Z0-9-]+)[^>]*>/);
  return match ? match[1] : tag;
}

async function loadAutoStartup(kvid: string) {
  renderType.value = 'loading';

  // 确保 window.Vue 已暴露，UMD 模块构建时通常依赖此全局变量
  if (!(window as any).Vue) {
    (window as any).Vue = Vue;
  }

  try {
    const response = await kivii.request.get<any>(
      `/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=${kvid}`
    );
    const results = response.data?.Results ?? [];
    if (!results.length) {
      renderType.value = 'default';
      return;
    }

    const handler: string = results[0].Handler ?? '';
    const type = determineType(handler);

    const config = getGlobalConfig();
    const origin = config.Origin || (config.UseWindowOrigin ? window.location.origin : '');

    if (type === 'umd') {
      const compName = extractComponentName(handler);
      umdComponentName.value = compName;
      umdComponentTag.value = handler;

      // 从 Remark 字段读取 UMD 文件地址，懒加载（仅首次未注册时加载）
      const scriptPath: string | undefined = results[0].Remark;
      if (scriptPath && instance) {
        const isRegistered = Object.prototype.hasOwnProperty.call(
          instance.appContext.components,
          compName
        );
        if (!isRegistered) {
          await loadUmdOnDemand(instance.appContext.app, scriptPath);
        }
      }
      // UMD 文件加载完毕、组件已注册后再切换渲染类型，确保 UmdComponentPage 挂载时能找到组件
      renderType.value = 'umd';
    } else if (type === 'webview') {
      renderUrl.value = handler.startsWith('http') ? handler : origin + handler;
      renderType.value = 'webview';
    } else {
      // vue / 其他暂降级为 webview
      renderUrl.value = handler.startsWith('http') ? handler : origin + handler;
      renderType.value = 'webview';
    }
  } catch (e) {
    console.error('[HomePage] AutoStartup 加载失败:', e);
    renderType.value = 'default';
  }
}

// 监听 autoStartupKvid：
//   string(非空) → 调用 Access.json
//   null         → 显示默认首页（接口已返回，无 AutoStartup 配置）
//   undefined    → 保持 loading（接口尚未返回）
watch(
  autoStartupKvid,
  kvid => {
    if (typeof kvid === 'string' && kvid !== '') {
      loadAutoStartup(kvid);
    } else if (kvid === null) {
      renderType.value = 'default';
    }
  },
  { immediate: true }
);
</script>

<template>
  <!-- 加载中 -->
  <div
    v-if="renderType === 'loading'"
    class="flex items-center justify-center w-full h-full text-gray-400"
  >
    <i class="fas fa-spinner fa-spin text-2xl" />
  </div>

  <!-- Webview：直接 iframe，全屏铺满 -->
  <iframe
    v-else-if="renderType === 'webview'"
    :src="renderUrl"
    class="w-full h-full border-0"
    allowfullscreen
  />

  <!-- UMD 组件 -->
  <UmdComponentPage
    v-else-if="renderType === 'umd'"
    :component-name="umdComponentName"
    :component-tag="umdComponentTag"
  />

  <!-- 默认欢迎页（无 AutoStartup 配置） -->
  <div
    v-else
    class="space-y-6"
  >
    <div class="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-900 dark:to-gray-800 rounded-xl p-6 text-white">
      <h1 class="text-2xl font-bold mb-2">欢迎使用 Kivii Admin</h1>
      <p class="text-blue-100 dark:text-blue-200">一个现代化的 Vue 3 + Tailwind CSS 中后台管理模板</p>
    </div>
  </div>
</template>
