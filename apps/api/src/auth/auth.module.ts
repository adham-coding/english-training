import { Module } from '@nestjs/common';

import { AccessTokenGuard } from './guards/access-token/access-token.guard.js';
import { RolesGuard } from './guards/roles/roles.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtService } from './jwt/jwt.js';
import { PasswordService } from './password/password.js';
import { RedisService } from './redis/redis.js';
import { RefreshSessionService } from './refresh-session/refresh-session.js';

@Module({
  controllers: [AuthController],
  providers: [
    AccessTokenGuard,
    RolesGuard,
    AuthService,
    JwtService,
    PasswordService,
    RefreshSessionService,
    RedisService,
  ],
  exports: [
    AccessTokenGuard,
    RolesGuard,
    JwtService,
    PasswordService,
    RedisService,
    RefreshSessionService,
  ],
})
export class AuthModule {}
