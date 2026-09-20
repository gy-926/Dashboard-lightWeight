import { ref } from 'vue';

const visible = ref(false);
let isTriggered = false;

export function triggerReLogin() {
  if (isTriggered) return;
  isTriggered = true;
  visible.value = true;
}

export function clearReLogin() {
  isTriggered = false;
  visible.value = false;
}

export function useReLogin() {
  return { visible };
}
