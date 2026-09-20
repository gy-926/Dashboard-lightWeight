import { apiFetch, apiRequest } from './nest-client';

export interface StoredFileRecord {
  id: string;
  ownerUserId: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  createdAt: string;
  downloadUrl: string;
}

export function listFiles(): Promise<StoredFileRecord[]> {
  return apiRequest<StoredFileRecord[]>('/files');
}

export function uploadFile(file: File): Promise<StoredFileRecord> {
  const body = new FormData();
  body.append('file', file, file.name);
  return apiRequest<StoredFileRecord>('/files', { method: 'POST', body });
}

export async function deleteFile(id: string): Promise<void> {
  await apiRequest<null>(`/files/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function downloadFile(file: StoredFileRecord): Promise<void> {
  const response = await apiFetch(`/files/${encodeURIComponent(file.id)}/download`);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `下载失败（HTTP ${response.status}）`);
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = file.originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
