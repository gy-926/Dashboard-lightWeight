import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AccessTokenGuard, type AuthenticatedRequest } from '../auth/access-token.guard.js';
import { FilesService, type UploadedFile as Upload } from './files.service.js';

function contentDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_') || 'download';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

@Controller('files')
@UseGuards(AccessTokenGuard)
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(@Req() request: AuthenticatedRequest, @UploadedFile() file?: Upload) {
    return this.files.store(request.authUserId, file);
  }

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.files.list(request.authUserId, request.authRole);
  }

  @Get(':id/download')
  async download(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ) {
    const { file, stream } = await this.files.download(id, request.authUserId, request.authRole);
    response.setHeader('Content-Type', file.mimeType);
    response.setHeader('Content-Length', String(file.size));
    response.setHeader('Content-Disposition', contentDisposition(file.originalName));
    response.setHeader('X-Content-Type-Options', 'nosniff');
    stream.on('error', error => response.destroy(error));
    stream.pipe(response);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.files.remove(id, request.authUserId, request.authRole);
  }
}
