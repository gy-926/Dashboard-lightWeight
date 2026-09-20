import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './users/users.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { FilesModule } from './files/files.module.js';

@Module({
  // 导入按业务拆分的功能模块。
  imports: [
    // 读取本机 .env；ConfigModule 设为全局后，各功能模块都能注入 ConfigService。
    ConfigModule.forRoot({ isGlobal: true }),
    // 数据库连接信息只来自环境变量，避免将凭据写入源码。
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(configService.get<string>('DB_PORT', '3306')),
        username: configService.getOrThrow<string>('DB_USER'),
        password: configService.getOrThrow<string>('DB_PASSWORD'),
        database: configService.getOrThrow<string>('DB_NAME'),
        autoLoadEntities: true,
        // 学习环境中也保持关闭；通过迁移显式管理表结构，避免启动应用时改动数据库。
        synchronize: false,
      }),
    }),
    UsersModule,
    AuthModule,
    DashboardModule,
    FilesModule,
  ],
  // 注册处理根路径请求的控制器。
  controllers: [AppController],
  // 注册根模块提供的业务服务。
  providers: [AppService],
})
// Nest 应用的根模块：负责组合其他模块。
export class AppModule {}
