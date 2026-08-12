<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { provideHostedPageLifecycle } from './lifecycle';
import type { PageDescriptor, PageDestroyReason, PageHostContext } from './types';

const props = defineProps<{
  src: string;
  active: boolean;
  instanceKey: string;
  descriptor: PageDescriptor;
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const lifecycle = provideHostedPageLifecycle(props);
const iframeLoaded = ref(false);
let lastSentEvent: string | null = null;

function notifyIframe(
  event: 'activate' | 'deactivate' | 'destroy',
  context: PageHostContext,
  reason?: PageDestroyReason
): void {
  if (!iframeLoaded.value && event !== 'destroy') return;
  const eventKey = `${event}:${reason || ''}`;
  if (lastSentEvent === eventKey) return;
  iframeRef.value?.contentWindow?.postMessage(
    {
      type: 'kivii:page-host-lifecycle',
      event,
      reason,
      instanceKey: context.instanceKey,
      descriptor: {
        ...context.descriptor,
        query: context.descriptor.query ? { ...context.descriptor.query } : undefined,
      },
    },
    new URL(props.src, window.location.href).origin
  );
  lastSentEvent = eventKey;
}

function handleLoad(): void {
  iframeLoaded.value = true;
  notifyIframe(lifecycle.active.value ? 'activate' : 'deactivate', lifecycle);
}

lifecycle.onActivate(context => notifyIframe('activate', context));
lifecycle.onDeactivate(context => notifyIframe('deactivate', context));
lifecycle.onDestroy((reason, context) => notifyIframe('destroy', context, reason));

onBeforeUnmount(() => {
  if (iframeRef.value) iframeRef.value.src = 'about:blank';
});
</script>

<template>
  <div
    v-show="active"
    class="page-host-iframe-container"
    :data-page-host-instance="instanceKey"
  >
    <iframe
      ref="iframeRef"
      :src="src"
      class="page-host-iframe"
      @load="handleLoad"
    />
  </div>
</template>

<style scoped>
.page-host-iframe-container,
.page-host-iframe {
  width: 100%;
  height: 100%;
}

.page-host-iframe-container {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  overflow: hidden;
}

.page-host-iframe {
  display: block;
  border: 0;
  background: #fff;
}
</style>
