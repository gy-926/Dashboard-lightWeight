import { describe, expect, it, vi } from 'vitest';
import type { Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

describe('login response timing', () => {
  it('reports phase timings without adding secrets to headers or changing the payload', async () => {
    const user = {
      id: 'id',
      name: 'User',
      email: 'user@example.com',
      role: 'user',
    };
    const login = vi.fn(async (_email, _password, record) => {
      record('password_verify', 165.25);
      record('session_create', 23.5);
      return {
        accessToken: 'access-secret',
        refreshToken: 'refresh-secret',
        expiresIn: 900,
        user,
      };
    });
    const response = { cookie: vi.fn(), setHeader: vi.fn() };
    const controller = new AuthController({ login } as unknown as AuthService);
    const result = await controller.login(
      { email: user.email, password: 'password-secret' },
      response as unknown as Response,
    );
    expect(result).toEqual({
      accessToken: 'access-secret',
      expiresIn: 900,
      user,
      tokenType: 'Bearer',
    });
    const [name, value] = response.setHeader.mock.calls[0];
    expect(name).toBe('Server-Timing');
    expect(value).toMatch(
      /^password_verify;dur=165\.3, session_create;dur=23\.5, auth_total;dur=\d+\.\d$/,
    );
    expect(value).not.toMatch(/secret|example/);
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-secret',
      expect.any(Object),
    );
  });

  it('keeps completed timings on authentication errors without issuing a cookie', async () => {
    const error = new UnauthorizedException('邮箱或密码错误');
    const login = vi.fn(async (_email, _password, record) => {
      record('attempt_lock', 2000);
      throw error;
    });
    const response = { cookie: vi.fn(), setHeader: vi.fn() };
    const controller = new AuthController({ login } as unknown as AuthService);
    await expect(
      controller.login(
        { email: 'user@example.com', password: 'wrong' },
        response as unknown as Response,
      ),
    ).rejects.toBe(error);
    expect(response.setHeader).toHaveBeenCalledWith(
      'Server-Timing',
      expect.stringMatching(/^attempt_lock;dur=2000\.0, auth_total;dur=/),
    );
    expect(response.cookie).not.toHaveBeenCalled();
  });
});
