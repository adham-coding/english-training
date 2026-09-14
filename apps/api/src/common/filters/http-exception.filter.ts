import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponseBody {
  success: false;
  statusCode: number;
  message: string | string[];
  path: string;
  method: string;
  requestId?: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    let message: string | string[] = 'Internal server error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const value = (exceptionResponse as { message?: unknown }).message;

      if (typeof value === 'string' || Array.isArray(value)) {
        message = value as string | string[];
      }
    }

    const requestId = response.getHeader('x-request-id');

    const body: ErrorResponseBody = {
      success: false,
      statusCode: status,
      message,
      path: request.originalUrl,
      method: request.method,
      requestId: typeof requestId === 'string' ? requestId : undefined,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
