import { HttpException, HttpStatus, type ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { envLimit, IpRateLimitGuard } from './ip-rate-limit.guard.js';

function contextFor(ip: string) {
  const response = { setHeader: vi.fn() };
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ ip, socket: {} }),
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
  return { context, response };
}

describe('IpRateLimitGuard', () => {
  afterEach(() => {
    vi.useRealTimers();
    delete process.env.TEST_IP_LIMIT;
  });

  it('rejects requests over the limit per IP and resets after the window', () => {
    vi.useFakeTimers();
    const guard = new IpRateLimitGuard('登录', () => 2, 60_000);
    const first = contextFor('10.0.0.1');

    expect(guard.canActivate(first.context)).toBe(true);
    expect(guard.canActivate(first.context)).toBe(true);
    try {
      guard.canActivate(first.context);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }
    expect(first.response.setHeader).toHaveBeenCalledWith('Retry-After', '60');

    // 其他 IP 不受影响。
    expect(guard.canActivate(contextFor('10.0.0.2').context)).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(guard.canActivate(first.context)).toBe(true);
  });

  it('reads the limit from the environment with a fallback', () => {
    const limit = envLimit('TEST_IP_LIMIT', 7);
    expect(limit()).toBe(7);
    process.env.TEST_IP_LIMIT = '3';
    expect(limit()).toBe(3);
    process.env.TEST_IP_LIMIT = 'abc';
    expect(limit()).toBe(7);
  });

  it('bounds the number of IPs without resetting active limits and recovers after expiry', () => {
    vi.useFakeTimers();
    const guard = new IpRateLimitGuard('登录', () => 1, 60_000);
    const request = { ip: '', socket: {} };
    const response = { setHeader: vi.fn() };
    const context = {
      switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }),
    } as unknown as ExecutionContext;

    for (let index = 0; index < 10_000; index++) {
      request.ip = `ip-${index}`;
      expect(guard.canActivate(context)).toBe(true);
    }
    request.ip = 'new-ip';
    try {
      guard.canActivate(context);
      expect.unreachable();
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    }
    expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '60');

    request.ip = 'ip-0';
    try {
      guard.canActivate(context);
      expect.unreachable();
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    }

    vi.advanceTimersByTime(60_000);
    request.ip = 'new-ip';
    expect(guard.canActivate(context)).toBe(true);
  });
});
