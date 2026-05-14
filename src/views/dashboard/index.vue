<template>
  <div class="dashboard-page bg-white dark:bg-[#18181c]">
    <EchartsField
      v-model:widgets="dashboardWidgets"
      :editable="true"
      :api-config="{
        type: 'Kivii.Finances.Entities.InvoiceDashBOard',
        internalCode: '发票管理图表(InvoiceDashboard)',
        isDefault: true,
        getUrl: '/Restful/Kivii.Basic.Entities.UiConfig/Get.json',
        setUrl: '/Restful/Kivii.Basic.Entities.UiConfig/Set.json',
      }"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { EchartsField } from 'kivii-public-components';

  const dashboardWidgets = ref([]);
</script>

<style scoped>
  .dashboard-page {
    /* 移除内部的 padding，因为现在我们希望它完全贴合边缘 */
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-top: 10px;
    /* 这里可以让内部元素撑满剩余空间 */
  }

  /* 确保 kivii-dashboard 能占满整个容器 */
  :deep(.kivii-dashboard-container) {
    flex: 1;
  }
</style>
