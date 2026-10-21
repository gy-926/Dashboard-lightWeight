import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const defaultEnvFile = fileURLToPath(new URL('../server/.env', import.meta.url));

/** Match the API's PORT/HOST precedence without loading database credentials into process.env. */
export function getDevApiUrl({ env = process.env, envFile = defaultEnvFile } = {}) {
  const fileEnv = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
  const portText = String(env.PORT ?? fileEnv.PORT ?? '3000').trim();
  const port = Number(portText);
  if (!/^\d+$/.test(portText) || port < 1 || port > 65535) {
    throw new Error('API PORT 必须是 1–65535 的整数');
  }
  const host = (env.HOST ?? fileEnv.HOST ?? '127.0.0.1').trim();
  // Wildcard listen addresses must be accessed through loopback by the local client.
  const clientHost = host === '0.0.0.0' ? '127.0.0.1' : host === '::' ? '[::1]' : host;
  return new URL(`http://${clientHost.includes(':') && !clientHost.startsWith('[') ? `[${clientHost}]` : clientHost}:${port}`).origin;
}
