<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { apiRequest, clearAuth } from '@/api/nest-client';
  import { useUserProfile } from '@/composables/useUserProfile';
  import { updateMyAvatar, updateMyName } from '@/api/user-profile';
  import { validateNewPassword } from '@/utils/password-policy';

  const props = defineProps<{
    visible: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'update:visible', val: boolean): void;
  }>();

  function close() {
    emit('update:visible', false);
  }

  // 当前 Tab
  type Tab = 'avatar' | 'password' | 'alias';
  const activeTab = ref<Tab>('avatar');

  const { currentUserName, currentUserAvatar: currentAvatar } = useUserProfile();

  // ── 头像 ──
  const avatarPreview = ref<string>('');
  const avatarFile = ref<File | null>(null);
  const avatarLoading = ref(false);
  const avatarMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

  watch(
    () => props.visible,
    val => {
      if (!val) avatarFile.value = null;
      if (val) {
        avatarPreview.value = currentAvatar.value;
        avatarFile.value = null;
        avatarMessage.value = null;
        passwordForm.value = { old: '', next: '', confirm: '' };
        passwordMessage.value = null;
        aliasForm.value = { displayName: currentUserName.value };
        aliasMessage.value = null;
        activeTab.value = 'avatar';
      }
    }
  );

  function onAvatarFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
      avatarMessage.value = { type: 'error', text: '请选择 PNG、JPEG、GIF 或 WebP 图片' };
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      avatarMessage.value = { type: 'error', text: '图片大小不能超过 2MB' };
      return;
    }
    avatarFile.value = file;
    avatarMessage.value = null;
    const reader = new FileReader();
    reader.onload = ev => {
      if (avatarFile.value === file) avatarPreview.value = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // 重置 input，允许重复选同一文件
    input.value = '';
  }

  async function saveAvatar() {
    if (avatarLoading.value) return;
    if (!avatarFile.value) {
      avatarMessage.value = { type: 'error', text: '请先选择头像图片' };
      return;
    }
    avatarLoading.value = true;
    avatarMessage.value = null;
    try {
      await updateMyAvatar(avatarFile.value);
      avatarFile.value = null;
      avatarMessage.value = { type: 'success', text: '头像更新成功' };
    } catch (error: any) {
      avatarMessage.value = { type: 'error', text: error?.message || '头像上传失败，请重试' };
    } finally {
      avatarLoading.value = false;
    }
  }

  // ── 密码 ──
  const passwordForm = ref({ old: '', next: '', confirm: '' });
  const passwordLoading = ref(false);
  const passwordMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);
  const showNext = ref(false);
  const showConfirm = ref(false);

  async function savePassword() {
    if (passwordLoading.value) return;
    if (!passwordForm.value.old || !passwordForm.value.next || !passwordForm.value.confirm) {
      passwordMessage.value = { type: 'error', text: '请填写原密码、新密码和确认密码' };
      return;
    }
    const passwordError = validateNewPassword(passwordForm.value.next);
    if (passwordError) {
      passwordMessage.value = { type: 'error', text: passwordError };
      return;
    }
    if (passwordForm.value.next !== passwordForm.value.confirm) {
      passwordMessage.value = { type: 'error', text: '两次输入的密码不一致，请重新输入' };
      return;
    }
    passwordLoading.value = true;
    passwordMessage.value = null;
    try {
      await apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify({ oldPassword: passwordForm.value.old, newPassword: passwordForm.value.next }) });
      passwordMessage.value = { type: 'success', text: '密码修改成功' };
      passwordForm.value = { old: '', next: '', confirm: '' };
      clearAuth();
    } catch {
      passwordMessage.value = { type: 'error', text: '密码修改失败，请重试' };
    } finally {
      passwordLoading.value = false;
    }
  }

  // ── 显示名称 ──
  const aliasForm = ref({ displayName: '' });
  const aliasLoading = ref(false);
  const aliasMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

  async function saveAlias() {
    if (aliasLoading.value) return;
    const name = aliasForm.value.displayName.trim();
    if (!name) {
      aliasMessage.value = { type: 'error', text: '请输入显示名称' };
      return;
    }
    aliasLoading.value = true;
    aliasMessage.value = null;
    try {
      const user = await updateMyName(name);
      aliasForm.value.displayName = user.name;
      aliasMessage.value = { type: 'success', text: '显示名称更新成功' };
    } catch (error: any) {
      aliasMessage.value = { type: 'error', text: error?.message || '显示名称更新失败，请重试' };
    } finally {
      aliasLoading.value = false;
    }
  }
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-2"
          appear
        >
          <div
            v-if="visible"
            class="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            style="width: 420px;"
            role="dialog"
            aria-modal="true"
            aria-label="个人中心"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                  <i class="fas fa-user-circle text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-800 dark:text-white">{{ currentUserName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">个人中心</p>
                </div>
              </div>
              <button
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                @click="close"
                aria-label="关闭个人中心"
              >
                <i class="fas fa-times" />
              </button>
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-gray-200 dark:border-gray-700">
              <button
                v-for="tab in [
                  { key: 'avatar', icon: 'fa-camera', label: '修改头像' },
                  { key: 'password', icon: 'fa-lock', label: '修改密码' },
                  { key: 'alias', icon: 'fa-id-badge', label: '修改显示名称' },
                ]"
                :key="tab.key"
                class="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px"
                :class="
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                "
                @click="activeTab = tab.key as Tab"
              >
                <i :class="['fas', tab.icon, 'text-xs']" />
                {{ tab.label }}
              </button>
            </div>

            <!-- Tab Content -->
            <div class="p-6" style="height: 380px;">
              <!-- 修改头像 -->
              <div v-if="activeTab === 'avatar'" class="space-y-5">
                <div class="flex flex-col items-center gap-4">
                  <!-- 头像预览 -->
                  <div class="relative group cursor-pointer">
                    <div
                      class="w-24 h-24 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ring-4 ring-blue-100 dark:ring-blue-900/40"
                    >
                      <img
                        v-if="avatarPreview"
                        :src="avatarPreview"
                        alt="avatar"
                        class="w-full h-full object-cover"
                      />
                      <i
                        v-else
                        class="fas fa-user text-3xl text-blue-400 dark:text-blue-500"
                      />
                    </div>
                    <label
                      class="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <i class="fas fa-camera text-white text-xl" />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                    :disabled="avatarLoading"
                        class="hidden"
                        @change="onAvatarFileChange"
                      />
                    </label>
                  </div>
                  <p class="text-xs text-gray-400 dark:text-gray-500">点击头像选择图片（最大 2MB）</p>
                </div>

                <!-- 或点击按钮选择 -->
                <label class="block w-full">
                  <span
                    class="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    <i class="fas fa-cloud-upload-alt" />
                    选择图片文件
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    :disabled="avatarLoading"
                    class="hidden"
                    @change="onAvatarFileChange"
                  />
                </label>

                <!-- 提示信息 -->
                <div
                  v-if="avatarMessage"
                  class="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  :class="
                    avatarMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  "
                >
                  <i :class="['fas', avatarMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle']" />
                  {{ avatarMessage.text }}
                </div>

                <button
                  class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :disabled="avatarLoading || !avatarFile"
                  @click="saveAvatar"
                >
                  <i v-if="avatarLoading" class="fas fa-spinner fa-spin" />
                  <i v-else class="fas fa-save" />
                  {{ avatarLoading ? '保存中...' : '保存头像' }}
                </button>
              </div>

              <!-- 修改密码 -->
              <div v-else-if="activeTab === 'password'" class="space-y-4">
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">原密码</label>
                  <input v-model="passwordForm.old" type="password" autocomplete="current-password" placeholder="请输入原密码" class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white" />
                </div>
                <!-- 新密码 -->
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">新密码</label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.next"
                      :type="showNext ? 'text' : 'password'"
                      placeholder="至少 8 位，含字母、数字和符号"
                      class="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      @click="showNext = !showNext"
                    >
                      <i :class="['fas', showNext ? 'fa-eye-slash' : 'fa-eye', 'text-xs']" />
                    </button>
                  </div>
                </div>

                <!-- 确认新密码 -->
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">确认新密码</label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.confirm"
                      :type="showConfirm ? 'text' : 'password'"
                      placeholder="请再次输入新密码"
                      class="w-full px-3 py-2.5 pr-10 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      @keydown.enter="savePassword"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      @click="showConfirm = !showConfirm"
                    >
                      <i :class="['fas', showConfirm ? 'fa-eye-slash' : 'fa-eye', 'text-xs']" />
                    </button>
                  </div>
                </div>

                <!-- 提示信息 -->
                <div
                  v-if="passwordMessage"
                  class="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  :class="
                    passwordMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  "
                >
                  <i :class="['fas', passwordMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle']" />
                  {{ passwordMessage.text }}
                </div>

                <button
                  class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :disabled="passwordLoading"
                  @click="savePassword"
                >
                  <i v-if="passwordLoading" class="fas fa-spinner fa-spin" />
                  <i v-else class="fas fa-key" />
                  {{ passwordLoading ? '修改中...' : '修改密码' }}
                </button>
              </div>

              <!-- 修改显示名称 -->
              <div v-else-if="activeTab === 'alias'" class="space-y-4">
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">显示名称</label>
                  <input
                    v-model="aliasForm.displayName"
                    type="text"
                    placeholder="请输入显示名称"
                    maxlength="100"
                    class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    @keydown.enter="saveAlias"
                  />
                  <p class="text-xs text-gray-400 dark:text-gray-500 text-right">{{ aliasForm.displayName.length }}/100</p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p class="flex items-center gap-1.5">
                    <i class="fas fa-info-circle text-blue-400" />
                    显示名称将展示在顶部导航栏和系统中
                  </p>
                  <p class="flex items-center gap-1.5">
                    <i class="fas fa-info-circle text-blue-400" />
                    支持中英文、数字等字符，最多 100 个字符
                  </p>
                </div>

                <!-- 提示信息 -->
                <div
                  v-if="aliasMessage"
                  class="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                  :class="
                    aliasMessage.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  "
                >
                  <i :class="['fas', aliasMessage.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle']" />
                  {{ aliasMessage.text }}
                </div>

                <button
                  class="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  :disabled="aliasLoading"
                  @click="saveAlias"
                >
                  <i v-if="aliasLoading" class="fas fa-spinner fa-spin" />
                  <i v-else class="fas fa-save" />
                  {{ aliasLoading ? '保存中...' : '保存显示名称' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
