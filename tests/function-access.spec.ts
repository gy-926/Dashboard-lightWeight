import { describe, expect, it } from 'vitest';
import {
  extractUmdComponentName,
  resolveFunctionAccessPayload,
  resolveFunctionPageType,
} from '@/runtime/page-host/function-access';
import type { GlobalConfig } from '@/router/routes/types';

const config: GlobalConfig = {
  InternalCode: 'dashboard',
  Origin: 'https://backend.test',
  UseWindowOrigin: true,
};

describe('function access normalization', () => {
  it.each([
    ['/remote/form.vue', 'vue'],
    ['<SmartForm :readonly="false">', 'umd'],
    ['/legacy/form', 'webview'],
  ] as const)('classifies %s as %s', (handler, expected) => {
    expect(resolveFunctionPageType(handler)).toBe(expected);
  });

  it('resolves relative webview and Vue handlers against the configured backend', () => {
    expect(
      resolveFunctionAccessPayload({ Results: [{ Handler: '/legacy/form' }] }, config)
    ).toMatchObject({ type: 'webview', url: 'https://backend.test/legacy/form' });

    expect(
      resolveFunctionAccessPayload({ Results: [{ Handler: '/remote/form.vue' }] }, config)
    ).toMatchObject({ type: 'vue', url: 'https://backend.test/remote/form.vue' });
  });

  it('keeps absolute HTTP URLs unchanged regardless of protocol casing', () => {
    expect(
      resolveFunctionAccessPayload(
        { Results: [{ Handler: 'HTTPS://example.test/form' }] },
        config
      )?.url
    ).toBe('HTTPS://example.test/form');
  });

  it('falls back to the supplied window origin only when enabled', () => {
    expect(
      resolveFunctionAccessPayload(
        { Results: [{ Handler: '/legacy/form' }] },
        { ...config, Origin: '', UseWindowOrigin: true },
        'https://window.test'
      )?.url
    ).toBe('https://window.test/legacy/form');

    expect(
      resolveFunctionAccessPayload(
        { Results: [{ Handler: '/legacy/form' }] },
        { ...config, Origin: '', UseWindowOrigin: false },
        'https://window.test'
      )?.url
    ).toBe('/legacy/form');
  });

  it('normalizes UMD component tags and script paths', () => {
    expect(extractUmdComponentName('<SmartForm :readonly="false">')).toBe('SmartForm');
    expect(
      resolveFunctionAccessPayload(
        {
          Results: [{
            Handler: '<SmartForm :readonly="false">',
            Remark: ' /plugins/smart-form.umd.js ',
          }],
        },
        config
      )
    ).toEqual({
      type: 'umd',
      url: 'SmartForm',
      rawHandler: '<SmartForm :readonly="false">',
      componentTag: '<SmartForm :readonly="false">',
      scriptPath: '/plugins/smart-form.umd.js',
    });
  });

  it('returns null for empty or malformed results', () => {
    expect(resolveFunctionAccessPayload(undefined, config)).toBeNull();
    expect(resolveFunctionAccessPayload({ Results: [{ Handler: 42 }] }, config)).toBeNull();
  });
});
