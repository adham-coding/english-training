import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login/login.js';
import { RegisterDto } from './dto/register/register.js';
import {
  AccessTokenGuard,
  type AuthenticatedRequest,
} from './guards/access-token/access-token.guard.js';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.authService.login(dto);

    response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });

    const { refreshToken: _refreshToken, ...publicSession } = session;

    return publicSession;
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: import('express').Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.extractCookie(request, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const session = await this.authService.refresh(refreshToken);

    response.cookie(REFRESH_COOKIE_NAME, session.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });

    const { refreshToken: _refreshToken, ...publicSession } = session;

    return publicSession;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: import('express').Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const refreshToken = this.extractCookie(request, REFRESH_COOKIE_NAME);

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.user.sub);
  }
  private extractCookie(
    request: import('express').Request,
    name: string,
  ): string | null {
    const header = request.headers.cookie;

    if (!header) {
      return null;
    }

    for (const part of header.split(';')) {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex === -1) {
        continue;
      }

      const key = part.slice(0, separatorIndex).trim();

      if (key !== name) {
        continue;
      }

      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }

    return null;
  }
}
