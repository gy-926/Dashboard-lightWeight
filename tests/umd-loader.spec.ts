import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadUMDComponent, UMD_LOAD_TIMEOUT_MS } from '@/utils/umd/loader';
import { umdLoadingCount } from '@/utils/umd/state';

class Script extends EventTarget {
  src = '';
  dataset: Record<string, string> = {};
  remove() { scripts.splice(scripts.indexOf(this), 1); }
}
let scripts: Script[];
beforeEach(() => {
  vi.useFakeTimers();
  scripts = [];
  vi.stubGlobal('window', {});
  vi.stubGlobal('document', {
    baseURI: 'https://dashboard.test/', scripts,
    createElement: () => new Script(),
    head: { querySelectorAll: () => [], appendChild: (script: Script) => {
      script.src = new URL(script.src, 'https://dashboard.test/').href;
      scripts.push(script);
    } },
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('UMD script deadline and retry', () => {
  it('shares pending work, removes a timed out script and permits retry', async () => {
    const pending = loadUMDComponent('/hung.js');
    expect(loadUMDComponent('/hung.js')).toBe(pending);
    const failed = expect(pending).rejects.toThrow('加载超时');
    const staleScript = scripts[0];
    await vi.advanceTimersByTimeAsync(UMD_LOAD_TIMEOUT_MS);
    await failed;
    expect(scripts).toHaveLength(0);
    expect(umdLoadingCount.value).toBe(0);
    const retried = loadUMDComponent('/hung.js');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).not.toBe(staleScript.src);
    (window as any).__KIVII_UMD_REGISTRY__ = { byFileName: { 'hung.js': { Widget: {} } } };
    staleScript.dispatchEvent(new Event('load'));
    expect(umdLoadingCount.value).toBe(1);
    scripts[0].dispatchEvent(new Event('load'));
    await expect(retried).resolves.toHaveProperty('Widget');
    expect(umdLoadingCount.value).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('cleans up a network error and can retry the same URL', async () => {
    const failed = expect(loadUMDComponent('/network.js')).rejects.toThrow('加载失败');
    scripts[0].dispatchEvent(new Event('error'));
    await failed;
    expect(scripts).toHaveLength(0);
    const retry = expect(loadUMDComponent('/network.js')).rejects.toThrow('加载超时');
    await vi.advanceTimersByTimeAsync(UMD_LOAD_TIMEOUT_MS);
    await retry;
    expect(umdLoadingCount.value).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
});
