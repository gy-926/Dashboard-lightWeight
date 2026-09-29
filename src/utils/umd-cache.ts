const umdPageLoadVersion = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/**
 * 为 UMD 请求追加页面级缓存版本。
 *
 * 同一次页面运行复用相同版本，确保并发加载仍能去重；刷新页面后版本变化，
 * 即使 UMD 文件名没有改变，浏览器也会请求最新资源。
 */
export function createUmdRequestUrl(
  url: string,
  version: string = umdPageLoadVersion
): string {
  const hashIndex = url.indexOf('#');
  const resourceUrl = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const separator = resourceUrl.includes('?') ? '&' : '?';

  return `${resourceUrl}${separator}__kivii_umd_v=${encodeURIComponent(version)}${hash}`;
}
