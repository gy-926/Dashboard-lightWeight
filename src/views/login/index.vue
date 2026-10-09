<script setup lang="ts">
  import AuthShell from './components/AuthShell.vue';
  import { useLoginForm } from './useLoginForm';
  import { NEW_PASSWORD_HINT } from '@/utils/password-policy';
  const { form, isLoading, errorMsg, isSignUp, resetHelpVisible, handleLogin, toggleMode } =
    useLoginForm();
</script>

<template>
  <AuthShell :title="isSignUp ? '创建账号' : '安全登录'">
    <form
      @submit.prevent="handleLogin"
      class="login-form"
      autocomplete="off"
    >
      <p
        v-if="resetHelpVisible"
        role="status"
        class="mb-4 text-sm text-slate-500"
      >
        请联系管理员重置密码，当前未提供邮件重置服务。
      </p>
      <!-- 邮箱 -->
      <div class="field-group">
        <div class="field-label">邮箱地址</div>
        <div
          class="field-input-wrap"
          :class="{ disabled: isLoading }"
        >
          <span class="field-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <polyline
                points="22,6 12,13 2,6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <input
            id="username"
            v-model="form.username"
            type="email"
            placeholder="请输入邮箱"
            :disabled="isLoading"
            autocomplete="email"
          />
        </div>
      </div>

      <!-- 密码 -->
      <div class="field-group">
        <div class="field-label">
          密码
          <!-- 忘记密码链接 (仅在登录模式下显示) -->
          <a
            v-if="!isSignUp"
            href="#"
            @click.prevent="resetHelpVisible = true"
            class="forgot-password-link"
          >
            忘记密码？
          </a>
        </div>
        <div
          class="field-input-wrap"
          :class="{ disabled: isLoading }"
        >
          <span class="field-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="3"
                y="11"
                width="18"
                height="11"
                rx="2"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M7 11V7a5 5 0 0 1 10 0v4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </span>
          <input
            id="password"
            v-model="form.password"
            type="password"
            :placeholder="isSignUp ? '至少 8 位，含字母、数字和符号' : '请输入密码'"
            :disabled="isLoading"
            :autocomplete="isSignUp ? 'new-password' : 'current-password'"
          />
        </div>
        <div
          v-if="isSignUp"
          class="text-xs text-slate-500 mt-2"
        >
          {{ NEW_PASSWORD_HINT }}
        </div>
      </div>

      <!-- 错误提示 -->
      <transition name="shake">
        <div
          v-if="errorMsg"
          class="error-alert"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="2"
            />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="12"
              y1="16"
              x2="12.01"
              y2="16"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          {{ errorMsg }}
        </div>
      </transition>

      <!-- 登录/注册/重置按钮 -->
      <button
        type="submit"
        class="login-btn"
        :disabled="isLoading"
      >
        <span
          v-if="!isLoading"
          class="btn-content"
        >
          <svg
            v-if="!isSignUp"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <polyline
              points="10 17 15 12 10 7"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <line
              x1="15"
              y1="12"
              x2="3"
              y2="12"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <svg
            v-else
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M16 21v-2a4 4 0 0 0-4-4H5c-1.1 0-2 .9-2 2v2"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle
              cx="8.5"
              cy="7"
              r="4"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="20"
              y1="8"
              x2="20"
              y2="14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
            <line
              x1="23"
              y1="11"
              x2="17"
              y2="11"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          {{ isSignUp ? '注 册' : '登 录' }}
        </span>
        <span
          v-else
          class="btn-spinner"
        >
          <span class="spinner-ring"></span>
          {{ isSignUp ? '注册中...' : '登录中...' }}
        </span>
      </button>

      <!-- 切换登录/注册 -->
      <div
        class="toggle-mode"
        style="text-align: center; margin-top: 16px"
      >
        <a
          href="#"
          @click.prevent="toggleMode"
          style="color: #3b82f6; font-size: 14px; text-decoration: none"
        >
          {{ isSignUp ? '已有账号？去登录' : '没有账号？去注册' }}
        </a>
      </div>
    </form>
  </AuthShell>
</template>
