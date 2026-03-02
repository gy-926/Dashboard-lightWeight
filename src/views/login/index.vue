<script setup lang="ts">
  import { ref, reactive } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { reloadDynamicRoutes } from '@/router';
  import { kivii } from '@kivii.com/bridge';

  const router = useRouter();
  const route = useRoute();

  // 表单数据
  const form = reactive({
    username: '',
    password: '',
  });

  // 状态
  const isLoading = ref(false);
  const errorMsg = ref('');

  // 登录
  async function handleLogin() {
    if (!form.username || !form.password) {
      errorMsg.value = '请输入用户名和密码';
      return;
    }

    isLoading.value = true;
    errorMsg.value = '';

    try {
      const response = await kivii.request.post<any>('/auth/kivii.json', {
        username: form.username,
        password: form.password,
      });
      const data = response.data;

      console.log('登录成功:', data);

      // 重新加载动态路由（会清除缓存并重新请求菜单接口）
      await reloadDynamicRoutes();

      // 跳转到来源页或首页
      const redirect = (route.query.redirect as string) || '/';
      router.replace(redirect);
    } catch (e: any) {
      errorMsg.value = e.message || '登录失败，请稍后重试';
    } finally {
      isLoading.value = false;
    }
  }
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>登录系统</h1>
        <p>请输入您的账号信息</p>
      </div>

      <form
        @submit.prevent="handleLogin"
        class="login-form"
      >
        <div class="form-item">
          <label for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            placeholder="请输入用户名"
            :disabled="isLoading"
          />
        </div>

        <div class="form-item">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :disabled="isLoading"
          />
        </div>

        <div
          v-if="errorMsg"
          class="error-message"
        >
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          class="login-btn"
          :disabled="isLoading"
        >
          {{ isLoading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-footer">
        <p>Demo 测试账号: admin / admin123</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .login-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .login-card {
    width: 100%;
    max-width: 400px;
    padding: 40px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  }

  .login-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .login-header h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    color: #333;
  }

  .login-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-item label {
    font-size: 14px;
    color: #333;
    font-weight: 500;
  }

  .form-item input {
    padding: 12px 16px;
    font-size: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    outline: none;
    transition:
      border-color 0.3s,
      box-shadow 0.3s;
  }

  .form-item input:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .form-item input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }

  .error-message {
    padding: 12px;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    color: #dc2626;
    font-size: 14px;
    text-align: center;
  }

  .login-btn {
    padding: 14px;
    font-size: 16px;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition:
      transform 0.2s,
      box-shadow 0.2s;
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  .login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .login-footer {
    margin-top: 24px;
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }

  .login-footer p {
    margin: 0;
    color: #999;
    font-size: 13px;
  }
</style>
