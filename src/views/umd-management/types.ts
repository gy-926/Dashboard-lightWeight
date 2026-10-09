export interface AnalyzedLibrary {
  name: string;
  url: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  error?: string;
  manifest?: any;
  componentsMap?: Record<string, any>;
  componentsDetailed?: any[];
  componentKeys?: string[];
  registeredCount?: number;
  rawFile?: File; // 用于保存原始文件以便上传
  isUploading?: boolean; // 上传状态
  versionOverride?: string;
}
