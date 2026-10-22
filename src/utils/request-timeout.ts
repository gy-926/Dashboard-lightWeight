/** 同时限制整个异步流程的等待时间，并通知支持取消的底层请求。 */
export async function withRequestTimeout<T>(
  request: (signal: AbortSignal) => Promise<T>,
  message: string,
  timeoutMs = 15000
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(message));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([request(controller.signal), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
