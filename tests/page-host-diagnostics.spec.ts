import { describe, expect, it } from 'vitest';
import { createPageHostDiagnostics } from '@/runtime/page-host/diagnostics';

describe('PageHost diagnostics', () => {
  it('retains only the newest bounded event history', () => {
    const diagnostics = createPageHostDiagnostics(2);
    diagnostics.record({ event: 'resolve-start', path: '/one', kvid: 'one', timestamp: 10 });
    diagnostics.record({ event: 'hosted', path: '/one', pageType: 'webview', timestamp: 20 });
    diagnostics.record({ event: 'destroy', path: '/one', destroyReason: 'close', timestamp: 30 });

    expect(diagnostics.snapshot()).toMatchObject([
      { sequence: 2, event: 'hosted', timestamp: 20 },
      { sequence: 3, event: 'destroy', timestamp: 30 },
    ]);
  });

  it('returns defensive copies instead of exposing internal history', () => {
    const diagnostics = createPageHostDiagnostics();
    diagnostics.record({ event: 'hosted', path: '/form', kvid: 'form-kvid' });
    const firstSnapshot = diagnostics.snapshot();
    firstSnapshot[0].path = '/changed';
    firstSnapshot.push({ ...firstSnapshot[0], sequence: 99 });

    expect(diagnostics.snapshot()).toHaveLength(1);
    expect(diagnostics.snapshot()[0].path).toBe('/form');
  });

  it('summarizes rollout outcomes without retaining page content or query values', () => {
    const diagnostics = createPageHostDiagnostics();
    diagnostics.record({ event: 'resolve-start', path: '/form', kvid: 'form-kvid' });
    diagnostics.record({
      event: 'hosted',
      path: '/form',
      kvid: 'form-kvid',
      pageType: 'vue',
      durationMs: 42,
      cacheHit: false,
    });
    diagnostics.record({
      event: 'fallback',
      path: '/other',
      fallbackReason: 'request-error',
    });

    expect(diagnostics.summary()).toEqual({
      retainedEvents: 3,
      resolving: 1,
      skipped: 0,
      hosted: 1,
      fallback: 1,
      cancelled: 0,
      destroy: 0,
    });
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('query');
    expect(JSON.stringify(diagnostics.snapshot())).not.toContain('url');
  });

  it('clears an isolated diagnostic registry', () => {
    const diagnostics = createPageHostDiagnostics();
    diagnostics.record({ event: 'cancelled', path: '/form' });

    diagnostics.clear();

    expect(diagnostics.snapshot()).toEqual([]);
  });
});
