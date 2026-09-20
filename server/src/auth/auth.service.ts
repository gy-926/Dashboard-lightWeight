import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { toPublicUser } from '../users/users.service.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { LoginAttempt } from './entities/login-attempt.entity.js';
import { hashPassword, verifyPassword } from './password.js';

export const ACCESS_TOKEN_SECONDS = 15 * 60;
export const REFRESH_TOKEN_SECONDS = 7 * 24 * 60 * 60;
export const MAX_LOGIN_FAILURES = 10;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly sessions: Repository<AuthSession>,
    @InjectRepository(LoginAttempt)
    private readonly attempts: Repository<LoginAttempt>,
  ) {}

  async login(email: string, password: string) {
    const emailHash = tokenHash(email.trim().toLowerCase());
    const result = await this.attempts.manager.transaction(async (manager) => {
      // INSERT IGNORE 解决首次并发登录时计数行不存在的问题。
      await manager.query(
        'INSERT IGNORE INTO `auth_login_attempts` (`email_hash`) VALUES (?)',
        [emailHash],
      );
      const attempt = await manager
        .getRepository(LoginAttempt)
        .createQueryBuilder('attempt')
        .setLock('pessimistic_write')
        .where('attempt.emailHash = :emailHash', { emailHash })
        .getOneOrFail();
      const now = Date.now();
      if (attempt.lockedUntil && attempt.lockedUntil.getTime() > now) {
        return { status: 'locked' as const };
      }
      if (
        !attempt.windowStartedAt ||
        now - attempt.windowStartedAt.getTime() >= LOGIN_WINDOW_MS
      ) {
        attempt.failedCount = 0;
        attempt.windowStartedAt = new Date(now);
        attempt.lockedUntil = null;
      }

      const user = await manager
        .getRepository(User)
        .createQueryBuilder('user')
        .addSelect('user.passwordHash')
        .where('user.email = :email', { email })
        .getOne();
      const valid = user?.passwordHash
        ? await verifyPassword(password, user.passwordHash)
        : false;
      if (valid && user) {
        await manager.getRepository(LoginAttempt).delete({ emailHash });
        return { status: 'success' as const, user };
      }

      attempt.failedCount += 1;
      if (attempt.failedCount >= MAX_LOGIN_FAILURES) {
        attempt.lockedUntil = new Date(now + LOGIN_WINDOW_MS);
      }
      await manager.getRepository(LoginAttempt).save(attempt);
      return { status: 'invalid' as const };
    });

    if (result.status === 'locked') {
      throw new HttpException(
        '登录尝试过多，请15分钟后重试',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (result.status === 'invalid') {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    return this.createSession(result.user);
  }

  private async createSession(user: User) {
    const accessToken = newToken();
    const refreshToken = newToken();
    const now = Date.now();
    await this.sessions.save(
      this.sessions.create({
        userId: user.id,
        accessHash: tokenHash(accessToken),
        refreshHash: tokenHash(refreshToken),
        accessExpiresAt: new Date(now + ACCESS_TOKEN_SECONDS * 1000),
        refreshExpiresAt: new Date(now + REFRESH_TOKEN_SECONDS * 1000),
        revokedAt: null,
      }),
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_SECONDS,
      user: toPublicUser(user),
    };
  }

  async refresh(refreshToken: string) {
    const hash = tokenHash(refreshToken);
    const session = await this.sessions.findOneBy({
      refreshHash: hash,
      revokedAt: IsNull(),
    });
    if (!session || session.refreshExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    const user = await this.users.findOneBy({ id: session.userId });
    if (!user) throw new UnauthorizedException('登录已过期，请重新登录');

    const accessToken = newToken();
    const nextRefreshToken = newToken();
    const now = Date.now();
    // 带上旧 hash 的条件更新，保证并发刷新时旧令牌只能成功一次。
    const result = await this.sessions
      .createQueryBuilder()
      .update(AuthSession)
      .set({
        accessHash: tokenHash(accessToken),
        refreshHash: tokenHash(nextRefreshToken),
        accessExpiresAt: new Date(now + ACCESS_TOKEN_SECONDS * 1000),
        refreshExpiresAt: new Date(now + REFRESH_TOKEN_SECONDS * 1000),
      })
      .where('id = :id AND refresh_hash = :hash AND revoked_at IS NULL', {
        id: session.id,
        hash,
      })
      .execute();
    if (result.affected !== 1) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
    return {
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: ACCESS_TOKEN_SECONDS,
      user: toPublicUser(user),
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessions.update(
      { refreshHash: tokenHash(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: userId })
      .getOne();
    if (
      !user?.passwordHash ||
      !(await verifyPassword(oldPassword, user.passwordHash))
    ) {
      throw new UnauthorizedException('原密码错误');
    }
    user.passwordHash = await hashPassword(newPassword);
    await this.users.save(user);
    await this.sessions.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async getUser(userId: string) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new UnauthorizedException();
    return toPublicUser(user);
  }
}
