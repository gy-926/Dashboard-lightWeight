import { ref } from 'vue';

const visible = ref(false);
let isTriggered = false;

export function triggerReLogin() {
  if (isTriggered) return;
  isTriggered = true;
  visible.value = true;
}

export function closeReLogin() {
  visible.value = false;
  isTriggered = false;
}

export function useReLogin() {
  return { visible, closeReLogin };
}
