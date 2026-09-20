import { PickType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.js';

// 复用创建用户的校验规则，并将所有字段变为可选，用于 PATCH 更新。
export class UpdateUserDto extends PartialType(
  PickType(CreateUserDto, ['name', 'email'] as const),
) {}
