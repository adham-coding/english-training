import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: string;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  familyId: string;
  type: 'refresh';
};

@Injectable()
export class JwtService {
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor(private readonly configService: ConfigService) {
    this.accessSecret = new TextEncoder().encode(
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    );

    this.refreshSecret = new TextEncoder().encode(
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    );
  }

  async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return new SignJWT({
      email: payload.email,
      role: payload.role,
      type: 'access',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(payload.sub)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(this.accessSecret);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const { payload } = await jwtVerify(token, this.accessSecret, {
      algorithms: ['HS256'],
    });

    return this.parseAccessPayload(payload);
  }

  async signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return new SignJWT({
      familyId: payload.familyId,
      type: payload.type,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(payload.sub)
      .setJti(payload.jti)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(this.refreshSecret);
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const { payload } = await jwtVerify(token, this.refreshSecret, {
      algorithms: ['HS256'],
    });

    return this.parseRefreshPayload(payload);
  }

  private parseAccessPayload(payload: JWTPayload): AccessTokenPayload {
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.role !== 'string' ||
      payload.type !== 'access'
    ) {
      throw new Error('Invalid access token payload');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

  private parseRefreshPayload(payload: JWTPayload): RefreshTokenPayload {
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string' ||
      typeof payload.familyId !== 'string' ||
      payload.type !== 'refresh'
    ) {
      throw new Error('Invalid refresh token payload');
    }

    return {
      sub: payload.sub,
      jti: payload.jti,
      familyId: payload.familyId,
      type: 'refresh',
    };
  }
}
