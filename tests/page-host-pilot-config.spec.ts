import { describe, expect, it } from 'vitest';
import {
  getPageHostPilotConfig,
  getPageHostPilotDecision,
  shouldPilotPageHostKvid,
} from '@/runtime/page-host/pilot-config';
import type { GlobalConfig } from '@/router/routes/types';

const baseConfig: GlobalConfig = {
  InternalCode: 'dashboard',
  IsAuthenticated: true,
};

describe('PageHost runtime configuration', () => {
  it('hosts runtime KVIDs by default without requiring deployment configuration', () => {
    expect(getPageHostPilotConfig(baseConfig)).toEqual({
      enabled: true,
      excludedKvids: [],
    });
    expect(shouldPilotPageHostKvid(baseConfig, 'any-kvid')).toBe(true);
    expect(getPageHostPilotDecision(baseConfig)).toEqual({
      eligible: false,
      reason: 'missing-kvid',
    });
  });

  it('can be explicitly disabled to restore the legacy route chain', () => {
    const config: GlobalConfig = {
      ...baseConfig,
      Parameters: { PageHostEnabled: false },
    };

    expect(getPageHostPilotConfig(config).enabled).toBe(false);
    expect(getPageHostPilotDecision(config, 'runtime-kvid')).toEqual({
      eligible: false,
      reason: 'disabled',
    });
  });

  it('hosts every runtime KVID when enabled without an exclusion list', () => {
    const config: GlobalConfig = {
      ...baseConfig,
      Parameters: { PageHostPilotEnabled: true },
    };

    expect(getPageHostPilotConfig(config)).toEqual({
      enabled: true,
      excludedKvids: [],
    });
    expect(shouldPilotPageHostKvid(config, 'first-runtime-kvid')).toBe(true);
    expect(shouldPilotPageHostKvid(config, 'another-runtime-kvid')).toBe(true);
  });

  it('still skips routes that have no KVID', () => {
    const config: GlobalConfig = {
      ...baseConfig,
      Parameters: { PageHostPilotEnabled: true },
    };

    expect(getPageHostPilotDecision(config)).toEqual({
      eligible: false,
      reason: 'missing-kvid',
    });
  });

  it('supports an optional exact-match exclusion list', () => {
    const config: GlobalConfig = {
      ...baseConfig,
      Parameters: {
        PageHostPilotEnabled: true,
        PageHostExcludedKvids: [' excluded-kvid ', 'second-kvid', '', 'excluded-kvid'],
      },
    };

    expect(getPageHostPilotConfig(config)).toEqual({
      enabled: true,
      excludedKvids: ['excluded-kvid', 'second-kvid'],
    });
    expect(getPageHostPilotDecision(config, 'excluded-kvid')).toEqual({
      eligible: false,
      reason: 'excluded-kvid',
    });
    expect(shouldPilotPageHostKvid(config, 'EXCLUDED-KVID')).toBe(true);
    expect(shouldPilotPageHostKvid(config, 'other-kvid')).toBe(true);
  });

  it('ignores malformed exclusion lists instead of blocking runtime KVIDs', () => {
    const config: GlobalConfig = {
      ...baseConfig,
      Parameters: {
        PageHostPilotEnabled: true,
        PageHostExcludedKvids: 'excluded-kvid',
      },
    };

    expect(getPageHostPilotConfig(config).excludedKvids).toEqual([]);
    expect(shouldPilotPageHostKvid(config, 'excluded-kvid')).toBe(true);
  });

  it('supports JSON string parameters and only treats boolean false as disabled', () => {
    expect(
      shouldPilotPageHostKvid(
        {
          ...baseConfig,
          Parameters: JSON.stringify({
            pageHostPilotEnabled: true,
            pageHostExcludedKvids: ['excluded-kvid'],
          }),
        },
        'runtime-kvid'
      )
    ).toBe(true);

    expect(
      getPageHostPilotDecision(
        {
          ...baseConfig,
          Parameters: JSON.stringify({
            pageHostPilotEnabled: true,
            pageHostExcludedKvids: ['excluded-kvid'],
          }),
        },
        'excluded-kvid'
      )
    ).toEqual({ eligible: false, reason: 'excluded-kvid' });

    expect(
      shouldPilotPageHostKvid(
        {
          ...baseConfig,
          Parameters: { PageHostPilotEnabled: 'true' },
        },
        'runtime-kvid'
      )
    ).toBe(true);

    expect(
      shouldPilotPageHostKvid(
        {
          ...baseConfig,
          Parameters: { PageHostPilotEnabled: false },
        },
        'runtime-kvid'
      )
    ).toBe(false);
  });
});
