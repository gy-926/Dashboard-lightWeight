import { afterEach, describe, expect, it, vi } from 'vitest';
const { getRuntimeMenu, getAutoStartupMenuKvid } = vi.hoisted(() => ({
  getRuntimeMenu: vi.fn(), getAutoStartupMenuKvid: vi.fn(),
}));
vi.mock('@/api/dashboard-admin', () => ({ getRuntimeMenu, getAutoStartupMenuKvid }));
import { ApiError } from '@/api/nest-client';
import { fetchMenuData, UnauthorizedError } from '@/router/routes/menu-service';

afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); });
describe('runtime menu failures', () => {
  it('propagates server failure instead of returning a successful empty menu', async () => {
    getRuntimeMenu.mockRejectedValue(new ApiError('service unavailable', 503));
    await expect(fetchMenuData('dashboard')).rejects.toThrow('service unavailable');
  });
  it('maps a final 401 to the router authentication error', async () => {
    getRuntimeMenu.mockRejectedValue(new ApiError('expired', 401));
    await expect(fetchMenuData('dashboard')).rejects.toBeInstanceOf(UnauthorizedError);
  });
  it('accepts an actual empty menu from the server', async () => {
    const menu = { MenuRoot: { Kvid: '', Title: '' }, MenusMain: { Results: [], Total: 0 } };
    getRuntimeMenu.mockResolvedValue(menu);
    await expect(fetchMenuData('dashboard')).resolves.toBe(menu);
  });
  it('ends a stalled request, aborts it, and allows a later successful request', async () => {
    vi.useFakeTimers();
    getRuntimeMenu.mockImplementationOnce(() => new Promise(() => {}));
    const failed = expect(fetchMenuData('dashboard')).rejects.toThrow('菜单加载超时');
    const signal = getRuntimeMenu.mock.calls.at(-1)![1] as AbortSignal;
    await vi.advanceTimersByTimeAsync(15000);
    await failed;
    expect(signal.aborted).toBe(true);
    getRuntimeMenu.mockResolvedValue({ MenusMain: { Results: [], Total: 0 } });
    await expect(fetchMenuData('dashboard')).resolves.toHaveProperty('MenusMain');
    expect(vi.getTimerCount()).toBe(0);
  });
});
