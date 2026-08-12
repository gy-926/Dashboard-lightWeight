import { describe, expect, it, vi } from 'vitest';
import {
  createPageRefreshGate,
  runPageRefreshTransaction,
} from '@/runtime/page-host/refresh-transaction';

interface TestTab {
  path: string;
  title: string;
}

function createTabs(): TestTab[] {
  return [
    { path: '/home', title: '首页' },
    { path: '/form', title: '表单' },
    { path: '/report', title: '报表' },
  ];
}

describe('PageHost refresh transaction', () => {
  it('ignores repeated refresh requests while one transaction is running', async () => {
    const gate = createPageRefreshGate();
    let finishFirst!: () => void;
    const firstTask = vi.fn(() => new Promise<void>(resolve => {
      finishFirst = resolve;
    }));
    const secondTask = vi.fn(async () => {});

    const firstRun = gate.run(firstTask);
    const secondResult = await gate.run(secondTask);

    expect(gate.running).toBe(true);
    expect(secondResult).toBeUndefined();
    expect(secondTask).not.toHaveBeenCalled();

    finishFirst();
    await firstRun;
    expect(gate.running).toBe(false);
  });

  it('destroys with refresh and restores the full path and tab position', async () => {
    const tabs = createTabs();
    const navigate = vi.fn().mockResolvedValue(undefined);
    const removeTab = vi.fn(async (path: string) => {
      tabs.splice(tabs.findIndex(tab => tab.path === path), 1);
    });

    const status = await runPageRefreshTransaction({
      path: '/form',
      fullPath: '/form?id=42#details',
      tabs,
      removeTab,
      navigate,
      afterBlank: async () => {},
    });

    expect(status).toBe('refreshed');
    expect(removeTab).toHaveBeenCalledWith('/form', 'refresh');
    expect(navigate).toHaveBeenNthCalledWith(1, '/blank');
    expect(navigate).toHaveBeenNthCalledWith(2, '/form?id=42#details');
    expect(tabs.map(tab => tab.path)).toEqual(['/home', '/form', '/report']);
  });

  it('does not destroy the page when navigation to blank is rejected', async () => {
    const tabs = createTabs();
    const navigationFailure = { type: 4 } as any;
    const removeTab = vi.fn();

    const status = await runPageRefreshTransaction({
      path: '/form',
      fullPath: '/form?id=42',
      tabs,
      removeTab,
      navigate: vi.fn().mockResolvedValue(navigationFailure),
      afterBlank: async () => {},
    });

    expect(status).toBe('blank-navigation-failed');
    expect(removeTab).not.toHaveBeenCalled();
    expect(tabs).toHaveLength(3);
  });

  it('keeps the restored tab when navigation back fails', async () => {
    const tabs = createTabs();
    const removeTab = vi.fn(async (path: string) => {
      tabs.splice(tabs.findIndex(tab => tab.path === path), 1);
    });
    const navigate = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ type: 4 });

    const status = await runPageRefreshTransaction({
      path: '/form',
      fullPath: '/form?id=42',
      tabs,
      removeTab,
      navigate,
      afterBlank: async () => {},
    });

    expect(status).toBe('restore-navigation-failed');
    expect(tabs.map(tab => tab.path)).toEqual(['/home', '/form', '/report']);
  });

  it('restores the tab and original route when cleanup throws', async () => {
    const tabs = createTabs();
    const navigate = vi.fn().mockResolvedValue(undefined);

    await expect(runPageRefreshTransaction({
      path: '/form',
      fullPath: '/form?id=42',
      tabs,
      removeTab: async path => {
        tabs.splice(tabs.findIndex(tab => tab.path === path), 1);
        throw new Error('cleanup failed');
      },
      navigate,
      afterBlank: async () => {},
    })).rejects.toThrow('cleanup failed');

    expect(tabs.map(tab => tab.path)).toEqual(['/home', '/form', '/report']);
    expect(navigate).toHaveBeenLastCalledWith('/form?id=42');
  });
});
