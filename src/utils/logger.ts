const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[debug]', ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.log('[info]', ...args);
  },
  warn: (...args: unknown[]) => console.warn('[warn]', ...args),
  error: (...args: unknown[]) => console.error('[error]', ...args),
};
