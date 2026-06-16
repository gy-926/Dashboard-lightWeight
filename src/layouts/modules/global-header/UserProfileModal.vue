<script setup lang="ts">
  import { ref, computed, watch } from 'vue';
  import { kivii } from '@kivii.com/bridge';

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

  // 当前用户信息
  const currentUserName = computed(() => (window as any).KiviiContext?.CurrentMember?.DisplayName || 'Admin');
  const currentAvatar = computed(() => (window as any).KiviiContext?.CurrentMember?.Avatar || '');

  // ── 头像 ──
  const avatarPreview = ref<string>('');
  const avatarFile = ref<File | null>(null);
  const avatarLoading = ref(false);
  const avatarMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

  watch(
    () => props.visible,
    val => {
      if (val) {
        avatarPreview.value = currentAvatar.value;
        avatarFile.value = null;
        avatarMessage.value = null;
        passwordForm.value = { next: '', confirm: '' };
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
    if (!file.type.startsWith('image/')) {
      avatarMessage.value = { type: 'error', text: '请选择图片文件' };
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
      avatarPreview.value = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    // 重置 input，允许重复选同一文件
    input.value = '';
  }

  async function saveAvatar() {
    if (!avatarFile.value) {
      avatarMessage.value = { type: 'error', text: '请先选择头像图片' };
      return;
    }
    const member = (window as any).KiviiContext?.CurrentMember;
    if (!member?.Kvid) {
      avatarMessage.value = { type: 'error', text: '无法获取当前用户信息，请刷新后重试' };
      return;
    }
    avatarLoading.value = true;
    avatarMessage.value = null;
    try {
      const formData = new FormData();
      formData.append('OwnerKvid', member.Kvid);
      formData.append('Description', member.DisplayName || '');
      formData.append('FileName', member.DisplayName || '');
      formData.append('FolderPath', '/Organizations/Member/Avatars');
      formData.append('FolderType', 'Kivii.Organizations.Entities.Member');
      formData.append('uploadFile', avatarFile.value);
      // 使用原生 fetch 上传，避免 bridge 将 FormData 序列化为 JSON 导致文件丢失
      const res = await fetch('/storages.json', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (member) {
        member.Avatar = avatarPreview.value;
      }
      avatarMessage.value = { type: 'success', text: '头像更新成功' };
    } catch {
      avatarMessage.value = { type: 'error', text: '头像更新失败，请重试' };
    } finally {
      avatarLoading.value = false;
    }
  }

  // ── 密码 ──
  const passwordForm = ref({ next: '', confirm: '' });
  const passwordLoading = ref(false);
  const passwordMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);
  const showNext = ref(false);
  const showConfirm = ref(false);

  async function savePassword() {
    if (!passwordForm.value.next || !passwordForm.value.confirm) {
      passwordMessage.value = { type: 'error', text: '请填写新密码和确认密码' };
      return;
    }
    if (passwordForm.value.next.length < 6) {
      passwordMessage.value = { type: 'error', text: '新密码不能少于 6 位' };
      return;
    }
    if (passwordForm.value.next !== passwordForm.value.confirm) {
      passwordMessage.value = { type: 'error', text: '两次输入的密码不一致，请重新输入' };
      return;
    }
    passwordLoading.value = true;
    passwordMessage.value = null;
    try {
      // 第一步：查询当前登录账号，获取 Account Kvid
      const queryRes = await kivii.request.post<any>(
        '/Restful/Kivii.Organizations.Entities.Account/Query.json',
        {}
      );
      const accountKvid = queryRes?.data?.Results?.[0]?.Kvid;
      if (!accountKvid) {
        passwordMessage.value = { type: 'error', text: '无法获取账号信息，请刷新后重试' };
        return;
      }
      // 第二步：用 Account Kvid 修改密码
      await kivii.request.post('/Restful/Kivii.Organizations.Entities.Account/Update.json', {
        Item: { Password: passwordForm.value.next, Kvid: accountKvid },
      });
      passwordMessage.value = { type: 'success', text: '密码修改成功' };
      passwordForm.value = { next: '', confirm: '' };
    } catch {
      passwordMessage.value = { type: 'error', text: '密码修改失败，请重试' };
    } finally {
      passwordLoading.value = false;
    }
  }

  // ── 别名 ──
  const aliasForm = ref({ displayName: '' });
  const aliasLoading = ref(false);
  const aliasMessage = ref<{ type: 'success' | 'error'; text: string } | null>(null);

  async function saveAlias() {
    const name = aliasForm.value.displayName.trim();
    if (!name) {
      aliasMessage.value = { type: 'error', text: '账号别名不能为空' };
      return;
    }
    const member = (window as any).KiviiContext?.CurrentMember;
    if (!member?.Kvid) {
      aliasMessage.value = { type: 'error', text: '无法获取当前用户信息，请刷新后重试' };
      return;
    }
    aliasLoading.value = true;
    aliasMessage.value = null;
    try {
      await kivii.request.post('/Restful/Kivii.Organizations.Entities.Member/Update.json', {
        Item: { FullName: name, Metadata: {}, Kvid: member.Kvid },
      });
      member.DisplayName = name;
      aliasMessage.value = { type: 'success', text: '账号别名更新成功' };
    } catch {
      aliasMessage.value = { type: 'error', text: '账号别名更新失败，请重试' };
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
                  { key: 'alias', icon: 'fa-id-badge', label: '账号别名' },
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
                        accept="image/*"
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
                    accept="image/*"
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
                <!-- 新密码 -->
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">新密码</label>
                  <div class="relative">
                    <input
                      v-model="passwordForm.next"
                      :type="showNext ? 'text' : 'password'"
                      placeholder="请输入新密码（至少 6 位）"
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

              <!-- 账号别名 -->
              <div v-else-if="activeTab === 'alias'" class="space-y-4">
                <div class="space-y-1">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">账号别名（显示名称）</label>
                  <input
                    v-model="aliasForm.displayName"
                    type="text"
                    placeholder="请输入显示名称"
                    maxlength="32"
                    class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    @keydown.enter="saveAlias"
                  />
                  <p class="text-xs text-gray-400 dark:text-gray-500 text-right">{{ aliasForm.displayName.length }}/32</p>
                </div>

                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p class="flex items-center gap-1.5">
                    <i class="fas fa-info-circle text-blue-400" />
                    别名将显示在顶部导航栏和系统中
                  </p>
                  <p class="flex items-center gap-1.5">
                    <i class="fas fa-info-circle text-blue-400" />
                    支持中英文、数字，最多 32 个字符
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
                  {{ aliasLoading ? '保存中...' : '保存别名' }}
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
