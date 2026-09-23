import { BadRequestException, ForbiddenException, Injectable, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { Repository } from 'typeorm';
import { UserRole } from '../users/entities/user.entity.js';
import { StoredFile } from './entities/stored-file.entity.js';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface PublicStoredFile {
  id: string;
  ownerUserId: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  createdAt: Date;
  downloadUrl: string;
  fileAvailable: boolean;
}

function positiveInteger(config: ConfigService, key: string, fallback: number): number {
  const value = Number(config.get<string>(key, String(fallback)));
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

function decodeUploadName(value: string): string {
  const decoded = Buffer.from(value, 'latin1').toString('utf8');
  return decoded.includes('\uFFFD') ? value : decoded;
}

@Injectable()
export class FilesService {
  private readonly root: string;
  private readonly maxFileSize: number;
  private readonly userQuota: number;

  constructor(
    @InjectRepository(StoredFile) private readonly files: Repository<StoredFile>,
    config: ConfigService,
  ) {
    this.root = resolve(config.get<string>('FILE_STORAGE_ROOT', './storage'));
    this.maxFileSize = positiveInteger(config, 'FILE_MAX_SIZE_BYTES', 50 * 1024 * 1024);
    this.userQuota = positiveInteger(config, 'FILE_USER_QUOTA_BYTES', 1024 * 1024 * 1024);
  }

  private publicFile(file: StoredFile, fileAvailable = true): PublicStoredFile {
    return {
      id: file.id,
      ownerUserId: file.ownerUserId,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      sha256: file.sha256,
      createdAt: file.createdAt,
      downloadUrl: `/files/${file.id}/download`,
      fileAvailable,
    };
  }

  private path(storedName: string): string {
    return resolve(this.root, storedName);
  }

  async isStoredFileAvailable(storedName: string, expectedSize: number): Promise<boolean> {
    try {
      const file = await stat(this.path(storedName));
      return file.isFile() && file.size === expectedSize;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }

  async store(userId: string, upload?: UploadedFile): Promise<PublicStoredFile> {
    if (!upload || !upload.buffer?.length) throw new BadRequestException('请选择要上传的文件');
    if (upload.size > this.maxFileSize) throw new PayloadTooLargeException(`单文件不能超过 ${this.maxFileSize} 字节`);
    const rawName = basename(decodeUploadName(upload.originalname).normalize('NFC')).trim();
    const originalName = rawName.slice(0, 255);
    if (!originalName) throw new BadRequestException('文件名不能为空');

    const quota = await this.files
      .createQueryBuilder('file')
      .select('COALESCE(SUM(file.size), 0)', 'used')
      .where('file.ownerUserId = :userId', { userId })
      .getRawOne<{ used: string }>();
    if (Number(quota?.used ?? 0) + upload.size > this.userQuota) {
      throw new PayloadTooLargeException(`用户文件总量不能超过 ${this.userQuota} 字节`);
    }

    await mkdir(this.root, { recursive: true });
    const storedName = randomUUID();
    const destination = this.path(storedName);
    const temporary = `${destination}.uploading`;
    await writeFile(temporary, upload.buffer, { flag: 'wx', mode: 0o600 });
    await rename(temporary, destination);

    try {
      const saved = await this.files.save(
        this.files.create({
          ownerUserId: userId,
          originalName,
          storedName,
          mimeType: upload.mimetype || 'application/octet-stream',
          size: upload.size,
          sha256: createHash('sha256').update(upload.buffer).digest('hex'),
        }),
      );
      return this.publicFile(saved);
    } catch (error) {
      await unlink(destination).catch(() => undefined);
      throw error;
    }
  }

  async list(userId: string, role: UserRole): Promise<PublicStoredFile[]> {
    const where = role === UserRole.SuperAdmin ? {} : { ownerUserId: userId };
    const files = await this.files.find({ where, order: { createdAt: 'DESC' } });
    return Promise.all(files.map(async file =>
      this.publicFile(file, await this.isStoredFileAvailable(file.storedName, file.size))
    ));
  }

  private async authorized(id: string, userId: string, role: UserRole): Promise<StoredFile> {
    const file = await this.files.findOneBy({ id });
    if (!file) throw new NotFoundException('文件不存在');
    if (file.ownerUserId !== userId && role !== UserRole.SuperAdmin) {
      throw new ForbiddenException('不能访问其他用户的文件');
    }
    return file;
  }

  async download(id: string, userId: string, role: UserRole) {
    const file = await this.authorized(id, userId, role);
    if (!(await this.isStoredFileAvailable(file.storedName, file.size))) {
      throw new NotFoundException('文件记录存在，但本地文件缺失或大小不匹配');
    }
    return { file: this.publicFile(file), stream: createReadStream(this.path(file.storedName)) };
  }

  async remove(id: string, userId: string, role: UserRole): Promise<null> {
    const file = await this.authorized(id, userId, role);
    await this.files.remove(file);
    await unlink(this.path(file.storedName)).catch(() => undefined);
    return null;
  }

  async openStored(id: string) {
    const file = await this.files.findOneBy({ id });
    if (!file) throw new NotFoundException('文件不存在');
    if (!(await this.isStoredFileAvailable(file.storedName, file.size))) {
      throw new NotFoundException('文件记录存在，但本地文件缺失或大小不匹配');
    }
    return { file: this.publicFile(file), stream: createReadStream(this.path(file.storedName)) };
  }

  async removeStored(id: string): Promise<void> {
    const file = await this.files.findOneBy({ id });
    if (!file) return;
    await this.files.remove(file);
    await unlink(this.path(file.storedName)).catch(() => undefined);
  }
}
