<script setup lang="ts">
import { ref, reactive } from 'vue'
import { kivii } from '@kivii.com/bridge'
import { closeReLogin } from '@/composables/useReLogin'

const form = reactive({ username: '', password: '' })
const isLoading = ref(false)
const errorMsg = ref('')

function getMd5Password(password: string) {
  const md5Api = window as Window & {
    b64_md5?: (value: string) => string
    hex_md5?: (value: string) => string
    md5?: (value: string) => string
  }
  const encrypt = md5Api.b64_md5 || md5Api.hex_md5 || md5Api.md5
  if (typeof encrypt !== 'function') {
    throw new Error('MD5 加密脚本未加载，请稍后重试')
  }
  return encrypt(password)
}

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    await kivii.request.post<any>('/auth/kivii.json', {
      State: 'SHA1',
      UserName: form.username,
      Password: getMd5Password(form.password),
    })
    form.username = ''
    form.password = ''
    closeReLogin()
  } catch (e: any) {
    errorMsg.value = e.message || '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="relogin-overlay">
    <div class="relogin-card">
      <div class="relogin-header">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" class="relogin-icon">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <div>
          <h2 class="relogin-title">登录已过期</h2>
          <p class="relogin-subtitle">请重新输入账号密码以继续</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="relogin-form">
        <div class="field-group">
          <div class="field-label">用户名</div>
          <div class="field-input-wrap" :class="{ disabled: isLoading }">
            <span class="field-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              </svg>
            </span>
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              :disabled="isLoading"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="field-group">
          <div class="field-label">密码</div>
          <div class="field-input-wrap" :class="{ disabled: isLoading }">
            <span class="field-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </span>
            <input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              :disabled="isLoading"
              autocomplete="current-password"
            />
          </div>
        </div>

        <transition name="shake">
          <div v-if="errorMsg" class="error-alert">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            {{ errorMsg }}
          </div>
        </transition>

        <button type="submit" class="login-btn" :disabled="isLoading">
          <span v-if="!isLoading" class="btn-content">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <polyline points="10 17 15 12 10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            重新登录
          </span>
          <span v-else class="btn-spinner">
            <span class="spinner-ring"></span>
            验证中...
          </span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.relogin-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.relogin-card {
  width: 100%;
  max-width: 380px;
  padding: 32px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05);
  margin: 16px;
}

.relogin-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.relogin-icon {
  flex-shrink: 0;
  color: #f59e0b;
  width: 36px;
  height: 36px;
}

.relogin-title {
  margin: 0 0 2px;
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
}

.relogin-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

.relogin-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.field-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input-wrap:focus-within {
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.field-input-wrap.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.field-icon {
  display: flex;
  align-items: center;
  padding: 0 10px 0 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.field-input-wrap input {
  flex: 1;
  padding: 11px 12px 11px 0;
  font-size: 14px;
  color: #1e293b;
  background: transparent;
  border: none;
  outline: none;
  min-width: 0;
}

.field-input-wrap input::placeholder {
  color: #cbd5e1;
}

.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  font-size: 13px;
  color: #ef4444;
}

.shake-enter-active {
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px;
  margin-top: 2px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  letter-spacing: 0.3px;
  transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 7px;
}

.btn-spinner {
  display: flex;
  align-items: center;
  gap: 9px;
}

.spinner-ring {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
