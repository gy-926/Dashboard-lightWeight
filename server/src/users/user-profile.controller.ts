import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  AccessTokenGuard,
  type AuthenticatedRequest,
} from '../auth/access-token.guard.js';
import type { UploadedFile as Upload } from '../files/files.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserProfileService } from './user-profile.service.js';

@Controller('users/me')
@UseGuards(AccessTokenGuard)
export class UserProfileController {
  constructor(private readonly profile: UserProfileService) {}

  @Get()
  get(@Req() request: AuthenticatedRequest) {
    return this.profile.get(request.authUserId);
  }

  @Patch()
  update(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.profile.updateName(request.authUserId, body.name);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: 2 * 1024 * 1024 },
    }),
  )
  upload(@Req() request: AuthenticatedRequest, @UploadedFile() file?: Upload) {
    return this.profile.updateAvatar(request.authUserId, file);
  }

  @Get('avatar')
  async avatar(
    @Req() request: AuthenticatedRequest,
    @Res() response: Response,
  ) {
    const { file, stream } = await this.profile.avatar(request.authUserId);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', String(file.size));
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    stream.on('error', (error) => response.destroy(error));
    stream.pipe(response);
  }
}
