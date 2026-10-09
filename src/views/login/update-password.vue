<script setup lang="ts">
  import AuthShell from './components/AuthShell.vue';
  import { usePasswordChange } from './usePasswordChange';
  const { form, isLoading, errorMsg, successMsg, handleUpdatePassword } = usePasswordChange();
</script>

<template>
  <AuthShell title="修改密码">
    <form
      @submit.prevent="handleUpdatePassword"
      class="login-form"
      autocomplete="off"
    >
      <!-- 新密码 -->
      <div class="field-group">
        <div class="field-label">原密码</div>
        <div
          class="field-input-wrap"
          :class="{ disabled: isLoading }"
        >
          <input
            v-model="form.oldPassword"
            type="password"
            placeholder="请输入原密码"
            :disabled="isLoading || Boolean(successMsg)"
            autocomplete="current-password"
          />
        </div>
      </div>
      <div class="field-group">
        <div class="field-label">新密码</div>
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
            placeholder="至少 8 位，含字母、数字和符号"
            :disabled="isLoading || Boolean(successMsg)"
            autocomplete="new-password"
          />
        </div>
      </div>

      <!-- 确认新密码 -->
      <div class="field-group">
        <div class="field-label">确认新密码</div>
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
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            :disabled="isLoading || Boolean(successMsg)"
            autocomplete="new-password"
          />
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

      <!-- 成功提示 -->
      <transition name="fade">
        <div
          v-if="successMsg"
          class="success-alert"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <polyline
              points="22 4 12 14.01 9 11.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          {{ successMsg }}
        </div>
      </transition>

      <!-- 登录/注册/重置按钮 -->
      <button
        type="submit"
        class="login-btn"
        :disabled="isLoading || Boolean(successMsg)"
      >
        <span
          v-if="!isLoading"
          class="btn-content"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          确认修改
        </span>
        <span
          v-else
          class="btn-spinner"
        >
          <span class="spinner-ring"></span>
          处理中...
        </span>
      </button>

      <div
        class="toggle-mode"
        style="text-align: center; margin-top: 16px"
      >
        <router-link
          to="/login"
          style="color: #3b82f6; font-size: 14px; text-decoration: none"
        >
          返回登录
        </router-link>
      </div>
    </form>
  </AuthShell>
</template>
