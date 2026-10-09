import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { login, register } from '@/api/nest-client';
import { reloadDynamicRoutes } from '@/router';
import { syncAuthState } from '@/utils/auth-state';
import { validateNewPassword } from '@/utils/password-policy';

export function useLoginForm() {
  const router = useRouter();
  const route = useRoute();
  const form = reactive({ username: '', password: '' });
  const isLoading = ref(false);
  const errorMsg = ref('');
  const isSignUp = ref(false);
  const resetHelpVisible = ref(false);

  function toggleMode() {
    if (isLoading.value) return;
    isSignUp.value = !isSignUp.value;
    errorMsg.value = '';
    resetHelpVisible.value = false;
  }

  async function handleLogin() {
    if (isLoading.value) return;
    const email = form.username.trim();
    if (!email || !form.password) {
      errorMsg.value = !email ? '请输入邮箱地址' : '请输入密码';
      return;
    }
    const passwordError = isSignUp.value ? validateNewPassword(form.password) : null;
    if (passwordError) {
      errorMsg.value = passwordError;
      return;
    }
    isLoading.value = true;
    errorMsg.value = '';
    try {
      await (isSignUp.value ? register : login)(email, form.password);
      await syncAuthState();
      await reloadDynamicRoutes();
      const target = route.query.redirect;
      const redirect =
        typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
          ? target
          : '/';
      if (import.meta.env.PROD) sessionStorage.setItem('need_reload_after_login', 'true');
      await router.replace(redirect);
    } catch (error) {
      errorMsg.value = error instanceof Error ? error.message : '操作失败，请稍后重试';
    } finally {
      isLoading.value = false;
    }
  }
  return { form, isLoading, errorMsg, isSignUp, resetHelpVisible, handleLogin, toggleMode };
}
