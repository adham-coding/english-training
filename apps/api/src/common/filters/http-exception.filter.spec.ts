import { BadRequestException, HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';

import { HttpExceptionFilter } from './http-exception.filter.js';

describe('HttpExceptionFilter', () => {
  it('should return a normalized HTTP exception response', () => {
    const filter = new HttpExceptionFilter();

    const request = {
      originalUrl: '/api/v1/test',
      method: 'POST',
    };

    const response = {
      getHeader: (name: string) => {
        if (name === 'x-request-id') {
          return 'req-123';
        }

        return undefined;
      },
      status: (statusCode: number) => {
        expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
        return response;
      },
      json: (body: unknown) => {
        expect(body).toMatchObject({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Invalid input',
          path: '/api/v1/test',
          method: 'POST',
          requestId: 'req-123',
        });

        expect(body).toHaveProperty('timestamp');
      },
    };

    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    filter.catch(new BadRequestException('Invalid input'), host as never);
  });

  it('should return a generic response for an unknown exception', () => {
    const filter = new HttpExceptionFilter();

    const request = {
      originalUrl: '/api/v1/test',
      method: 'GET',
    };

    const response = {
      getHeader: () => undefined,
      status: (statusCode: number) => {
        expect(statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        return response;
      },
      json: (body: unknown) => {
        expect(body).toMatchObject({
          success: false,
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          path: '/api/v1/test',
          method: 'GET',
        });

        expect(body).toHaveProperty('timestamp');
      },
    };

    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    filter.catch(new Error('database exploded'), host as never);
  });

  it('should preserve validation error messages as an array', () => {
    const filter = new HttpExceptionFilter();

    const request = {
      originalUrl: '/api/v1/auth/register',
      method: 'POST',
    };

    const response = {
      getHeader: () => undefined,
      status: (statusCode: number) => {
        expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
        return response;
      },
      json: (body: unknown) => {
        expect(body).toMatchObject({
          success: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['email must be an email', 'password is too short'],
          path: '/api/v1/auth/register',
          method: 'POST',
        });

        expect(body).toHaveProperty('timestamp');
      },
    };

    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    filter.catch(
      new BadRequestException([
        'email must be an email',
        'password is too short',
      ]),
      host as never,
    );
  });
});
