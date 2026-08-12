<script setup lang="ts">
import VueComponent from '@/views/_builtin/iframe-page/vueComponent.vue';
import { provideHostedPageLifecycle } from './lifecycle';
import type { PageDescriptor } from './types';

const props = defineProps<{
  url: string;
  active: boolean;
  instanceKey: string;
  kvid?: string;
  descriptor: PageDescriptor;
}>();

provideHostedPageLifecycle(props);
</script>

<template>
  <div
    v-show="active"
    class="page-host-vue-container"
    :data-page-host-instance="instanceKey"
  >
    <VueComponent
      :url="url"
      :page-id="instanceKey"
      :kvid="kvid"
      :hosted="true"
      :active="active"
      :teleport="false"
    />
  </div>
</template>

<style scoped>
.page-host-vue-container {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  overflow: hidden;
}
</style>
