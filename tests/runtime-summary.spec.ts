import { describe, expect, it } from 'vitest';
import { summarizeRuntime } from '../src/views/home/runtime-summary';

describe('runtime summary', () => {
  it('does not report progress or readiness for an empty runtime', () => {
    expect(summarizeRuntime([])).toMatchObject({
      statusLabel: '未加载',
      progressPercent: 0,
      registeredComponentCount: 0,
    });
  });
  it('reports loading and failure independently from successful registrations', () => {
    const success = { name: 'one', url: '/one', status: 'success' as const, registeredCount: 2 };
    const error = { name: 'two', url: '/two', status: 'error' as const };
    expect(summarizeRuntime([success, error])).toMatchObject({
      statusLabel: '加载失败',
      progressPercent: 50,
      registeredComponentCount: 2,
    });
    expect(summarizeRuntime([{ ...error, status: 'loading' }])).toMatchObject({
      statusLabel: '加载中',
      progressPercent: 0,
    });
    expect(summarizeRuntime([success])).toMatchObject({
      statusLabel: '就绪',
      progressPercent: 100,
    });
  });
});
