import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { AppError } from '../exceptions/AppError';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // check if the exception is an instance of appError
    if (exception instanceof AppError) {
      response.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        message: exception.message,
        errorCode: exception.errorCode,
        details: exception.details,
      });
    } else if (exception instanceof HttpException) {

      // handle exceptions that are already HttpExceptions
      const status = exception.getStatus();
      const message = exception.getResponse(); // captures detailed response for the HttpException
      response.status(status).json({ statusCode: status, message });
    } else {

      // fallback for any other unhandled exceptions
      response.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
      });
    }
  }
}
