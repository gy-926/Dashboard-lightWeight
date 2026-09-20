import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { IsNull, Repository } from 'typeorm';
import { tokenHash } from './auth.service.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';

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
    request.authUserId = session.userId;
    request.authRole = user.role;
    return true;
  }
}
