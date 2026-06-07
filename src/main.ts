import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './core/interceptor/interceptorResponse';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  app.useGlobalInterceptors(new TransformInterceptor());
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
