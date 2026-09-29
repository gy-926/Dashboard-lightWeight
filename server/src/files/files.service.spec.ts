import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Repository } from 'typeorm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StoredFile } from './entities/stored-file.entity.js';
import { UserRole } from '../users/entities/user.entity.js';
import { FilesService } from './files.service.js';

describe('FilesService local availability', () => {
  const roots: string[] = [];

  afterEach(async () => {
    await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })));
  });

  it('checks the stored file and refuses to stream a missing one', async () => {
    const root = await mkdtemp(join(tmpdir(), 'umd-storage-'));
    roots.push(root);
    const file = { id: 'file-id', storedName: 'stored-id', size: 3 } as StoredFile;
    const repository = { findOneBy: vi.fn().mockResolvedValue(file) } as unknown as Repository<StoredFile>;
    const config = { get: vi.fn((key: string, fallback: string) => key === 'FILE_STORAGE_ROOT' ? root : fallback) } as unknown as ConfigService;
    const service = new FilesService(repository, config);

    expect(await service.isStoredFileAvailable(file.storedName, file.size)).toBe(false);
    await expect(service.openStored(file.id)).rejects.toBeInstanceOf(NotFoundException);

    await writeFile(join(root, file.storedName), 'abc');
    expect(await service.isStoredFileAvailable(file.storedName, file.size)).toBe(true);
    expect(await service.isStoredFileAvailable(file.storedName, file.size + 1)).toBe(false);
  });

  it('marks missing files in the list and refuses their download', async () => {
    const root = await mkdtemp(join(tmpdir(), 'umd-storage-'));
    roots.push(root);
    const file = { id: 'file-id', ownerUserId: 'user-id', storedName: 'missing-id', size: 3 } as StoredFile;
    const repository = {
      find: vi.fn().mockResolvedValue([file]),
      findOneBy: vi.fn().mockResolvedValue(file),
    } as unknown as Repository<StoredFile>;
    const config = { get: vi.fn((key: string, fallback: string) => key === 'FILE_STORAGE_ROOT' ? root : fallback) } as unknown as ConfigService;
    const service = new FilesService(repository, config);

    const [listed] = await service.list('user-id', UserRole.SuperAdmin);
    expect(listed.fileAvailable).toBe(false);
    await expect(service.download(file.id, 'user-id', UserRole.SuperAdmin)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes stale UMD version metadata when no function uses the file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'umd-storage-'));
    roots.push(root);
    const file = { id: 'file-id', ownerUserId: 'user-id', storedName: 'stored-id', size: 3 } as StoredFile;
    const manager = {
      query: vi.fn()
        .mockResolvedValueOnce([{ id: 'version-id', package_id: 'package-id' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    const repository = {
      findOneBy: vi.fn().mockResolvedValue(file),
      manager: { transaction: vi.fn(async callback => callback(manager)) },
    } as unknown as Repository<StoredFile>;
    const config = { get: vi.fn((key: string, fallback: string) => key === 'FILE_STORAGE_ROOT' ? root : fallback) } as unknown as ConfigService;
    const service = new FilesService(repository, config);

    await expect(service.remove(file.id, 'user-id', UserRole.SuperAdmin)).resolves.toBeNull();
    expect(manager.query).toHaveBeenCalledWith('DELETE FROM dashboard_umd_versions WHERE file_id = ?', [file.id]);
    expect(manager.delete).toHaveBeenCalledWith(StoredFile, file.id);
  });

  it('reports a conflict when a function actually loads the UMD file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'umd-storage-'));
    roots.push(root);
    const file = { id: 'file-id', ownerUserId: 'user-id', storedName: 'stored-id', size: 3 } as StoredFile;
    const manager = {
      query: vi.fn()
        .mockResolvedValueOnce([{ id: 'version-id', package_id: 'package-id' }])
        .mockResolvedValueOnce([{ kvid: 'function-id' }]),
      delete: vi.fn(),
    };
    const repository = {
      findOneBy: vi.fn().mockResolvedValue(file),
      manager: { transaction: vi.fn(async callback => callback(manager)) },
    } as unknown as Repository<StoredFile>;
    const config = { get: vi.fn((key: string, fallback: string) => key === 'FILE_STORAGE_ROOT' ? root : fallback) } as unknown as ConfigService;
    const service = new FilesService(repository, config);

    await expect(service.remove(file.id, 'user-id', UserRole.SuperAdmin))
      .rejects.toThrow(new ConflictException('文件正在被功能模块使用，无法删除'));
    expect(manager.delete).not.toHaveBeenCalled();
  });
});
