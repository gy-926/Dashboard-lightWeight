import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthSession } from '../auth/entities/auth-session.entity.js';
import { User } from './entities/user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  // 在 UsersModule 中注册 User Entity，使其能注入 Repository<User>。
  imports: [TypeOrmModule.forFeature([User, AuthSession])],
  // /users 相关 HTTP 请求由它处理。
  controllers: [UsersController],
  // 用户相关业务规则由它处理，并可被 Controller 注入。
  providers: [UsersService],
})
// 用户业务模块：把用户 Controller 与 Service 组织在一起。
export class UsersModule {}
