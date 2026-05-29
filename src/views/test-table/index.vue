<template>
  <div class="test-table-page bg-gray-50 dark:bg-gray-900">
    <TableIndex :uiConfig="config" />
  </div>
</template>

<script setup lang="ts">
  import { TableIndex } from 'kivii-public-components';

  const config = {
    Type: 'Kivii.Finances.Entities.Account',
    InternalCode: '业财一体化账户管理(tableFields)',
    IsDefault: true,
    InitQuery: '/Restful/Kivii.Finances.Entities.Account/Query.json',
    InitDelete: '/Restful/Kivii.Finances.Entities.Account/Delete.json',
    GetUrl: '/Restful/Kivii.Basic.Entities.UiConfig/Get.json',
    SetUrl: '/Restful/Kivii.Basic.Entities.UiConfig/Set.json',
    CreateVueUrl: '/codet/dialogForm.vue',
  };
</script>

<style scoped>
  .test-table-page {
    padding: 16px;
    height: 100%;
    width: 100%;
    box-sizing: border-box;
  }
</style>
