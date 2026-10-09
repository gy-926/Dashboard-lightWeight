import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest, clearAuth, getCurrentUser, refreshAuth } from '@/api/nest-client';
import { validateNewPassword } from '@/utils/password-policy';

export function usePasswordChange() {
  const router = useRouter();
  const form = reactive({ oldPassword: '', password: '', confirmPassword: '' });
  const isLoading = ref(false);
  const errorMsg = ref('');
  const successMsg = ref('');
  let redirectTimer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  onMounted(async () => {
    if (!getCurrentUser() && !(await refreshAuth()) && !disposed)
      errorMsg.value = '请先登录后修改密码';
  });
  onUnmounted(() => {
    disposed = true;
    clearTimeout(redirectTimer);
  });

  async function handleUpdatePassword() {
    if (isLoading.value || successMsg.value) return;
    if (!form.oldPassword || !form.password || !form.confirmPassword) {
      errorMsg.value = '请输入原密码、新密码并确认';
      return;
    }
    if (form.password !== form.confirmPassword) {
      errorMsg.value = '两次输入的密码不一致';
      return;
    }
    const passwordError = validateNewPassword(form.password);
    if (passwordError) {
      errorMsg.value = passwordError;
      return;
    }
    isLoading.value = true;
    errorMsg.value = '';
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword: form.oldPassword, newPassword: form.password }),
      });
      clearAuth();
      if (disposed) return;
      successMsg.value = '密码修改成功！即将跳转至登录页...';
      redirectTimer = setTimeout(() => {
        void router.replace('/login');
      }, 2000);
    } catch (error) {
      if (!disposed)
        errorMsg.value = error instanceof Error ? error.message : '密码修改失败，请重试';
    } finally {
      isLoading.value = false;
    }
  }
  return { form, isLoading, errorMsg, successMsg, handleUpdatePassword };
}
