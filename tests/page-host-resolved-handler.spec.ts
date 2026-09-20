import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const { requestGet } = vi.hoisted(() => ({
  requestGet: vi.fn(),
}));

vi.mock('@/router/routes', () => ({
  getGlobalConfig: () => ({
    InternalCode: 'dashboard',
    UseWindowOrigin: true,
    Parameters: {},
  }),
}));

vi.mock('@kivii.com/bridge', () => ({
  kivii: {
    request: { get: requestGet },
  },
}));

import { usePageHostPilotStore } from '@/runtime/page-host/pilot-store';

describe('PageHost pre-resolved menu Handler', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    requestGet.mockReset();
    vi.stubGlobal('window', { location: { origin: 'https://dashboard.test' } });
  });

  it('hosts a Supabase menu Handler without requesting the legacy Access endpoint', async () => {
    const store = usePageHostPilotStore();

    await expect(store.resolveRoute({
      path: '/root/form',
      name: 'root_form',
      kvid: 'form-kvid',
      handler: '/forms/edit',
      handlerResolved: true,
    })).resolves.toBe(true);

    expect(requestGet).not.toHaveBeenCalled();
    expect(store.allPages).toHaveLength(1);
    expect(store.allPages[0]).toMatchObject({
      src: 'https://dashboard.test/forms/edit',
      descriptor: { type: 'webview' },
    });
  });

  it('does not request the legacy endpoint when the resolved Handler is empty', async () => {
    const store = usePageHostPilotStore();

    await expect(store.resolveRoute({
      path: '/root/empty',
      name: 'root_empty',
      kvid: 'empty-kvid',
      handler: '',
      handlerResolved: true,
    })).resolves.toBe(false);

    expect(requestGet).not.toHaveBeenCalled();
    expect(store.allPages).toHaveLength(0);
  });

  it('passes the local script URL when a resolved menu opens a UMD function', async () => {
    const store = usePageHostPilotStore();
    const registration = vi.fn().mockResolvedValue(true);
    store.setUmdRegistrationBridge(registration);

    await expect(store.resolveRoute({
      path: '/root/widget',
      name: 'root_widget',
      kvid: 'widget-kvid',
      handler: '<LocalWidget />',
      handlerResolved: true,
      scriptPath: '/api/dashboard-assets/version-id/widget.umd.js',
    })).resolves.toBe(true);

    expect(requestGet).not.toHaveBeenCalled();
    expect(registration).toHaveBeenCalledWith(
      'LocalWidget',
      '/api/dashboard-assets/version-id/widget.umd.js'
    );
    expect(store.allPages[0]).toMatchObject({
      descriptor: { type: 'umd' },
      scriptPath: '/api/dashboard-assets/version-id/widget.umd.js',
    });
  });

  it('keeps the legacy Access endpoint fallback when no resolved marker exists', async () => {
    requestGet.mockResolvedValue({
      data: { Results: [{ Handler: '/legacy/form' }] },
    });
    const store = usePageHostPilotStore();

    await expect(store.resolveRoute({
      path: '/root/legacy',
      name: 'root_legacy',
      kvid: 'legacy-kvid',
    })).resolves.toBe(true);

    expect(requestGet).toHaveBeenCalledWith(
      '/Restful/Kivii.Basic.Entities.Function/Access.json?MenuKvids=legacy-kvid'
    );
  });
});
