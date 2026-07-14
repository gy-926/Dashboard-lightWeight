import { createHash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();
const packagePath = resolve(root, 'package.json');
const lockfilePath = resolve(root, 'pnpm-lock.yaml');
const nodeModulesPath = resolve(root, 'node_modules');
const stampPath = resolve(nodeModulesPath, '.kivii-deps-lock');
const vitePath = resolve(nodeModulesPath, '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');

async function fingerprint() {
  const hash = createHash('sha256');
  hash.update(await readFile(packagePath));
  hash.update('\0');
  hash.update(await readFile(lockfilePath));
  return hash.digest('hex');
}

async function dependenciesAreCurrent(expected) {
  try {
    await access(vitePath, constants.X_OK);
    return (await readFile(stampPath, 'utf8')).trim() === expected;
  } catch {
    return false;
  }
}

function installDependencies() {
  const npmExecPath = process.env.npm_execpath;
  const command = npmExecPath ? process.execPath : process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const args = npmExecPath
    ? [npmExecPath, 'install', '--frozen-lockfile', '--prefer-offline']
    : ['install', '--frozen-lockfile', '--prefer-offline'];

  console.log('[deps] 检测到分支依赖变化，正在按 pnpm-lock.yaml 自动同步...');
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, CI: process.env.CI || 'true' },
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const expected = await fingerprint();
if (!(await dependenciesAreCurrent(expected))) {
  installDependencies();
  await mkdir(nodeModulesPath, { recursive: true });
  await writeFile(stampPath, `${expected}\n`);
  console.log('[deps] 依赖同步完成。');
}
