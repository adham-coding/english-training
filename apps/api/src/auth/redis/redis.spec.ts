import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockConnect = vi.fn();
const mockQuit = vi.fn();

const mockRedisClient = {
  isOpen: false,
  connect: mockConnect,
  quit: mockQuit,
  on: vi.fn(),
};

vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

import { RedisService } from './redis.js';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn().mockReturnValue('redis://127.0.0.1:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should connect on module init', async () => {
    await service.onModuleInit();

    expect(mockConnect).toHaveBeenCalledOnce();
  });

  it('should quit on module destroy when connected', async () => {
    mockRedisClient.isOpen = true;

    await service.onModuleDestroy();

    expect(mockQuit).toHaveBeenCalledOnce();
  });

  it('should expose the redis client', () => {
    expect(service.getClient()).toBe(mockRedisClient);
  });
});
