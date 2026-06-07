import { NestFactory } from "@nestjs/core";
import { AppModule } from "src/app.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('Worker started');
}
bootstrap();