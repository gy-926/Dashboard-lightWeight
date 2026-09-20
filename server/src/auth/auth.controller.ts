import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccessTokenGuard } from './access-token.guard.js';
import type { AuthenticatedRequest } from './access-token.guard.js';
import { AuthService, REFRESH_TOKEN_SECONDS } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';

const COOKIE_NAME = 'refresh_token';

function readRefreshCookie(request: Request): string | undefined {
  const value = request.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? value : undefined;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/auth',
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refreshToken, ...result } = await this.auth.login(
      body.email,
      body.password,
    );
    response.cookie(COOKIE_NAME, refreshToken, {
      ...cookieOptions(),
      maxAge: REFRESH_TOKEN_SECONDS * 1000,
    });
    return { ...result, tokenType: 'Bearer' };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = readRefreshCookie(request);
    if (!token) throw new UnauthorizedException('登录已过期，请重新登录');
    const { refreshToken, ...result } = await this.auth.refresh(token);
    response.cookie(COOKIE_NAME, refreshToken, {
      ...cookieOptions(),
      maxAge: REFRESH_TOKEN_SECONDS * 1000,
    });
    return { ...result, tokenType: 'Bearer' };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = readRefreshCookie(request);
    if (token) await this.auth.logout(token);
    response.clearCookie(COOKIE_NAME, cookieOptions());
    return null;
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.auth.getUser(request.authUserId);
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AccessTokenGuard)
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() body: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.changePassword(
      request.authUserId,
      body.oldPassword,
      body.newPassword,
    );
    response.clearCookie(COOKIE_NAME, cookieOptions());
    return null;
  }
}
