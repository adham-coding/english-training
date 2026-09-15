import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService } from './auth.service.js';
import { JwtService } from './jwt/jwt.js';
import { PasswordService } from './password/password.js';
import { RefreshSessionService } from './refresh-session/refresh-session.js';
import type { LoginDto } from './dto/login/login.js';
import type { RegisterDto } from './dto/register/register.js';

describe('AuthService', () => {
  let service: AuthService;

  const user = {
    id: 'user-123',
    email: 'user@example.com',
    passwordHash: 'argon2id-hash',
    firstName: 'Adham',
    lastName: 'Example',
    role: 'USER',
    isActive: true,
  };

  const userCollection = {
    first: vi.fn(),
    create: vi.fn(),
  };

  const prisma = {
    client: {
      orm: {
        public: {
          User: userCollection,
        },
      },
    },
  };

  const passwordService = {
    hash: vi.fn(),
    verify: vi.fn(),
  };

  const jwtService = {
    signAccessToken: vi.fn(),
    signRefreshToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
  };

  const refreshSessionService = {
    create: vi.fn(),
    rotate: vi.fn(),
    revokeFamily: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: PasswordService,
          useValue: passwordService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RefreshSessionService,
          useValue: refreshSessionService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user', async () => {
    const dto: RegisterDto = {
      email: '  USER@Example.COM ',
      password: 'Correct-Horse-Battery-Staple-123!',
      firstName: ' Adham ',
      lastName: ' Example ',
    };

    userCollection.first.mockResolvedValue(null);
    passwordService.hash.mockResolvedValue('hashed-password');
    userCollection.create.mockResolvedValue(user);

    const result = await service.register(dto);

    expect(userCollection.first).toHaveBeenCalledWith({
      email: 'user@example.com',
    });

    expect(passwordService.hash).toHaveBeenCalledWith(dto.password);

    expect(userCollection.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      firstName: 'Adham',
      lastName: 'Example',
    });

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Adham',
      lastName: 'Example',
      role: 'USER',
      isActive: true,
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should reject registration when the email already exists', async () => {
    const dto: RegisterDto = {
      email: 'USER@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    userCollection.first.mockResolvedValue(user);

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(passwordService.hash).not.toHaveBeenCalled();
    expect(userCollection.create).not.toHaveBeenCalled();
  });

  it('should login and issue access and refresh tokens', async () => {
    const dto: LoginDto = {
      email: ' USER@Example.COM ',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    userCollection.first.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(true);
    jwtService.signAccessToken.mockResolvedValue('access-token');
    jwtService.signRefreshToken.mockResolvedValue('refresh-token');

    const result = await service.login(dto);

    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    expect(jwtService.signRefreshToken).toHaveBeenCalledWith({
      sub: user.id,
      jti: expect.any(String),
      familyId: expect.any(String),
      type: 'refresh',
    });

    expect(refreshSessionService.create).toHaveBeenCalledWith(
      expect.any(String),
      user.id,
      expect.any(String),
    );

    expect(refreshSessionService.create.mock.calls[0][0]).toBe(
      jwtService.signRefreshToken.mock.calls[0][0].jti,
    );

    expect(result).toMatchObject({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Adham',
      lastName: 'Example',
      role: 'USER',
      isActive: true,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should refresh an active refresh token', async () => {
    const payload = {
      sub: 'user-123',
      jti: 'old-jti',
      familyId: 'family-123',
      type: 'refresh' as const,
    };

    jwtService.verifyRefreshToken.mockResolvedValue(payload);
    refreshSessionService.rotate.mockResolvedValue('rotated');
    jwtService.signAccessToken.mockResolvedValue('new-access-token');
    jwtService.signRefreshToken.mockResolvedValue('new-refresh-token');

    const result = await service.refresh('old-refresh-token');

    expect(jwtService.verifyRefreshToken).toHaveBeenCalledWith(
      'old-refresh-token',
    );

    expect(userCollection.first).toHaveBeenCalledWith({
      id: 'user-123',
    });

    expect(refreshSessionService.rotate).toHaveBeenCalledWith(
      'old-jti',
      expect.any(String),
      'user-123',
      'family-123',
    );

    expect(jwtService.signAccessToken).toHaveBeenCalledWith({
      sub: 'user-123',
      email: 'user@example.com',
      role: 'USER',
    });

    expect(jwtService.signRefreshToken).toHaveBeenCalledWith({
      sub: 'user-123',
      jti: refreshSessionService.rotate.mock.calls[0][1],
      familyId: 'family-123',
      type: 'refresh',
    });

    expect(result).toMatchObject({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Adham',
      lastName: 'Example',
      role: 'USER',
      isActive: true,
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should reject a reused refresh token', async () => {
    jwtService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-123',
      jti: 'old-jti',
      familyId: 'family-123',
      type: 'refresh',
    });
    refreshSessionService.rotate.mockResolvedValue('reused');

    await expect(service.refresh('old-refresh-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    expect(jwtService.signRefreshToken).not.toHaveBeenCalled();
  });

  it('should reject a missing refresh session', async () => {
    jwtService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-123',
      jti: 'missing-jti',
      familyId: 'family-123',
      type: 'refresh',
    });
    refreshSessionService.rotate.mockResolvedValue('missing');

    await expect(
      service.refresh('missing-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(jwtService.signAccessToken).not.toHaveBeenCalled();
    expect(jwtService.signRefreshToken).not.toHaveBeenCalled();
  });

  it('should return the current active user', async () => {
    userCollection.first.mockResolvedValue(user);

    const result = await service.getCurrentUser('user-123');

    expect(userCollection.first).toHaveBeenCalledWith({
      id: 'user-123',
    });

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Adham',
      lastName: 'Example',
      role: 'USER',
      isActive: true,
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should reject an unknown current user', async () => {
    userCollection.first.mockResolvedValue(null);

    await expect(service.getCurrentUser('missing-user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should reject an inactive current user', async () => {
    userCollection.first.mockResolvedValue({
      ...user,
      isActive: false,
    });

    await expect(service.getCurrentUser('user-123')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should validate correct credentials', async () => {
    const dto: LoginDto = {
      email: ' USER@Example.COM ',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    userCollection.first.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(true);

    const result = await service.validateCredentials(dto);

    expect(userCollection.first).toHaveBeenCalledWith({
      email: 'user@example.com',
    });

    expect(passwordService.verify).toHaveBeenCalledWith(
      user.passwordHash,
      dto.password,
    );

    expect(result).toEqual({
      id: 'user-123',
      email: 'user@example.com',
      firstName: 'Adham',
      lastName: 'Example',
      role: 'USER',
      isActive: true,
    });

    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should reject unknown credentials', async () => {
    const dto: LoginDto = {
      email: 'unknown@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    userCollection.first.mockResolvedValue(null);

    await expect(service.validateCredentials(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it('should reject an inactive user', async () => {
    const dto: LoginDto = {
      email: 'user@example.com',
      password: 'Correct-Horse-Battery-Staple-123!',
    };

    userCollection.first.mockResolvedValue({
      ...user,
      isActive: false,
    });

    await expect(service.validateCredentials(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it('should reject an incorrect password', async () => {
    const dto: LoginDto = {
      email: 'user@example.com',
      password: 'Wrong-Password-123!',
    };

    userCollection.first.mockResolvedValue(user);
    passwordService.verify.mockResolvedValue(false);

    await expect(service.validateCredentials(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(passwordService.verify).toHaveBeenCalledWith(
      user.passwordHash,
      dto.password,
    );
  });

  it('should logout and revoke the refresh token family', async () => {
    jwtService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-123',
      jti: 'refresh-jti',
      familyId: 'family-123',
      type: 'refresh',
    });

    refreshSessionService.revokeFamily.mockResolvedValue(true);

    await expect(service.logout('refresh-token')).resolves.toBeUndefined();

    expect(jwtService.verifyRefreshToken).toHaveBeenCalledWith('refresh-token');

    expect(refreshSessionService.revokeFamily).toHaveBeenCalledWith(
      'family-123',
    );
  });

  it('should reject logout when the refresh token is invalid', async () => {
    jwtService.verifyRefreshToken.mockRejectedValue(
      new UnauthorizedException('Invalid refresh token'),
    );

    await expect(
      service.logout('invalid-refresh-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(refreshSessionService.revokeFamily).not.toHaveBeenCalled();
  });
});
