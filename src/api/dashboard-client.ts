import { apiRequest } from './nest-client';

export function requestDashboardModule<T>(
  moduleName: 'dashboard-functions' | 'dashboard-admin',
  path = '',
  init: RequestInit = {},
  accessToken?: string
): Promise<T> {
  return apiRequest<T>(`/${moduleName}${path}`, init, accessToken);
}
