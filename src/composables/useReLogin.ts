import { ref } from 'vue';

const visible = ref(false);
let isTriggered = false;

export function triggerReLogin() {
  if (isTriggered) return;
  isTriggered = true;
  visible.value = true;
}

export function useReLogin() {
  return { visible };
}
