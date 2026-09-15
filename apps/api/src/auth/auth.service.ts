import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { JwtService } from './jwt/jwt.js';
import { PasswordService } from './password/password.js';
import { RefreshSessionService } from './refresh-session/refresh-session.js';
import type { LoginDto } from './dto/login/login.js';
import type { RegisterDto } from './dto/register/register.js';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type UserWithPassword = {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  isActive: boolean;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthUser> {
    const email = this.normalizeEmail(dto.email);

    const existingUser = await this.prisma.client.orm.public.User.first({
      email,
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    const user = await this.prisma.client.orm.public.User.create({
      email,
      passwordHash,
      firstName: dto.firstName?.trim() || null,
      lastName: dto.lastName?.trim() || null,
    });

    return this.toAuthUser(user);
  }

  async login(dto: LoginDto): Promise<AuthUser & AuthTokens> {
    const user = await this.validateCredentials(dto);
    const refreshJti = randomUUID();
    const refreshFamilyId = randomUUID();

    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = await this.jwtService.signRefreshToken({
      sub: user.id,
      jti: refreshJti,
      familyId: refreshFamilyId,
      type: 'refresh',
    });

    await this.refreshSessionService.create(
      refreshJti,
      user.id,
      refreshFamilyId,
    );

    return {
      ...user,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<AuthUser & AuthTokens> {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken);

    const user = await this.getCurrentUser(payload.sub);
    const newJti = randomUUID();

    const rotation = await this.refreshSessionService.rotate(
      payload.jti,
      newJti,
      user.id,
      payload.familyId,
    );

    if (rotation === 'reused') {
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (rotation === 'missing') {
      throw new UnauthorizedException('Refresh session not found');
    }

    if (rotation === 'revoked') {
      throw new UnauthorizedException('Refresh session revoked');
    }

    const accessToken = await this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = await this.jwtService.signRefreshToken({
      sub: user.id,
      jti: newJti,
      familyId: payload.familyId,
      type: 'refresh',
    });

    return {
      ...user,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.jwtService.verifyRefreshToken(refreshToken);

    await this.refreshSessionService.revokeFamily(payload.familyId);
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = (await this.prisma.client.orm.public.User.first({
      id: userId,
    })) as UserWithPassword | null;

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not available');
    }

    return this.toAuthUser(user);
  }

  async validateCredentials(dto: LoginDto): Promise<AuthUser> {
    const email = this.normalizeEmail(dto.email);

    const user = (await this.prisma.client.orm.public.User.first({
      email,
    })) as UserWithPassword | null;

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await this.passwordService.verify(
      user.passwordHash,
      dto.password,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.toAuthUser(user);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toAuthUser(user: UserWithPassword): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
