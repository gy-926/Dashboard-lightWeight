<script setup lang="ts">
import UmdComponentPage from '@/views/_builtin/umd-component/index.vue';
import type { PageIdentityQuery } from './types';
import type { PageDescriptor } from './types';
import { provideHostedPageLifecycle } from './lifecycle';

const props = defineProps<{
  componentName: string;
  componentTag?: string;
  routeQuery?: PageIdentityQuery;
  active: boolean;
  instanceKey: string;
  descriptor: PageDescriptor;
}>();

provideHostedPageLifecycle(props);
</script>

<template>
  <div
    v-show="active"
    class="page-host-umd-container"
    :data-page-host-instance="instanceKey"
  >
    <UmdComponentPage
      :component-name="componentName"
      :component-tag="componentTag"
      :route-query="routeQuery"
      :hosted="true"
    />
  </div>
</template>

<style scoped>
.page-host-umd-container {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  overflow: hidden;
}
</style>
