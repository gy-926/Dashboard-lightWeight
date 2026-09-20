import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync, readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';

async function bootstrap() {
  // HTTPS 选项在 Nest 初始化前读取，因此先加载本地 .env。
  if (existsSync('.env')) loadEnvFile('.env');
  const isProduction = process.env.NODE_ENV === 'production';
  if (
    isProduction &&
    (!process.env.HTTPS_KEY_PATH || !process.env.HTTPS_CERT_PATH)
  ) {
    throw new Error('生产环境必须配置 HTTPS_KEY_PATH 和 HTTPS_CERT_PATH');
  }
  const httpsOptions = isProduction
    ? {
        key: readFileSync(process.env.HTTPS_KEY_PATH!),
        cert: readFileSync(process.env.HTTPS_CERT_PATH!),
      }
    : undefined;
  // 创建 Nest 应用；AppModule 是所有功能模块的根入口。
  const app = await NestFactory.create(AppModule, { httpsOptions });
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN?.split(',').map(value => value.trim()) ?? ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });
  if (isProduction) {
    app.use((_request: Request, response: Response, next: NextFunction) => {
      response.setHeader('Strict-Transport-Security', 'max-age=31536000');
      next();
    });
  }

  // 为所有请求启用统一的 DTO 校验规则。
  app.useGlobalPipes(
    new ValidationPipe({
      // 自动移除 DTO 中未声明的字段。
      whitelist: true,
      // 如果请求包含未声明字段，直接返回 400，而不只是移除它。
      forbidNonWhitelisted: true,
      // 尝试将 URL 参数等输入转换成对应的 TypeScript 类型。
      transform: true,
    }),
  );
  // 为所有成功响应启用统一的 JSON 格式。
  app.useGlobalInterceptors(new TransformInterceptor());

  // 为所有异常响应启用统一的 JSON 格式。
  app.useGlobalFilters(new HttpExceptionFilter());

  // 优先使用环境变量 PORT；本地默认监听 3000 端口。
  await app.listen(
    process.env.PORT ?? 3000,
    process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1'),
  );
}

// 启动应用。
bootstrap();
