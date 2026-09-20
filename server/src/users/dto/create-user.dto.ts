import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../../auth/password-policy.js';

export class CreateUserDto {
  // name 必须是非空字符串。
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  // email 必须符合邮箱格式。
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;
}
