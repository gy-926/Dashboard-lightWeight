import { Repository } from 'typeorm';
import { FilesService } from '../files/files.service.js';
import { User, UserRole } from './entities/user.entity.js';
import { UserProfileService } from './user-profile.service.js';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=',
  'base64',
);

function setup() {
  const user = {
    id: 'alice',
    name: 'Alice',
    email: 'alice@example.test',
    role: UserRole.User,
    avatarFileId: null,
    passwordHash: 'secret',
  } as User;
  const users = {
    findOneBy: vi
      .fn()
      .mockImplementation(async ({ id }: { id: string }) =>
        id === user.id ? user : null,
      ),
    update: vi
      .fn()
      .mockImplementation(async (_id: string, patch: Partial<User>) => {
        Object.assign(user, patch);
        return { affected: 1 };
      }),
  };
  const files = {
    store: vi.fn().mockResolvedValue({ id: 'new-avatar' }),
    download: vi.fn().mockResolvedValue({ file: {}, stream: {} }),
    removeStored: vi.fn().mockResolvedValue(undefined),
  };
  return {
    user,
    users,
    files,
    service: new UserProfileService(
      users as unknown as Repository<User>,
      files as unknown as FilesService,
    ),
  };
}

describe('current user profile', () => {
  it('exposes public profile fields without credentials', async () => {
    const { service } = setup();
    const profile = await service.get('alice');
    expect(profile).toMatchObject({
      id: 'alice',
      name: 'Alice',
      avatarFileId: null,
    });
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('updates only the display name without overwriting avatar or role', async () => {
    const { service, users } = setup();
    expect(await service.updateName('alice', '张三')).toMatchObject({
      name: '张三',
      role: 'user',
    });
    expect(users.update).toHaveBeenCalledWith('alice', {
      name: '张三',
      updatedAt: expect.any(Date),
    });
  });

  it('stores the actual image type and persists the file binding', async () => {
    const { service, files, users } = setup();
    expect(
      await service.updateAvatar('alice', {
        buffer: png,
        mimetype: 'text/plain',
        originalname: 'avatar.png',
        size: png.length,
      }),
    ).toMatchObject({ avatarFileId: 'new-avatar' });
    expect(files.store).toHaveBeenCalledWith(
      'alice',
      expect.objectContaining({ mimetype: 'image/png', size: png.length }),
    );
    expect(users.update).toHaveBeenCalledWith('alice', {
      avatarFileId: 'new-avatar',
      updatedAt: expect.any(Date),
    });
  });

  it('rejects missing images, SVG content disguised as PNG and oversized uploads', async () => {
    const { service, files } = setup();
    await expect(service.updateAvatar('alice')).rejects.toThrow('请选择');
    await expect(
      service.updateAvatar('alice', {
        buffer: Buffer.from('<svg/>'),
        mimetype: 'image/png',
        originalname: 'fake.png',
        size: 6,
      }),
    ).rejects.toThrow('仅支持');
    await expect(
      service.updateAvatar('alice', {
        buffer: Buffer.alloc(2 * 1024 * 1024 + 1),
        mimetype: 'image/png',
        originalname: 'huge.png',
        size: 2 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow('2MB');
    expect(files.store).not.toHaveBeenCalled();
  });

  it('cleans up the newly stored file if profile binding fails', async () => {
    const { service, users, files } = setup();
    users.update.mockRejectedValue(new Error('database unavailable'));
    await expect(
      service.updateAvatar('alice', {
        buffer: png,
        mimetype: 'image/png',
        originalname: 'avatar.png',
        size: png.length,
      }),
    ).rejects.toThrow('database unavailable');
    expect(files.removeStored).toHaveBeenCalledWith('new-avatar');
  });

  it('reads only the current user avatar with owner permissions', async () => {
    const { service, files, user } = setup();
    user.role = UserRole.SuperAdmin;
    user.avatarFileId = 'owned-file';
    await service.avatar('alice');
    expect(files.download).toHaveBeenCalledWith(
      'owned-file',
      'alice',
      UserRole.User,
    );
  });

  it('returns not found for a missing user or unset avatar', async () => {
    const { service, files } = setup();
    await expect(service.get('missing')).rejects.toThrow('用户不存在');
    await expect(service.avatar('alice')).rejects.toThrow('尚未设置');
    expect(files.download).not.toHaveBeenCalled();
  });
});
