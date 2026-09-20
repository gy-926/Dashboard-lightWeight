import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { AuthSession } from '../auth/entities/auth-session.entity.js';
import { User } from '../users/entities/user.entity.js';
import { StoredFile } from './entities/stored-file.entity.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([StoredFile, AuthSession, User]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: { files: 1, fileSize: Number(config.get('FILE_MAX_SIZE_BYTES', 50 * 1024 * 1024)) },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
