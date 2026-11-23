import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:8081,http://127.0.0.1:8081,http://172.20.10.13:8081'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Accept', 'Authorization', 'Content-Type'],
  });
  await app.listen(process.env.PORT ?? 3000, process.env.HOST ?? '0.0.0.0');
}
await bootstrap();
