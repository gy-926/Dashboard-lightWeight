import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

const MAX_BUCKETS = 10_000;
const SWEEP_INTERVAL_MS = 60_000;

/**
 * 按客户端 IP 的固定窗口限流。计数保存在进程内存中，只适用于单实例部署；
 * 多实例部署需要换成共享存储。反向代理后需配置 trust proxy，否则所有请求共享代理 IP。
 */
export class IpRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private nextSweepAt = 0;

  constructor(
    private readonly name: string,
    // 读取放在请求时进行：控制器装饰器早于 main.ts 加载 .env 执行。
    private readonly limit: () => number,
    private readonly windowMs: number,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const now = Date.now();
    const key = request.ip ?? request.socket.remoteAddress ?? 'unknown';

    // 最多每分钟扫描一次，避免高基数流量下每个请求都遍历全部记录。
    if (now >= this.nextSweepAt) {
      this.sweep(now);
      this.nextSweepAt = now + SWEEP_INTERVAL_MS;
    }
    let bucket = this.buckets.get(key);
    if (!bucket && this.buckets.size >= MAX_BUCKETS) {
      // 不淘汰有效计数，否则切换来源可使已有 IP 的限流提前失效。
      http.getResponse<Response>().setHeader(
        'Retry-After',
        String(Math.ceil((this.nextSweepAt - now) / 1000)),
      );
      throw new HttpException('请求来源过多，请稍后重试', HttpStatus.SERVICE_UNAVAILABLE);
    }
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > this.limit()) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      http.getResponse<Response>().setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        `${this.name}请求过于频繁，请 ${Math.ceil(retryAfter / 60)} 分钟后重试`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private sweep(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export function envLimit(name: string, fallback: number): () => number {
  return () => {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  };
}
