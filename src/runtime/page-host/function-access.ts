import type { GlobalConfig } from '@/router/routes/types';
import type { HostedPageType } from './types';

export interface FunctionAccessItem {
  Handler?: unknown;
  Remark?: unknown;
}

export interface FunctionAccessPayload {
  Results?: FunctionAccessItem[];
}

export interface ResolvedFunctionPage {
  type: HostedPageType;
  url: string;
  rawHandler: string;
  componentTag?: string;
  scriptPath?: string;
}

export function resolveFunctionPageType(handler: string): HostedPageType {
  if (handler.endsWith('.vue')) return 'vue';
  if (handler.startsWith('<') && handler.includes('>')) return 'umd';
  return 'webview';
}

export function extractUmdComponentName(tag: string): string {
  const match = tag.match(/<([a-zA-Z0-9-]+)[^>]*>/);
  return match ? match[1] : tag;
}

function getBackendOrigin(config: GlobalConfig, windowOrigin: string): string {
  if (config.Origin) return config.Origin;
  return config.UseWindowOrigin ? windowOrigin : '';
}

/** 将外部功能访问响应收口为 PageHost 与旧动态页共用的规范化结果。 */
export function resolveFunctionAccessPayload(
  payload: FunctionAccessPayload | null | undefined,
  config: GlobalConfig,
  windowOrigin = ''
): ResolvedFunctionPage | null {
  const item = payload?.Results?.[0];
  const handler = typeof item?.Handler === 'string' ? item.Handler.trim() : '';
  if (!handler) return null;

  const type = resolveFunctionPageType(handler);
  if (type === 'umd') {
    return {
      type,
      url: extractUmdComponentName(handler),
      rawHandler: handler,
      componentTag: handler,
      scriptPath: typeof item?.Remark === 'string' && item.Remark.trim()
        ? item.Remark.trim()
        : undefined,
    };
  }

  const origin = getBackendOrigin(config, windowOrigin);
  return {
    type,
    url: /^https?:\/\//i.test(handler) ? handler : `${origin}${handler}`,
    rawHandler: handler,
  };
}
