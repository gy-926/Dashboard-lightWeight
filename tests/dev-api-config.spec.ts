import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getDevApiUrl } from '../scripts/dev-api-config.mjs';

const directories: string[] = [];
function fixture(content?: string) {
  const directory = mkdtempSync(join(tmpdir(), 'dashboard-api-config-'));
  directories.push(directory);
  const envFile = join(directory, '.env');
  if (content !== undefined) writeFileSync(envFile, content);
  return envFile;
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe('development API address', () => {
  it('defaults to the local API when no environment file exists', () => {
    expect(getDevApiUrl({ env: {}, envFile: fixture() })).toBe('http://127.0.0.1:3000');
  });

  it('reads quoted PORT and HOST from server configuration', () => {
    expect(getDevApiUrl({ env: {}, envFile: fixture('PORT="3101" # custom\nHOST=localhost\n') }))
      .toBe('http://localhost:3101');
  });

  it('gives process environment priority over the file', () => {
    expect(getDevApiUrl({ env: { PORT: '3202' }, envFile: fixture('PORT=3101\n') }))
      .toBe('http://127.0.0.1:3202');
  });

  it.each([['0.0.0.0', '127.0.0.1'], ['::', '[::1]'], ['::1', '[::1]']])(
    'connects to the loopback address for %s', (host, expected) => {
      expect(getDevApiUrl({ env: { HOST: host }, envFile: fixture() }))
        .toBe(`http://${expected}:3000`);
    }
  );

  it.each(['', '0', '65536', '3.5', 'invalid'])('rejects invalid port %j early', port => {
    expect(() => getDevApiUrl({ env: { PORT: port }, envFile: fixture() })).toThrow('PORT');
  });
});
