import { spawn } from 'node:child_process';
import { apiIsReady, prepareApi, serverRoot } from './prepare-api.mjs';

prepareApi();

if (await apiIsReady()) {
  console.log('[api] 检测到 http://127.0.0.1:3000 已有兼容 API，继续使用现有服务。');
  process.exit(0);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const api = spawn(npmCommand, ['run', 'start:dev'], {
  cwd: serverRoot,
  env: process.env,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => api.kill(signal));
}

api.on('exit', code => process.exit(code ?? 0));
