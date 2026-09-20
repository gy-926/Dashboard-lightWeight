import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { AuthSession } from '../auth/entities/auth-session.entity.js';
import { User } from '../users/entities/user.entity.js';
import { FilesModule } from '../files/files.module.js';
import { DashboardAdminController, DashboardAssetsController, DashboardFunctionsController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    AuthModule,
    FilesModule,
    TypeOrmModule.forFeature([AuthSession, User]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: { files: 1, fileSize: Number(config.get('FILE_MAX_SIZE_BYTES', 50 * 1024 * 1024)) },
      }),
    }),
  ],
  controllers: [DashboardAdminController, DashboardFunctionsController, DashboardAssetsController],
  providers: [DashboardService],
})
export class DashboardModule {}
