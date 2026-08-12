import type { HostedPageType, PageDestroyReason } from './types';
import type { PageHostPilotConfig, PageHostPilotSkipReason } from './pilot-config';

export type PageHostDiagnosticEventName =
  | 'resolve-start'
  | 'skipped'
  | 'hosted'
  | 'fallback'
  | 'cancelled'
  | 'destroy';

export type PageHostFallbackReason =
  | 'empty-handler'
  | 'umd-not-registered'
  | 'request-error';

export interface PageHostDiagnosticEvent {
  sequence: number;
  timestamp: number;
  event: PageHostDiagnosticEventName;
  path: string;
  kvid?: string;
  pageType?: HostedPageType;
  durationMs?: number;
  cacheHit?: boolean;
  fallbackReason?: PageHostFallbackReason;
  skipReason?: PageHostPilotSkipReason;
  destroyReason?: PageDestroyReason;
}

export interface PageHostDiagnosticInput extends Omit<PageHostDiagnosticEvent, 'sequence' | 'timestamp'> {
  timestamp?: number;
}

export interface PageHostDiagnosticSummary {
  retainedEvents: number;
  resolving: number;
  skipped: number;
  hosted: number;
  fallback: number;
  cancelled: number;
  destroy: number;
}

export interface PageHostDiagnostics {
  record(input: PageHostDiagnosticInput): PageHostDiagnosticEvent;
  snapshot(): PageHostDiagnosticEvent[];
  summary(): PageHostDiagnosticSummary;
  clear(): void;
}

export function createPageHostDiagnostics(limit = 100): PageHostDiagnostics {
  const capacity = Math.max(1, Math.floor(limit));
  const events: PageHostDiagnosticEvent[] = [];
  let nextSequence = 1;

  return {
    record(input) {
      const event: PageHostDiagnosticEvent = Object.freeze({
        ...input,
        sequence: nextSequence++,
        timestamp: input.timestamp ?? Date.now(),
      });
      events.push(event);
      if (events.length > capacity) events.splice(0, events.length - capacity);
      return event;
    },
    snapshot() {
      return events.map(event => ({ ...event }));
    },
    summary() {
      const summary: PageHostDiagnosticSummary = {
        retainedEvents: events.length,
        resolving: 0,
        skipped: 0,
        hosted: 0,
        fallback: 0,
        cancelled: 0,
        destroy: 0,
      };
      events.forEach(event => {
        if (event.event === 'resolve-start') summary.resolving++;
        else summary[event.event]++;
      });
      return summary;
    },
    clear() {
      events.length = 0;
    },
  };
}

export const pageHostDiagnostics = createPageHostDiagnostics();

export interface PageHostDiagnosticsBrowserApi {
  snapshot(): PageHostDiagnosticEvent[];
  summary(): PageHostDiagnosticSummary;
  configuration(): PageHostPilotConfig;
}

/** 安装只读浏览器诊断入口；不暴露 clear、Store 或页面实例。 */
export function installPageHostDiagnosticsBrowserApi(
  target: Window,
  getConfiguration: () => PageHostPilotConfig
): void {
  const api: PageHostDiagnosticsBrowserApi = Object.freeze({
    snapshot: () => pageHostDiagnostics.snapshot(),
    summary: () => pageHostDiagnostics.summary(),
    configuration: () => {
      const config = getConfiguration();
      return { enabled: config.enabled, excludedKvids: [...config.excludedKvids] };
    },
  });
  Object.defineProperty(target, '__KIVII_PAGE_HOST_DIAGNOSTICS__', {
    configurable: true,
    enumerable: false,
    value: api,
    writable: false,
  });
}
