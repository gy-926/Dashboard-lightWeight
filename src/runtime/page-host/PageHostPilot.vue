<script setup lang="ts">
import { computed } from 'vue';
import { usePageHostPilotStore } from './pilot-store';
import HostedIframe from './HostedIframe.vue';
import HostedRemoteVue from './HostedRemoteVue.vue';
import HostedUmd from './HostedUmd.vue';

const pilotStore = usePageHostPilotStore();
const hostStyle = computed(() => ({
  top: `${pilotStore.bounds.top}px`,
  left: `${pilotStore.bounds.left}px`,
  width: `${pilotStore.bounds.width}px`,
  height: `${pilotStore.bounds.height}px`,
}));
</script>

<template>
  <div
    id="page-host-root"
    class="page-host-root"
    :style="hostStyle"
  >
    <HostedIframe
      v-for="page in pilotStore.allPages.filter(page => page.descriptor.type === 'webview')"
      :key="page.instanceKey"
      :src="page.src"
      :active="page.active"
      :instance-key="page.instanceKey"
      :descriptor="page.descriptor"
    />
    <HostedRemoteVue
      v-for="page in pilotStore.allPages.filter(page => page.descriptor.type === 'vue')"
      :key="page.instanceKey"
      :url="page.src"
      :active="page.active"
      :instance-key="page.instanceKey"
      :kvid="page.descriptor.kvid"
      :descriptor="page.descriptor"
    />
    <HostedUmd
      v-for="page in pilotStore.allPages.filter(page => page.descriptor.type === 'umd')"
      :key="page.instanceKey"
      :component-name="page.src"
      :component-tag="page.componentTag"
      :route-query="page.descriptor.query"
      :active="page.active"
      :instance-key="page.instanceKey"
      :descriptor="page.descriptor"
    />
  </div>
</template>

<style scoped>
.page-host-root {
  position: fixed;
  z-index: 101;
  pointer-events: none;
  overflow: hidden;
}
</style>
