import { apiRequest, updateCurrentUserProfile, type ApiUser } from './nest-client';

export async function updateMyName(name: string): Promise<ApiUser> {
  const user = await apiRequest<ApiUser>('/users/me', { method: 'PATCH', body: JSON.stringify({ name }) });
  updateCurrentUserProfile(user);
  return user;
}

export async function updateMyAvatar(file: File): Promise<ApiUser> {
  const body = new FormData();
  body.append('file', file, file.name);
  const user = await apiRequest<ApiUser>('/users/me/avatar', { method: 'POST', body });
  updateCurrentUserProfile(user);
  return user;
}
