import { requestEdgeFunction } from './edge-client';

export type DashboardFunctionRenderType = 'webview' | 'vue' | 'umd';
export type DashboardFunctionSourceType = 'manual' | 'umd' | 'system';

export interface DashboardFunctionRecord {
  kvid: string;
  title: string | null;
  handler: string;
  remark: string | null;
  parameters: Record<string, any> | null;
  render_type: DashboardFunctionRenderType;
  source_type: DashboardFunctionSourceType;
  source_module: string | null;
  source_url: string | null;
  source_component: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

interface ImportResult {
  inserted: number;
  skipped: number;
}

export interface UmdVersionRecord {
  id: string;
  module_key: string;
  name: string;
  version: string;
  file_id: string;
  original_name: string;
  size: number;
  sha256: string;
  manifest: Record<string, any>;
  is_current: boolean;
  created_by: string;
  created_at: string;
  sourceUrl: string;
}

export interface UmdImportResult {
  moduleKey: string;
  name: string;
  version: string;
  versionId: string;
  sourceUrl: string;
  imported: number;
}

const request = <T>(path = '', init: RequestInit = {}) =>
  requestEdgeFunction<T>('dashboard-functions', path, init);

export function listDashboardFunctions(): Promise<DashboardFunctionRecord[]> {
  return request<DashboardFunctionRecord[]>();
}

export function saveDashboardFunction(
  item: DashboardFunctionRecord
): Promise<DashboardFunctionRecord> {
  return request<DashboardFunctionRecord>('', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function updateDashboardFunction(
  kvid: string,
  changes: Partial<DashboardFunctionRecord>
): Promise<DashboardFunctionRecord> {
  return request<DashboardFunctionRecord>(`/${encodeURIComponent(kvid)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export async function deleteDashboardFunction(kvid: string): Promise<void> {
  await request<null>(`/${encodeURIComponent(kvid)}`, { method: 'DELETE' });
}

export function importDashboardFunctions(
  items: DashboardFunctionRecord[]
): Promise<ImportResult> {
  return request<ImportResult>('/import', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function importUmdPackage(input: {
  file: File;
  manifest: Record<string, any>;
  components: Array<Record<string, any> | string>;
  moduleKey: string;
  name: string;
  version: string;
}): Promise<UmdImportResult> {
  const body = new FormData();
  body.append('file', input.file, input.file.name);
  body.append('manifest', JSON.stringify(input.manifest));
  body.append('components', JSON.stringify(input.components));
  body.append('moduleKey', input.moduleKey);
  body.append('name', input.name);
  body.append('version', input.version);
  return request<UmdImportResult>('/import-umd', { method: 'POST', body });
}

export function listUmdVersions(moduleKey = ''): Promise<UmdVersionRecord[]> {
  const query = moduleKey ? `?moduleKey=${encodeURIComponent(moduleKey)}` : '';
  return request<UmdVersionRecord[]>(`/umd-versions${query}`);
}

export function activateUmdVersion(versionId: string): Promise<{ versionId: string; moduleKey: string; version: string; sourceUrl: string }> {
  return request(`/umd-versions/${encodeURIComponent(versionId)}/activate`, { method: 'PUT' });
}
