import { accessSync, constants, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const serverRoot = resolve(root, 'server');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const result = spawnSync(npmCommand, args, {
    cwd: serverRoot,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function apiDependenciesInstalled() {
  const executable = resolve(
    serverRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'nest.cmd' : 'nest',
  );
  try {
    accessSync(executable, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

export function prepareApi() {
  if (!existsSync(resolve(serverRoot, '.env'))) {
    console.error('[api] 缺少 server/.env。请复制 server/.env.example 并填写本机 MySQL 连接信息。');
    process.exit(1);
  }
  if (!apiDependenciesInstalled()) {
    console.log('[api] 首次运行，正在安装后端依赖...');
    run(['ci']);
  }
  console.log('[api] 正在执行数据库迁移...');
  run(['run', 'migration:run']);
  console.log('[api] 正在确认本地演示管理员...');
  run(['run', 'seed:demo']);
}


export async function apiIsReady() {
  try {
    const response = await fetch('http://127.0.0.1:3000/');
    if (!response.ok) return false;
    const payload = await response.json();
    return payload?.status === 200 && payload?.message === 'success';
  } catch {
    return false;
  }
}
