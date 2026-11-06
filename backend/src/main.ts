import 'reflect-metadata';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureDns } from './config/dns';

config({ path: '.env' });

async function bootstrap(): Promise<void> {
  configureDns();
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000', methods: ['GET', 'POST'], credentials: false });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.listen(Number(process.env.PORT ?? 8000));
}
void bootstrap();
