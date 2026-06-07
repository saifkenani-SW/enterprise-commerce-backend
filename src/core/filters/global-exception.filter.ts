import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

// 1. تحديث الواجهة لتشمل meta
export interface StandardErrorResponse {
  success: false;
  errorType: string;
  message: string;
  meta?: Record<string, any>;
  details?: unknown;
  devDetails?: unknown;
}

// 2. تحديث واجهة الطلب لتشمل وقت البداية القادم من الـ Middleware
interface AuthenticatedRequest extends Request {
  id?: string;
  user?: { id: string };
  startTime?: number;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<AuthenticatedRequest>();

    const requestId =
      request.id ||
      (request.headers['x-request-id'] as string) ||
      'UNKNOWN_REQUEST_ID';
    const method = request.method;
    const url = request.url;
    const actor = request.user?.id || 'ANONYMOUS';

    // 3. حساب الوقت المستغرق بدقة
    const startTime = request.startTime || performance.now();
    const executionTimeMs = Math.round(performance.now() - startTime);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'عذراً، حدث خطأ داخلي غير متوقع في الخادم';
    let errorType = 'INTERNAL_SERVER_ERROR';

    // 1. NestJS & Class-Validator & Custom Business Errors
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = exceptionResponse.message || exception.message;
        errorType =
          exceptionResponse.errorType ||
          exceptionResponse.error ||
          exception.name;
      } else {
        message = exception.message;
        errorType = exception.name;
      }

      if (Array.isArray(message)) {
        errorType = 'VALIDATION_ERROR';
      } else {
        const translatedMessage = this.translateHttpError(
          status,
          message as string,
        );
        if (translatedMessage) message = translatedMessage;
      }

      const logMsg = `[${requestId}] HTTP ${status} [${errorType}]: ${method} ${url} - Actor: ${actor}`;
      if (status >= 500) {
        this.logger.error(logMsg, (exception as Error).stack);
      } else {
        this.logger.warn(logMsg);
      }
    }
    // 2. TypeORM Errors
    else if (exception instanceof QueryFailedError) {
      errorType = 'DATABASE_ERROR';
      const driverError = (exception as any).driverError;
      const errorCode = driverError?.code || driverError?.errno;

      if (errorCode === '23505' || errorCode === 1062) {
        status = HttpStatus.CONFLICT;
        errorType = 'DATABASE_UNIQUE_CONFLICT';
        message = 'البيانات المدخلة موجودة بالفعل ولا يمكن تكرارها';
      } else if (errorCode === '23503' || errorCode === 1452) {
        status = HttpStatus.BAD_REQUEST;
        errorType = 'DATABASE_FOREIGN_KEY_FAILED';
        message = 'بعض البيانات المرتبطة غير موجودة أو غير صالحة';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'حدث خطأ غير متوقع أثناء معالجة البيانات';
      }

      this.logger.error(
        `[${requestId}] TypeORM Query Error [${errorCode}]: ${exception.message}`,
        exception.stack,
      );
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      errorType = 'DATABASE_RECORD_NOT_FOUND';
      message = 'السجل المطلوب غير موجود';

      this.logger.warn(
        `[${requestId}] TypeORM Entity Not Found: ${method} ${url}`,
      );
    }
    // 3. Unhandled/Critical Errors
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'نعتذر، حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً';
      errorType = 'CRITICAL_SYSTEM_CRASH';

      this.logger.fatal
        ? this.logger.fatal(
            `[${requestId}] 💥 Critical System Crash: ${method} ${url}`,
            (exception as Error)?.stack,
          )
        : this.logger.error(
            `[${requestId}] 💥 Critical System Crash: ${method} ${url}`,
            (exception as Error)?.stack,
          );
    }

    const finalMessage = Array.isArray(message) ? message[0] : message;

    // 4. بناء الاستجابة وتضمين الـ meta
    const responseBody: StandardErrorResponse = {
      success: false,
      errorType,
      message: finalMessage,
      meta: {
        executionTimeMs,
      },
      details: Array.isArray(message) ? message : undefined,
    };

    if (process.env.NODE_ENV !== 'production' && status >= 500) {
      const err = exception as Error;
      responseBody.devDetails = {
        message: err?.message || String(exception),
        stack: err?.stack?.split('\n').slice(0, 5),
        errorName: err?.name,
      };
    }

    response.setHeader('X-Request-Id', String(requestId));
    response.status(status).json(responseBody);
  }

  private translateHttpError(status: number, message: string): string | null {
    if (/[\u0600-\u06FF]/.test(message)) return null;

    const translations: Record<number, Record<string, string>> = {
      400: { 'bad request': 'طلب غير صالح', 'validation failed': 'فشل التحقق' },
      401: { unauthorized: 'غير مصرح - يرجى تسجيل الدخول' },
      403: { forbidden: 'محظور - ليس لديك صلاحية' },
      404: { 'not found': 'المورد المطلوب غير موجود' },
    };

    const statusTranslations = translations[status];
    if (!statusTranslations) return null;

    const lowerMessage = message.toLowerCase();
    for (const [key, value] of Object.entries(statusTranslations)) {
      if (lowerMessage.includes(key)) return value;
    }

    return Object.values(statusTranslations)[0] || null;
  }
}
