import { ref } from 'vue';
import type { RemoteLibraryInfo } from './types';

export const remoteLibraries = ref<RemoteLibraryInfo[]>([]);

// app._context.components 不是响应式对象，页面需要显式信号才能感知异步注册完成。
export const umdLoadingCount = ref(0);
export const umdRegistryVersion = ref(0);

export function notifyUmdRegistryChanged() {
  umdRegistryVersion.value++;
}

let _resolveUmdReady: () => void = () => {};

export const umdComponentsReady: Promise<void> = new Promise(resolve => {
  _resolveUmdReady = resolve;
});

export function resolveUmdReady() {
  _resolveUmdReady();
}
