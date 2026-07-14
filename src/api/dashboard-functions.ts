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
