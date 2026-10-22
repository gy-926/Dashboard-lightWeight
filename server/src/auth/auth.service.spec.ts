import { expect, it, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import type { AuthSession } from './entities/auth-session.entity.js';
import type { LoginAttempt } from './entities/login-attempt.entity.js';

vi.mock('./password.js', () => ({
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

it('measures the actual login phases while preserving session creation', async () => {
  const user = {
    id: 'id',
    name: 'User',
    email: 'user@example.com',
    role: UserRole.User,
    passwordHash: 'hash',
  };
  const attemptQuery = {
    setLock: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getOneOrFail: vi.fn().mockResolvedValue({
      failedCount: 0,
      lockedUntil: null,
      windowStartedAt: null,
    }),
  };
  const userQuery = {
    addSelect: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    getOne: vi.fn().mockResolvedValue(user),
  };
  const attemptRepo = {
    createQueryBuilder: () => attemptQuery,
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const manager = {
    query: vi.fn().mockResolvedValue([]),
    getRepository: (entity: unknown) =>
      entity === User ? { createQueryBuilder: () => userQuery } : attemptRepo,
  };
  const attempts = { manager: { transaction: async (work) => work(manager) } };
  const sessions = {
    create: vi.fn((data) => data),
    save: vi.fn().mockResolvedValue({}),
  };
  const service = new AuthService(
    {} as Repository<User>,
    sessions as unknown as Repository<AuthSession>,
    attempts as unknown as Repository<LoginAttempt>,
  );
  const phases: string[] = [];
  const result = await service.login(
    user.email,
    'password',
    (name, duration) => {
      phases.push(name);
      expect(duration).toBeGreaterThanOrEqual(0);
    },
  );
  expect(phases).toEqual([
    'attempt_init',
    'attempt_lock',
    'user_lookup',
    'password_verify',
    'attempt_update',
    'auth_transaction',
    'session_create',
  ]);
  expect(result.accessToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect(sessions.save).toHaveBeenCalledTimes(1);
  expect(attemptRepo.delete).toHaveBeenCalledTimes(1);
});
