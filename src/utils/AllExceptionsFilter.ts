import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { AppError } from './AppError';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof AppError) {
      response.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        message: exception.message,
        errorCode: exception.errorCode,
        details: exception.details,
      });
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();
      response.status(status).json({ statusCode: status, message });
    } else {
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
