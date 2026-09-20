import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiIsReady, prepareApi, serverRoot } from './prepare-api.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const children = [];
let stopping = false;

function start(command, args, cwd) {
  const child = spawn(command, args, { cwd, env: process.env, stdio: 'inherit' });
  children.push(child);
  child.on('exit', code => {
    if (stopping) return;
    stopping = true;
    for (const other of children) if (other !== child) other.kill('SIGTERM');
    process.exit(code ?? 0);
  });
  return child;
}

async function waitForApi(api) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (api.exitCode !== null) throw new Error('后端启动失败');
    try {
      const response = await fetch('http://127.0.0.1:3000/');
      if (response.ok) return;
    } catch {
      // 后端仍在启动。
    }
    await new Promise(resolvePromise => setTimeout(resolvePromise, 500));
  }
  throw new Error('等待后端启动超时');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    for (const child of children) child.kill(signal);
  });
}

try {
  prepareApi();
  if (await apiIsReady()) {
    console.log('[dev] 检测到 3000 端口已有兼容 API，继续使用现有后端。');
  } else {
    const api = start(npmCommand, ['run', 'start:dev'], serverRoot);
    console.log('[dev] 后端启动中，前端将在 API 就绪后启动...');
    await waitForApi(api);
  }
  console.log('[dev] API 已就绪，正在启动前端...');
  start(pnpmCommand, ['run', 'dev:web'], root);
} catch (error) {
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  console.error(`[dev] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
