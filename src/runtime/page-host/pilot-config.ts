import type { GlobalConfig } from '@/router/routes/types';

export interface PageHostPilotConfig {
  enabled: boolean;
  excludedKvids: string[];
}

export type PageHostPilotSkipReason =
  | 'disabled'
  | 'missing-kvid'
  | 'excluded-kvid';

export type PageHostPilotDecision =
  | { eligible: true }
  | { eligible: false; reason: PageHostPilotSkipReason };

function normalizeParameters(parameters: GlobalConfig['Parameters']): Record<string, unknown> {
  if (!parameters) return {};
  if (typeof parameters === 'object') return parameters;

  try {
    const parsed = JSON.parse(parameters);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function getPageHostPilotConfig(config: GlobalConfig): PageHostPilotConfig {
  const parameters = normalizeParameters(config.Parameters);
  const configuredEnabled =
    parameters.PageHostEnabled ??
    parameters.pageHostEnabled ??
    parameters.PageHostPilotEnabled ??
    parameters.pageHostPilotEnabled;
  // PageHost 已进入正式运行模式：默认接管运行时 KVID 页面，只有明确 false 才关闭。
  const enabled = configuredEnabled !== false;
  const rawExcludedKvids =
    parameters.PageHostExcludedKvids ?? parameters.pageHostExcludedKvids;
  const excludedKvids = Array.from(new Set(
    (Array.isArray(rawExcludedKvids) ? rawExcludedKvids : [])
      .filter((value): value is string => typeof value === 'string')
      .map(value => value.trim())
      .filter(Boolean)
  ));
  return {
    enabled,
    excludedKvids,
  };
}

export function shouldPilotPageHostKvid(config: GlobalConfig, kvid?: string): boolean {
  return getPageHostPilotDecision(config, kvid).eligible;
}

export function getPageHostPilotDecision(
  config: GlobalConfig,
  kvid?: string
): PageHostPilotDecision {
  const pilot = getPageHostPilotConfig(config);
  if (!pilot.enabled) return { eligible: false, reason: 'disabled' };
  if (typeof kvid !== 'string' || !kvid) {
    return { eligible: false, reason: 'missing-kvid' };
  }
  if (pilot.excludedKvids.includes(kvid)) {
    return { eligible: false, reason: 'excluded-kvid' };
  }
  return { eligible: true };
}
