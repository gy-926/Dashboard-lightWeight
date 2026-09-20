import { IsString, Matches } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from '../password-policy.js';

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
