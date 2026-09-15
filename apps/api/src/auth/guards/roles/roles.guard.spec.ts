import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROLES_KEY } from '../../decorators/roles/roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const reflector = {
    getAllAndOverride: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: reflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(),
    };

    expect(guard.canActivate(context as never)).toBe(true);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
  });

  it('should allow a user with a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => ({
          user: {
            sub: 'user-123',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })),
      })),
    };

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('should reject a user without the required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => ({
          user: {
            sub: 'user-123',
            email: 'user@example.com',
            role: 'USER',
          },
        })),
      })),
    };

    expect(guard.canActivate(context as never)).toBe(false);
  });

  it('should allow any matching role from multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'TEACHER']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => ({
          user: {
            sub: 'user-123',
            email: 'teacher@example.com',
            role: 'TEACHER',
          },
        })),
      })),
    };

    expect(guard.canActivate(context as never)).toBe(true);
  });

  it('should reject a request without an authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => ({
          user: undefined,
        })),
      })),
    };

    expect(guard.canActivate(context as never)).toBe(false);
  });

  it('should read handler and class metadata together', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const handler = vi.fn();
    const targetClass = vi.fn();

    const context = {
      getHandler: vi.fn(() => handler),
      getClass: vi.fn(() => targetClass),
      switchToHttp: vi.fn(() => ({
        getRequest: vi.fn(() => ({
          user: {
            sub: 'admin-123',
            email: 'admin@example.com',
            role: 'ADMIN',
          },
        })),
      })),
    };

    expect(guard.canActivate(context as never)).toBe(true);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      handler,
      targetClass,
    ]);
  });
});
