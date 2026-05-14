import { ref } from 'vue';
import type { RemoteLibraryInfo } from './types';

export const remoteLibraries = ref<RemoteLibraryInfo[]>([]);

let _resolveUmdReady: () => void = () => {};

export const umdComponentsReady: Promise<void> = new Promise(resolve => {
  _resolveUmdReady = resolve;
});

export function resolveUmdReady() {
  _resolveUmdReady();
}
