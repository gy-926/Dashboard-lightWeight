import { ref } from 'vue';

export const menuRootKvid = ref<string | null>(null);
/** 仅保存后端自动启动配置，目前尚未接入首页渲染。 */
export const autoStartupKvid = ref<string | null | undefined>(undefined);
