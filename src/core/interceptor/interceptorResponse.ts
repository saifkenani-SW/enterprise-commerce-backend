import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, any>; // تم التعديل لدعم إضافة المزيد من البيانات الوصفية لاحقاً
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  // 1. تهيئة مسجل السجلات الخاص بالصنف لتمييزه في موجه الأوامر (Console) أو أدوات التتبع
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    // استخراج معلومات الطلب لغرض التوثيق
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    const { method, url } = req;

    // 2. بدء القياس الدقيق للوقت
    const startTime = performance.now();

    return next.handle().pipe(
      map((res) => {
        // حساب الوقت المستغرق وتقريبه
        const executionTimeMs = Math.round(performance.now() - startTime);

        // تجهيز الاستجابة الأساسية بناءً على الشروط السابقة
        const baseResponse =
          res && typeof res === 'object' && 'data' in res
            ? { success: true, ...res }
            : { success: true, data: res };

        // 3. دمج الوقت المستغرق في الـ meta ليكون متاحاً لـ Client/Monitoring
        return {
          ...baseResponse,
          meta: {
            ...(baseResponse.meta || {}),
            executionTimeMs,
          },
        };
      }),
      // 4. استخدام tap للقيام بعملية التسجيل دون التدخل في هيكل البيانات الراجعة
      tap((finalResponse) => {
        const res = httpContext.getResponse();
        const statusCode = res.statusCode;
        const timeMs = finalResponse.meta?.executionTimeMs;

        // بناء رسالة سجل قياسية وموحدة (Standardized Log Format)
        this.logger.log(
          `[${method}] ${url} - Status: ${statusCode} - Time: ${timeMs}ms`,
        );
      }),
    );
  }
}
