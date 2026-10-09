<script setup lang="ts">
  import { computed } from 'vue';
  import { useRouter } from 'vue-router';
  import { useMenuStore } from '@/layouts/modules/global-menu/store';
  import { getGlobalConfig } from '@/router/routes';
  import { normalizeBrandText } from '@/utils/brand';
  import HomeHero from './home/components/HomeHero.vue';
  import HomeMetrics from './home/components/HomeMetrics.vue';
  import HomeModuleFlow from './home/components/HomeModuleFlow.vue';
  import HomeAdapters from './home/components/HomeAdapters.vue';
  import HomeArchitecture from './home/components/HomeArchitecture.vue';
  import HomeWorkspacePreview from './home/components/HomeWorkspacePreview.vue';
  import HomePlatformProofs from './home/components/HomePlatformProofs.vue';
  import HomeCallToAction from './home/components/HomeCallToAction.vue';
  defineOptions({ name: 'home' });
  const router = useRouter();
  const menuStore = useMenuStore();
  const isDark = computed(() => menuStore.theme.darkMode);
  const systemName = computed(() =>
    normalizeBrandText(getGlobalConfig().DisplayName, 'GavinYinHub Runtime')
  );
  const goTo = (path: string) => router.push(path);
</script>

<template>
  <div
    class="showcase-page space-y-5 pb-3 md:space-y-7"
    :class="{ 'home-dark': isDark }"
  >
    <HomeHero
      :system-name="systemName"
      @navigate="goTo"
    />
    <HomeMetrics />
    <HomeModuleFlow />
    <HomeAdapters />
    <HomeArchitecture @navigate="goTo" />
    <HomeWorkspacePreview @navigate="goTo" />
    <HomePlatformProofs />
    <HomeCallToAction @navigate="goTo" />
  </div>
</template>

<style src="./home/common.css"></style>
