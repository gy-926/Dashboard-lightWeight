import { describe, expect, it } from 'vitest';
import { createUmdRequestUrl } from '@/utils/umd-cache';

describe('UMD request cache version', () => {
  it('appends a cache version to a plain URL', () => {
    expect(createUmdRequestUrl('/Content/widget.umd.js', 'release-2')).toBe(
      '/Content/widget.umd.js?__kivii_umd_v=release-2'
    );
  });

  it('preserves existing query parameters and URL fragments', () => {
    expect(createUmdRequestUrl('/Content/widget.umd.js?tenant=1#entry', 'new build')).toBe(
      '/Content/widget.umd.js?tenant=1&__kivii_umd_v=new%20build#entry'
    );
  });

  it('uses one stable version throughout the current page load', () => {
    const first = createUmdRequestUrl('/Content/widget.umd.js');
    const second = createUmdRequestUrl('/Content/widget.umd.js');

    expect(second).toBe(first);
  });
});
