import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AccessTokenGuard } from './guards/access-token/access-token.guard.js';
import { JwtService } from './jwt/jwt.js';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  };

  const jwtService = {
    verifyAccessToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: AccessTokenGuard,
          useFactory: () => new AccessTokenGuard(jwtService as never),
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate registration to AuthService', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    const expected = {
      id: 'user-123',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      role: 'USER',
      isActive: true,
    };

    authService.register.mockResolvedValue(expected);

    await expect(controller.register(dto)).resolves.toEqual(expected);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('should return the public login session and set the refresh token cookie', async () => {
    const dto = {
      email: 'user@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    const session = {
      id: 'user-123',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      role: 'USER',
      isActive: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const response = {
      cookie: vi.fn(),
    };

    authService.login.mockResolvedValue(session);

    const result = await controller.login(dto, response as never);

    expect(authService.login).toHaveBeenCalledWith(dto);
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      role: 'USER',
      isActive: true,
      accessToken: 'access-token',
    });

    expect(result).not.toHaveProperty('refreshToken');
  });

  it('should refresh using the refresh-token cookie', async () => {
    const session = {
      id: 'user-123',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      role: 'USER',
      isActive: true,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    const request = {
      headers: {
        cookie: 'foo=bar; refresh_token=old-refresh-token',
      },
    };

    const response = {
      cookie: vi.fn(),
    };

    authService.refresh.mockResolvedValue(session);

    const result = await controller.refresh(
      request as never,
      response as never,
    );

    expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');

    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-refresh-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      }),
    );

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      firstName: null,
      lastName: null,
      role: 'USER',
      isActive: true,
      accessToken: 'new-access-token',
    });

    expect(result).not.toHaveProperty('refreshToken');
  });

  it('should reject refresh without a refresh-token cookie', async () => {
    const request = {
      headers: {},
    };

    const response = {
      cookie: vi.fn(),
    };

    await expect(
      controller.refresh(request as never, response as never),
    ).rejects.toThrow('Refresh token required');

    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it('should logout using the refresh-token cookie', async () => {
    const request = {
      headers: {
        cookie: 'foo=bar; refresh_token=refresh-token-123',
      },
    };

    const response = {
      clearCookie: vi.fn(),
    };

    authService.logout.mockResolvedValue(undefined);

    await expect(
      controller.logout(request as never, response as never),
    ).resolves.toBeUndefined();

    expect(authService.logout).toHaveBeenCalledWith('refresh-token-123');

    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      }),
    );
  });

  it('should logout without a refresh-token cookie', async () => {
    const request = {
      headers: {},
    };

    const response = {
      clearCookie: vi.fn(),
    };

    await expect(
      controller.logout(request as never, response as never),
    ).resolves.toBeUndefined();

    expect(authService.logout).not.toHaveBeenCalled();

    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/api/v1/auth',
      }),
    );
  });

  it('should delegate current-user lookup', async () => {
    const request = {
      user: {
        sub: 'user-123',
        email: 'user@example.com',
        role: 'USER',
      },
    };

    const expected = {
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Adham',
      lastName: 'Example',
      role: 'USER',
      isActive: true,
    };

    authService.getCurrentUser.mockResolvedValue(expected);

    await expect(controller.me(request as never)).resolves.toEqual(expected);
    expect(authService.getCurrentUser).toHaveBeenCalledWith('user-123');
  });
});
