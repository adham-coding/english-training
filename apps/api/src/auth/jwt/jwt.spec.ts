import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  JwtService,
  type AccessTokenPayload,
  type RefreshTokenPayload,
} from './jwt.js';

describe('JwtService', () => {
  let service: JwtService;

  const accessSecret = 'a'.repeat(32);
  const refreshSecret = 'b'.repeat(32);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_SECRET: accessSecret,
                JWT_REFRESH_SECRET: refreshSecret,
              };

              return values[key];
            },
          },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should sign and verify an access token', async () => {
    const payload: AccessTokenPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    };

    const token = await service.signAccessToken(payload);
    const verified = await service.verifyAccessToken(token);

    expect(verified).toEqual(payload);
  });

  it('should issue unique access tokens', async () => {
    const payload: AccessTokenPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    };

    const firstToken = await service.signAccessToken(payload);
    const secondToken = await service.signAccessToken(payload);

    expect(firstToken).not.toBe(secondToken);
  });

  it('should sign and verify a refresh token', async () => {
    const payload: RefreshTokenPayload = {
      sub: 'user-123',
      jti: 'refresh-123',
      familyId: 'family-123',
      type: 'refresh',
    };

    const token = await service.signRefreshToken(payload);
    const verified = await service.verifyRefreshToken(token);

    expect(verified).toEqual(payload);
  });

  it('should reject an access token with the refresh secret', async () => {
    const payload: AccessTokenPayload = {
      sub: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    };

    const token = await service.signAccessToken(payload);

    await expect(service.verifyRefreshToken(token)).rejects.toThrow();
  });

  it('should reject a refresh token with the access secret', async () => {
    const payload: RefreshTokenPayload = {
      sub: 'user-123',
      jti: 'refresh-123',
      familyId: 'family-123',
      type: 'refresh',
    };

    const token = await service.signRefreshToken(payload);

    await expect(service.verifyAccessToken(token)).rejects.toThrow();
  });

  it('should reject a malformed access token', async () => {
    await expect(service.verifyAccessToken('not-a-jwt')).rejects.toThrow();
  });

  it('should reject a malformed refresh token', async () => {
    await expect(service.verifyRefreshToken('not-a-jwt')).rejects.toThrow();
  });
});
