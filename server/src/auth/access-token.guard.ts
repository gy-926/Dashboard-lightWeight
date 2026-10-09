import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { IsNull, Repository } from 'typeorm';
import { tokenHash } from './auth.service.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// DEMO_READONLY=1 时，公开的演示账号可以浏览全部管理界面，但不能写入任何数据。
// 登录、续期和退出不经过此守卫，因此不受影响。
export function isDemoReadonlyUser(email: string): boolean {
  if (process.env.DEMO_READONLY !== '1') return false;
  const demoEmail = (process.env.DEMO_ADMIN_EMAIL || 'admin@example.com')
    .trim()
    .toLowerCase();
  return email.trim().toLowerCase() === demoEmail;
}

export interface AuthenticatedRequest extends Request {
  authUserId: string;
  authRole: UserRole;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @InjectRepository(AuthSession)
    private readonly sessions: Repository<AuthSession>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(
      request.headers.authorization ?? '',
    );
    if (!match) throw new UnauthorizedException('需要登录');
    const session = await this.sessions.findOneBy({
      accessHash: tokenHash(match[1]),
      revokedAt: IsNull(),
    });
    if (!session || session.accessExpiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('访问令牌已过期');
    }
    const user = await this.users.findOneBy({ id: session.userId });
    if (!user) throw new UnauthorizedException('账号不存在');
    if (!SAFE_METHODS.has(request.method) && isDemoReadonlyUser(user.email)) {
      throw new ForbiddenException('演示账号为只读，不能修改数据');
    }
    request.authUserId = session.userId;
    request.authRole = user.role;
    return true;
  }
}
