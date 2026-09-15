import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let email: string;
  let accessToken: string;
  let refreshCookie: string;

  const password = 'Correct-Horse-Battery-Staple-123!';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('/api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        forbidUnknownValues: true,
      }),
    );

    await app.init();

    email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  });

  afterAll(async () => {
    await app.close();
  });

  function getSetCookieHeaders(headers: Record<string, unknown>): string[] {
    const value = headers['set-cookie'];

    if (Array.isArray(value)) {
      return value.filter(
        (cookie): cookie is string => typeof cookie === 'string',
      );
    }

    if (typeof value === 'string') {
      return [value];
    }

    return [];
  }

  function getRefreshCookie(headers: Record<string, unknown>): string {
    const cookies = getSetCookieHeaders(headers);
    const cookie = cookies.find((value) => value.startsWith('refresh_token='));

    if (!cookie) {
      throw new Error('refresh_token cookie was not returned');
    }

    return cookie.split(';')[0];
  }

  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
        firstName: 'E2E',
        lastName: 'User',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      email,
      firstName: 'E2E',
      lastName: 'User',
      role: 'USER',
      isActive: true,
    });

    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('should reject duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email,
        password,
      })
      .expect(409);
  });

  it('should reject invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        unexpectedField: 'must-be-rejected',
      })
      .expect(400);
  });

  it('should login and return an access token without exposing the refresh token', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    expect(response.body).toMatchObject({
      email,
      role: 'USER',
      isActive: true,
    });

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.accessToken.length).toBeGreaterThan(20);
    expect(response.body).not.toHaveProperty('refreshToken');

    accessToken = response.body.accessToken;

    const setCookie = getSetCookieHeaders(
      response.headers as Record<string, unknown>,
    );

    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie.some((cookie) => cookie.includes('refresh_token='))).toBe(
      true,
    );
    expect(setCookie.some((cookie) => /HttpOnly/i.test(cookie))).toBe(true);
    expect(
      setCookie.some((cookie) => /Path=\/api\/v1\/auth/i.test(cookie)),
    ).toBe(true);

    refreshCookie = getRefreshCookie(
      response.headers as Record<string, unknown>,
    );
  });

  it('should return the current user with a valid access token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      email,
      firstName: 'E2E',
      lastName: 'User',
      role: 'USER',
      isActive: true,
    });

    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('should reject /me without an access token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('should reject /me with an invalid access token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should refresh using the HttpOnly refresh cookie', async () => {
    const oldCookie = refreshCookie;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      email,
      role: 'USER',
      isActive: true,
    });

    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.accessToken).not.toBe(accessToken);
    expect(response.body).not.toHaveProperty('refreshToken');

    const setCookie = getSetCookieHeaders(
      response.headers as Record<string, unknown>,
    );

    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie.some((cookie) => cookie.includes('refresh_token='))).toBe(
      true,
    );
    expect(setCookie.some((cookie) => /HttpOnly/i.test(cookie))).toBe(true);

    refreshCookie = getRefreshCookie(
      response.headers as Record<string, unknown>,
    );
    accessToken = response.body.accessToken;
  });

  it('should reject reuse of the rotated refresh token', async () => {
    const oldCookie = refreshCookie;

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie);

    expect(response.status).toBe(200);

    const nextCookie = getRefreshCookie(
      response.headers as Record<string, unknown>,
    );

    expect(nextCookie).not.toBe(oldCookie);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', oldCookie)
      .expect(401);

    refreshCookie = nextCookie;
    accessToken = response.body.accessToken;
  });

  it('should reject refresh without a cookie', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401);
  });

  it('should logout and revoke the refresh-token family', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    const logoutCookie = getRefreshCookie(
      loginResponse.headers as Record<string, unknown>,
    );

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', logoutCookie)
      .expect(204);

    const setCookie = getSetCookieHeaders(
      logoutResponse.headers as Record<string, unknown>,
    );

    expect(setCookie.some((cookie) => /refresh_token=;/i.test(cookie))).toBe(
      true,
    );

    expect(setCookie.some((cookie) => /HttpOnly/i.test(cookie))).toBe(true);

    expect(
      setCookie.some((cookie) => /Path=\/api\/v1\/auth/i.test(cookie)),
    ).toBe(true);

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', logoutCookie)
      .expect(401);
  });

  it('should reject invalid login credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'Wrong-Password-123!',
      })
      .expect(401);
  });

  it('should throttle repeated login attempts', async () => {
    const throttleModuleFixture: TestingModule = await Test.createTestingModule(
      {
        imports: [AppModule],
      },
    ).compile();

    const throttleApp = throttleModuleFixture.createNestApplication();

    throttleApp.setGlobalPrefix('/api/v1');

    throttleApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        forbidUnknownValues: true,
      }),
    );

    await throttleApp.init();

    try {
      const statuses: number[] = [];
      const uniquePrefix = `throttle-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      for (let index = 0; index < 6; index += 1) {
        const response = await request(throttleApp.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: `${uniquePrefix}-${index}@example.com`,
            password: 'Wrong-Password-123!',
          });

        statuses.push(response.status);
      }

      expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
    } finally {
      await throttleApp.close();
    }
  });
});
