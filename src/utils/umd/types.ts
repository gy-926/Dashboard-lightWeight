export interface RemoteLibraryInfo {
  name: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
  manifest?: any;
  componentsMap?: Record<string, any>;
  componentsDetailed?: any[];
  componentKeys?: string[];
  registeredCount?: number;
}

export interface ComponentConfig {
  name: string;
  type: 'umd' | 'esm';
  version: string;
  path: string;
  /** UMD 组件挂载在 window 上的全局变量名，默认 VueComponent */
  globalName?: string;
  dependencies?: string[];
  /** 是否自动遍历导出对象注册所有组件 */
  autoRegister?: boolean;
  /** 覆盖 UMD bundle 自身 manifest 中的元数据 */
  metadata?: {
    zhName?: string;
    componentsDetailed?: Array<{
      name: string;
      zhName?: string;
      displayName?: string;
      icon?: string;
    }>;
  };
}

export interface Config {
  components: ComponentConfig[];
}
