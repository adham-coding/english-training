import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { JwtService } from '../../jwt/jwt.js';
import { AccessTokenGuard } from './access-token.guard.js';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;

  const jwtService = {
    verifyAccessToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenGuard,
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    guard = module.get<AccessTokenGuard>(AccessTokenGuard);
  });

  function createContext(authorization?: string) {
    const request: Record<string, unknown> = {};

    request.get = vi.fn().mockReturnValue(authorization);

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      request,
    };
  }

  it('should accept a valid bearer token', async () => {
    const payload = {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    };

    jwtService.verifyAccessToken.mockResolvedValue(payload);

    const context = createContext('Bearer valid-access-token');

    await expect(guard.canActivate(context as never)).resolves.toBe(true);

    expect(jwtService.verifyAccessToken).toHaveBeenCalledWith(
      'valid-access-token',
    );
    expect(context.request.user).toEqual(payload);
  });

  it('should accept a lowercase bearer scheme', async () => {
    jwtService.verifyAccessToken.mockResolvedValue({
      sub: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    });

    const context = createContext('bearer valid-access-token');

    await expect(guard.canActivate(context as never)).resolves.toBe(true);

    expect(jwtService.verifyAccessToken).toHaveBeenCalledWith(
      'valid-access-token',
    );
  });

  it('should reject a missing authorization header', async () => {
    const context = createContext();

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should reject an invalid authorization scheme', async () => {
    const context = createContext('Basic abc123');

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should reject an empty bearer token', async () => {
    const context = createContext('Bearer   ');

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAccessToken).not.toHaveBeenCalled();
  });

  it('should reject an invalid access token', async () => {
    jwtService.verifyAccessToken.mockRejectedValue(new Error('invalid'));

    const context = createContext('Bearer invalid-token');

    await expect(guard.canActivate(context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
  });
});
