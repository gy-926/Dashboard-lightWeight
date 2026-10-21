import {
  BadRequestException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilesService, type UploadedFile } from '../files/files.service.js';
import { User, UserRole } from './entities/user.entity.js';
import { toPublicUser } from './users.service.js';

function avatarMime(buffer: Buffer): string | undefined {
  if (
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    return 'image/png';
  if (
    buffer.length >= 3 &&
    buffer[0] === 255 &&
    buffer[1] === 216 &&
    buffer[2] === 255
  )
    return 'image/jpeg';
  if (['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii')))
    return 'image/gif';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  )
    return 'image/webp';
}

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly files: FilesService,
  ) {}

  private async user(userId: string): Promise<User> {
    const user = await this.users.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async get(userId: string) {
    return toPublicUser(await this.user(userId));
  }

  async updateName(userId: string, name: string) {
    const result = await this.users.update(userId, {
      name,
      updatedAt: new Date(),
    });
    if (!result.affected) throw new NotFoundException('用户不存在');
    return this.get(userId);
  }

  async updateAvatar(userId: string, upload?: UploadedFile) {
    await this.user(userId);
    if (!upload?.buffer?.length)
      throw new BadRequestException('请选择头像图片');
    if (upload.buffer.length > 2 * 1024 * 1024)
      throw new PayloadTooLargeException('头像不能超过 2MB');
    const mime = avatarMime(upload.buffer);
    if (!mime)
      throw new BadRequestException('头像仅支持 PNG、JPEG、GIF 或 WebP 图片');
    const file = await this.files.store(userId, {
      ...upload,
      mimetype: mime,
      size: upload.buffer.length,
    });
    try {
      const result = await this.users.update(userId, {
        avatarFileId: file.id,
        updatedAt: new Date(),
      });
      if (!result.affected) throw new NotFoundException('用户不存在');
    } catch (error) {
      await this.files.removeStored(file.id);
      throw error;
    }
    // 旧头像保留在用户文件存储中，用户可以自行删除；不影响其他文件引用。
    return this.get(userId);
  }

  async avatar(userId: string) {
    const user = await this.user(userId);
    if (!user.avatarFileId) throw new NotFoundException('尚未设置头像');
    // 即使是管理员，也只读取本人绑定且本人拥有的头像文件。
    return this.files.download(user.avatarFileId, userId, UserRole.User);
  }
}
