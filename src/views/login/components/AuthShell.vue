<script setup lang="ts">
  import { computed } from 'vue';
  import { useMenuStore } from '@/layouts/modules/global-menu/store';
  defineProps<{ title: string }>();
  const menuStore = useMenuStore();
  const isDark = computed(() => menuStore.theme.darkMode);
  const toggleTheme = () => menuStore.toggleDarkMode();
</script>

<template>
  <div
    class="login-page"
    :class="isDark ? 'is-dark' : 'is-light'"
  >
    <!-- 动态背景光晕 -->
    <div class="bg-orb bg-orb-1"></div>
    <div class="bg-orb bg-orb-2"></div>
    <div class="bg-orb bg-orb-3"></div>

    <!-- 网格纹理叠加 -->
    <div class="bg-grid"></div>

    <!-- 主体卡片 -->
    <div class="glass-card">
      <!-- 主题切换按钮 -->
      <button
        class="theme-toggle"
        @click="toggleTheme"
        :title="isDark ? '切换浅色模式' : '切换深色模式'"
      >
        <!-- 月亮 (dark 模式下显示，点击切换到 light) -->
        <svg
          v-if="isDark"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <!-- 太阳 (light 模式下显示，点击切换到 dark) -->
        <svg
          v-else
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="5"
            stroke="currentColor"
            stroke-width="2"
          />
          <line
            x1="12"
            y1="1"
            x2="12"
            y2="3"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="12"
            y1="21"
            x2="12"
            y2="23"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="4.22"
            y1="4.22"
            x2="5.64"
            y2="5.64"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="18.36"
            y1="18.36"
            x2="19.78"
            y2="19.78"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="1"
            y1="12"
            x2="3"
            y2="12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="21"
            y1="12"
            x2="23"
            y2="12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="4.22"
            y1="19.78"
            x2="5.64"
            y2="18.36"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="18.36"
            y1="5.64"
            x2="19.78"
            y2="4.22"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <!-- 品牌区域 -->
      <div class="brand-area">
        <div class="brand-logo">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              width="40"
              height="40"
              rx="10"
              fill="url(#logoGrad)"
            />
            <path
              d="M12 20L18 26L28 14"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <defs>
              <linearGradient
                id="logoGrad"
                x1="0"
                y1="0"
                x2="40"
                y2="40"
                gradientUnits="userSpaceOnUse"
              >
                <stop stop-color="#3B82F6" />
                <stop
                  offset="1"
                  stop-color="#1D4ED8"
                />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="brand-text">
          <h1 class="brand-name">GavinYinHub</h1>
          <p class="brand-tagline">企业级后台管理系统</p>
        </div>
      </div>

      <div class="divider">
        <span>{{ title }}</span>
      </div>
      <slot />
      <!-- 底部信息 -->
      <div class="card-footer">
        <div class="security-badge">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linejoin="round"
            />
          </svg>
          SSL 加密传输
        </div>
      </div>
    </div>

    <!-- 页脚版权 -->
    <div class="page-footer">© 2026 GavinYinHub · 保留所有权利</div>
  </div>
</template>

<style src="../auth-shell.css"></style>
<style src="../auth-form.css"></style>
