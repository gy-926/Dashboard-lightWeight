import { computed, readonly, ref, watch } from 'vue';
import { apiFetch, useCurrentUser } from '@/api/nest-client';

const user = useCurrentUser();
const avatarUrl = ref('');
let avatarGeneration = 0;

// 私有头像携带访问令牌读取后使用 Blob URL；账号切换时立即清理，旧请求不能覆盖新账号。
watch(() => [user.value?.id, user.value?.avatarFileId], async ([userId, fileId]) => {
  const generation = ++avatarGeneration;
  if (avatarUrl.value) URL.revokeObjectURL(avatarUrl.value);
  avatarUrl.value = '';
  if (!userId || !fileId) return;
  try {
    const response = await apiFetch('/users/me/avatar');
    if (!response.ok) return;
    const blob = await response.blob();
    if (generation === avatarGeneration) avatarUrl.value = URL.createObjectURL(blob);
  } catch {
    // 文件缺失或网络不可用时显示默认头像，不影响工作台。
  }
}, { immediate: true });

export function useUserProfile() {
  return {
    currentUser: user,
    currentUserName: computed(() => user.value?.name || '用户'),
    currentUserAvatar: readonly(avatarUrl),
  };
}
