import { describe, expect, it } from 'vitest';
import {
  createPageInstanceKey,
  normalizePageIdentityQuery,
} from '@/runtime/page-host/identity';
import type { PageDescriptor } from '@/runtime/page-host/types';

const basePage: PageDescriptor = {
  tabKey: 'root-kvid_page-kvid',
  path: '/root-kvid/page-kvid',
  type: 'vue',
  url: '/remote/form.vue',
  kvid: 'page-kvid',
};

describe('PageHost stable page identity', () => {
  it('returns the same key for the same page across repeated calls', () => {
    expect(createPageInstanceKey(basePage)).toBe(createPageInstanceKey({ ...basePage }));
  });

  it('does not depend on query property insertion order', () => {
    const first = createPageInstanceKey({
      ...basePage,
      query: { customer: '42', mode: 'edit' },
    });
    const second = createPageInstanceKey({
      ...basePage,
      query: { mode: 'edit', customer: '42' },
    });

    expect(first).toBe(second);
  });

  it('separates instances when identity-affecting query values differ', () => {
    const first = createPageInstanceKey({ ...basePage, query: { order: '1001' } });
    const second = createPageInstanceKey({ ...basePage, query: { order: '1002' } });

    expect(first).not.toBe(second);
  });

  it('separates different KVID tabs even when they share the same remote URL', () => {
    const first = createPageInstanceKey(basePage);
    const second = createPageInstanceKey({
      ...basePage,
      tabKey: 'root-kvid_other-kvid',
      path: '/root-kvid/other-kvid',
      kvid: 'other-kvid',
    });

    expect(first).not.toBe(second);
  });

  it('normalizes undefined and null without mutating array values', () => {
    const values = ['first', 'second'];
    const normalized = normalizePageIdentityQuery({ empty: undefined, explicit: null, values });

    expect(normalized).toEqual({ empty: null, explicit: null, values });
    expect(normalized.values).not.toBe(values);
  });
});
