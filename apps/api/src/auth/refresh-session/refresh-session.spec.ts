import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RedisService } from '../redis/redis.js';
import { RefreshSessionService } from './refresh-session.js';

describe('RefreshSessionService', () => {
  let service: RefreshSessionService;

  const redisClient = {
    set: vi.fn(),
    get: vi.fn(),
    eval: vi.fn(),
  };

  const redisService = {
    getClient: vi.fn(() => redisClient),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionService,
        {
          provide: RedisService,
          useValue: redisService,
        },
      ],
    }).compile();

    service = module.get<RefreshSessionService>(RefreshSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an active refresh session with a TTL', async () => {
    redisClient.set.mockResolvedValue('OK');

    await service.create('jti-123', 'user-123', 'family-123');

    expect(redisClient.set).toHaveBeenNthCalledWith(
      1,
      'auth:refresh:jti-123',
      JSON.stringify({
        userId: 'user-123',
        familyId: 'family-123',
        status: 'active',
      }),
      {
        EX: 30 * 24 * 60 * 60,
      },
    );

    expect(redisClient.set).toHaveBeenNthCalledWith(
      2,
      'auth:refresh:family:family-123',
      'active',
      {
        NX: true,
        EX: 30 * 24 * 60 * 60,
      },
    );
  });

  it('should return an existing refresh session', async () => {
    redisClient.get.mockResolvedValue(
      JSON.stringify({
        userId: 'user-123',
        familyId: 'family-123',
        status: 'active',
      }),
    );

    await expect(service.get('jti-123')).resolves.toEqual({
      userId: 'user-123',
      familyId: 'family-123',
      status: 'active',
    });

    expect(redisClient.get).toHaveBeenCalledWith('auth:refresh:jti-123');
  });

  it('should return null for a missing refresh session', async () => {
    redisClient.get.mockResolvedValue(null);

    await expect(service.get('missing-jti')).resolves.toBeNull();
  });

  it('should revoke an existing session', async () => {
    redisClient.eval.mockResolvedValue(1);

    await expect(service.revoke('jti-123')).resolves.toBe(true);

    expect(redisClient.eval).toHaveBeenCalledWith(
      expect.stringContaining("session.status = 'revoked'"),
      {
        keys: ['auth:refresh:jti-123'],
      },
    );
  });

  it('should report false when revoking a missing or already revoked session', async () => {
    redisClient.eval.mockResolvedValue(0);

    await expect(service.revoke('jti-123')).resolves.toBe(false);
  });

  it('should rotate an active refresh session atomically', async () => {
    redisClient.eval.mockResolvedValue('rotated');

    await expect(
      service.rotate('old-jti', 'new-jti', 'user-123', 'family-123'),
    ).resolves.toBe('rotated');

    expect(redisClient.eval).toHaveBeenCalledWith(
      expect.stringContaining("oldSession.status ~= 'active'"),
      {
        keys: [
          'auth:refresh:old-jti',
          'auth:refresh:new-jti',
          'auth:refresh:family:family-123',
        ],
        arguments: [
          'user-123',
          'family-123',
          JSON.stringify({
            userId: 'user-123',
            familyId: 'family-123',
            status: 'active',
          }),
          String(30 * 24 * 60 * 60),
        ],
      },
    );
  });

  it('should detect refresh-token reuse', async () => {
    redisClient.eval.mockResolvedValue('reused');

    await expect(
      service.rotate('old-jti', 'new-jti', 'user-123', 'family-123'),
    ).resolves.toBe('reused');
  });

  it('should report a missing refresh session', async () => {
    redisClient.eval.mockResolvedValue('missing');

    await expect(
      service.rotate('old-jti', 'new-jti', 'user-123', 'family-123'),
    ).resolves.toBe('missing');
  });

  it('should report a revoked refresh family', async () => {
    redisClient.eval.mockResolvedValue('revoked');

    await expect(
      service.rotate('old-jti', 'new-jti', 'user-123', 'family-123'),
    ).resolves.toBe('revoked');
  });

  it('should revoke an entire refresh family', async () => {
    redisClient.set.mockResolvedValue('OK');

    await expect(service.revokeFamily('family-123')).resolves.toBe(true);

    expect(redisClient.set).toHaveBeenCalledWith(
      'auth:refresh:family:family-123',
      'revoked',
      {
        XX: true,
        KEEPTTL: true,
      },
    );
  });
});
