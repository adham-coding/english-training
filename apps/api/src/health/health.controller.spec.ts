import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;

  const healthCheckServiceMock = {
    check: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckServiceMock,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('live should call health check', async () => {
    const result = { status: 'ok' };
    healthCheckServiceMock.check.mockResolvedValue(result);

    await expect(controller.live()).resolves.toEqual(result);
    expect(healthCheckServiceMock.check).toHaveBeenCalledWith([]);
  });

  it('ready should call health check', async () => {
    const result = { status: 'ok' };
    healthCheckServiceMock.check.mockResolvedValue(result);

    await expect(controller.ready()).resolves.toEqual(result);
    expect(healthCheckServiceMock.check).toHaveBeenCalledWith([]);
  });
});
