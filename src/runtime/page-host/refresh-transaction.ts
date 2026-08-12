import type { NavigationFailure } from 'vue-router';
import type { PageDestroyReason } from './types';

export type RefreshTransactionStatus =
  | 'refreshed'
  | 'skipped'
  | 'blank-navigation-failed'
  | 'restore-navigation-failed';

export interface RefreshTransactionOptions<T extends { path: string }> {
  path: string;
  fullPath: string;
  tabs: T[];
  removeTab(path: string, reason: PageDestroyReason): Promise<void>;
  navigate(target: string): Promise<void | NavigationFailure>;
  afterBlank(): Promise<void>;
}

export interface PageRefreshGate {
  readonly running: boolean;
  run<T>(task: () => Promise<T>): Promise<T | undefined>;
}

/** 同一时刻只运行一个刷新事务；重复点击直接忽略。 */
export function createPageRefreshGate(): PageRefreshGate {
  let running = false;

  return {
    get running() {
      return running;
    },
    async run<T>(task: () => Promise<T>): Promise<T | undefined> {
      if (running) return undefined;
      running = true;
      try {
        return await task();
      } finally {
        running = false;
      }
    },
  };
}

function restoreTab<T extends { path: string }>(tabs: T[], tab: T, originalIndex: number): void {
  if (tabs.some(item => item.path === tab.path)) return;
  tabs.splice(Math.min(originalIndex, tabs.length), 0, tab);
}

/**
 * 可恢复的标签刷新事务：只有空白页导航成功后才销毁旧实例，且恢复完整 URL。
 * Vue Router 成功导航返回 undefined，导航失败返回 NavigationFailure 对象。
 */
export async function runPageRefreshTransaction<T extends { path: string }>(
  options: RefreshTransactionOptions<T>
): Promise<RefreshTransactionStatus> {
  if (!options.path || options.path === '/blank') return 'skipped';

  const originalIndex = options.tabs.findIndex(tab => tab.path === options.path);
  if (originalIndex < 0) return 'skipped';

  const savedTab = { ...options.tabs[originalIndex] } as T;
  const blankFailure = await options.navigate('/blank');
  if (blankFailure) return 'blank-navigation-failed';

  await options.afterBlank();

  try {
    await options.removeTab(options.path, 'refresh');
  } catch (error) {
    restoreTab(options.tabs, savedTab, originalIndex);
    try {
      await options.navigate(options.fullPath);
    } catch {
      // 保留原始清理异常；标签已经恢复，可由用户再次进入。
    }
    throw error;
  }

  restoreTab(options.tabs, savedTab, originalIndex);
  const restoreFailure = await options.navigate(options.fullPath);
  return restoreFailure ? 'restore-navigation-failed' : 'refreshed';
}
