import { normalizeBrandText } from '@/utils/brand';
export function brandText(value: unknown, fallback = '-') {
  return normalizeBrandText(typeof value === 'string' ? value : '', fallback);
}
export function formatSize(size: number) {
  return size < 1024 * 1024
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / 1024 / 1024).toFixed(1)} MB`;
}
