import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';
import { UserRole } from './entities/user.entity.js';

@Controller('users')
export class UsersController {
  // Nest 注入 UsersService；Controller 只负责 HTTP 层，不直接处理业务数据。
  constructor(private readonly usersService: UsersService) {}

  // 匹配 POST /users。Body 会先按 CreateUserDto 经过全局校验。
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body.name, body.email, body.password);
  }

  // 匹配 GET /users，并读取搜索、分页和排序查询参数。
  @Get()
  @UseGuards(AccessTokenGuard)
  findAll(
    // 全局 ValidationPipe 会按 QueryUsersDto 转换与校验查询参数。
    @Query() query: QueryUsersDto,
    @Req() request: AuthenticatedRequest,
  ) {
    // Controller 不计算分页，只把查询条件交给 Service。
    return this.usersService.findAll(query, {
      userId: request.authUserId,
      role: request.authRole,
    });
  }

  // 匹配 GET /users/:id；ParseUUIDPipe 会在进入 Service 前验证 UUID 格式。
  @Get(':id')
  @UseGuards(AccessTokenGuard)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (id !== request.authUserId && request.authRole !== UserRole.SuperAdmin) {
      throw new ForbiddenException('不能查看其他用户');
    }
    return this.usersService.findOne(id);
  }

  // 匹配 PATCH /users/:id；ParseUUIDPipe 会在进入 Service 前验证 UUID 格式。
  // Body 会先按 UpdateUserDto 经过全局校验。
  @Patch(':id')
  @UseGuards(AccessTokenGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwner(id, request);
    return this.usersService.update(id, body);
  }

  // 匹配 DELETE /users/:id；ParseUUIDPipe 会在进入 Service 前验证 UUID 格式。
  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    this.assertOwner(id, request);
    return this.usersService.remove(id);
  }

  private assertOwner(id: string, request: AuthenticatedRequest): void {
    if (id !== request.authUserId) {
      throw new ForbiddenException('只能操作自己的账号');
    }
  }
}
