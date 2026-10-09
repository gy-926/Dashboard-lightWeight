import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccessTokenGuard } from './access-token.guard.js';
import type { AuthSession } from './entities/auth-session.entity.js';
import { UserRole, type User } from '../users/entities/user.entity.js';

const token = 'a'.repeat(43);

function guardFor(email: string) {
  const sessions = {
    findOneBy: vi.fn().mockResolvedValue({
      userId: 'user-id',
      accessExpiresAt: new Date(Date.now() + 60_000),
    }),
  } as unknown as Repository<AuthSession>;
  const users = {
    findOneBy: vi.fn().mockResolvedValue({ id: 'user-id', email, role: UserRole.SuperAdmin }),
  } as unknown as Repository<User>;
  return new AccessTokenGuard(sessions, users);
}

function contextFor(method: string) {
  const request = { method, headers: { authorization: `Bearer ${token}` } };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AccessTokenGuard demo read-only mode', () => {
  afterEach(() => {
    delete process.env.DEMO_READONLY;
    delete process.env.DEMO_ADMIN_EMAIL;
  });

  it('blocks writes from the demo account only when enabled', async () => {
    const guard = guardFor('Admin@Example.com');
    await expect(guard.canActivate(contextFor('POST'))).resolves.toBe(true);

    process.env.DEMO_READONLY = '1';
    await expect(guard.canActivate(contextFor('GET'))).resolves.toBe(true);
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      await expect(guard.canActivate(contextFor(method))).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('uses DEMO_ADMIN_EMAIL and leaves other accounts writable', async () => {
    process.env.DEMO_READONLY = '1';
    process.env.DEMO_ADMIN_EMAIL = 'demo@example.org';
    await expect(guardFor('admin@example.com').canActivate(contextFor('POST'))).resolves.toBe(true);
    await expect(guardFor('demo@example.org').canActivate(contextFor('DELETE'))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
