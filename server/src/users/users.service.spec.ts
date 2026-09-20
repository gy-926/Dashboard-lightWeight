import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { User, UserRole } from './entities/user.entity.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  // 被测的用户业务 Service 实例。
  let service: UsersService;
  const queryBuilder = {
    where: vi.fn().mockReturnThis(),
    andWhere: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    addOrderBy: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    take: vi.fn().mockReturnThis(),
    getManyAndCount: vi.fn(),
  };
  const repository = {
    createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
  };
  const admin = { userId: 'admin-1', role: UserRole.SuperAdmin };

  beforeEach(async () => {
    vi.clearAllMocks();
    // 构建仅提供 UsersService 的最小测试模块。
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          // 单元测试不连接真实 MySQL；用模拟对象替代 Repository<User>。
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    // 从依赖注入容器取得待测对象。
    service = module.get<UsersService>(UsersService);
  });

  // 基础冒烟测试：验证 Service 可以被 Nest 创建。
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('uses the default pagination and returns items with total', async () => {
    const user = Object.assign(new User(), {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      role: UserRole.User,
    });
    queryBuilder.getManyAndCount.mockResolvedValue([[user], 1]);

    const result = await service.findAll(new QueryUsersDto(), admin);

    expect(repository.createQueryBuilder).toHaveBeenCalledWith('u');
    expect(queryBuilder.where).not.toHaveBeenCalled();
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('u.name', 'ASC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('u.id', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.take).toHaveBeenCalledWith(10);
    expect(queryBuilder.getManyAndCount).toHaveBeenCalledOnce();
    expect(result).toEqual({
      items: [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: undefined,
          updatedAt: undefined,
        },
      ],
      total: 1,
    });
  });

  it('searches selected fields with a bound fuzzy value', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    const query = Object.assign(new QueryUsersDto(), {
      queryKeys: ['name', 'email'] as const,
      queryValue: '  alice  ',
    });

    const result = await service.findAll(query, admin);

    expect(queryBuilder.where).toHaveBeenCalledWith(
      '(u.name LIKE :queryValue OR u.email LIKE :queryValue)',
      { queryValue: '%alice%' },
    );
    expect(result).toEqual({ items: [], total: 0 });
  });

  it('searches one field with an exact value', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    const query = Object.assign(new QueryUsersDto(), {
      queryKeys: ['email'] as const,
      queryValue: '  alice@example.com  ',
      queryMode: 'exact' as const,
    });

    await service.findAll(query, admin);

    expect(queryBuilder.where).toHaveBeenCalledWith('(u.email = :queryValue)', {
      queryValue: 'alice@example.com',
    });
  });

  it('uses requested sorting and pagination with a stable tie breaker', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    const query = Object.assign(new QueryUsersDto(), {
      skip: 20,
      take: 5,
      sortBy: 'createdAt' as const,
      sortOrder: 'DESC' as const,
    });

    await service.findAll(query, admin);

    expect(queryBuilder.orderBy).toHaveBeenCalledWith('u.createdAt', 'DESC');
    expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('u.id', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(20);
    expect(queryBuilder.take).toHaveBeenCalledWith(5);
  });

  it('restricts a regular user search to their own id', async () => {
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
    const query = Object.assign(new QueryUsersDto(), {
      queryValue: 'alice',
    });

    await service.findAll(query, { userId: 'user-1', role: UserRole.User });

    expect(queryBuilder.where).toHaveBeenCalledWith('u.id = :viewerId', {
      viewerId: 'user-1',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(u.name LIKE :queryValue OR u.email LIKE :queryValue)',
      { queryValue: '%alice%' },
    );
  });
});
