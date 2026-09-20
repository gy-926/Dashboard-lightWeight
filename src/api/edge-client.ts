import { apiRequest } from './nest-client';

export async function requestEdgeFunction<T>(
  functionName: string,
  path = '',
  init: RequestInit = {},
  accessToken?: string
): Promise<T> {
  return apiRequest<T>(`/${functionName}${path}`, init, accessToken);
}
