import { useRouter } from 'vue-router';
import { useMenuStore } from '@/layouts/modules/global-menu/store';
import { createOpenTabService } from '@/services/open-tab';

export type { OpenTabOptions } from '@/services/open-tab';

/** Vue 页面入口，与 Bridge 共用 OpenTab 服务，不再重复导航或回退执行。 */
export function useKiviiOpenTab() {
  return createOpenTabService(useRouter(), useMenuStore());
}
