import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hashPassword } from '../auth/password.js';
import { QueryUsersDto, USER_QUERY_KEYS } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User, UserRole } from './entities/user.entity.js';

export type PublicUser = Pick<
  User,
  'id' | 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt'
>;

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

@Injectable()
// 用户业务层：通过 Repository 操作 MySQL 的 users 表。
export class UsersService {
  constructor(
    // Nest 根据 User Entity 注入 users 表的 Repository。
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // 创建用户并保存到 MySQL。
  async create(
    name: string,
    email: string,
    password: string,
  ): Promise<PublicUser> {
    // 先查询邮箱是否已存在，以便返回易理解的 409 错误。
    const existingUser = await this.usersRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException(`用户 ${email} 已存在`);
    }

    // create() 只在内存中生成 Entity 对象，不会立刻写入数据库。
    const user = this.usersRepository.create({
      name,
      email,
      passwordHash: await hashPassword(password),
    });

    // save() 执行 INSERT SQL，将用户真正保存到 MySQL。
    return toPublicUser(await this.usersRepository.save(user));
  }

  // 按指定字段搜索用户，并使用 skip、take 分页。
  async findAll(
    query: QueryUsersDto,
    viewer: { userId: string; role: UserRole },
  ): Promise<{ items: PublicUser[]; total: number }> {
    // 读取已经通过 DTO 校验的分页与搜索参数。
    const { skip, take, queryMode, sortBy, sortOrder } = query;

    // 未指定 queryKeys 时，默认在所有允许搜索的字段中查询。
    const queryKeys = query.queryKeys ?? USER_QUERY_KEYS;

    // 清除查询值前后的空格；空字符串不执行搜索。
    const queryValue = query.queryValue?.trim();

    // 创建 users 表的查询构造器；u 是 SQL 查询的表别名。
    const queryBuilder = this.usersRepository.createQueryBuilder('u');
    const isSuperAdmin = viewer.role === UserRole.SuperAdmin;
    if (!isSuperAdmin) {
      queryBuilder.where('u.id = :viewerId', { viewerId: viewer.userId });
    }

    if (queryValue) {
      // fuzzy 使用 LIKE；exact 使用等号进行精确匹配。
      const operator = queryMode === 'fuzzy' ? 'LIKE' : '=';

      // 模糊查询时，用 % 匹配任意长度的前后字符。
      const parameterValue =
        queryMode === 'fuzzy' ? `%${queryValue}%` : queryValue;

      // queryKeys 已经过 DTO 白名单校验，才能安全地作为 SQL 列名使用。
      // 多个字段之间使用 OR：名称或邮箱任意一个匹配即可。
      const conditions = queryKeys
        .map((key) => `u.${key} ${operator} :queryValue`)
        .join(' OR ');

      // queryValue 仍然通过参数绑定传入，防止用户输入造成 SQL 注入。
      const parameters = { queryValue: parameterValue };
      if (isSuperAdmin) {
        queryBuilder.where(`(${conditions})`, parameters);
      } else {
        queryBuilder.andWhere(`(${conditions})`, parameters);
      }
    }

    // 同名或同邮箱时用 UUID 固定顺序，避免分页结果在重复值间跳动。
    // 排序字段和值均已由 DTO 白名单校验。
    const [items, total] = await queryBuilder
      .orderBy(`u.${sortBy}`, sortOrder)
      .addOrderBy('u.id', 'ASC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { items: items.map(toPublicUser), total };
  }

  // 按 UUID 主键查询一个用户。
  private async getUser(id: string): Promise<User> {
    // findOneBy() 会执行类似：SELECT ... FROM users WHERE id = ?
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    return user;
  }

  async findOne(id: string): Promise<PublicUser> {
    return toPublicUser(await this.getUser(id));
  }

  // 按 UUID 部分更新用户。
  async update(id: string, updateUserDto: UpdateUserDto): Promise<PublicUser> {
    // 先查询目标用户；不存在时 findOne() 会抛出 404。
    const user = await this.getUser(id);

    // 只有传入了新邮箱，且与原邮箱不同时，才检查邮箱冲突。
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const userWithSameEmail = await this.usersRepository.findOneBy({
        email: updateUserDto.email,
      });

      if (userWithSameEmail) {
        throw new ConflictException(`用户 ${updateUserDto.email} 已存在`);
      }
    }

    // 将请求体中实际传入的字段合并到查询出的 Entity。
    Object.assign(user, updateUserDto);

    // TypeORM 在 MySQL 的 UPDATE 中默认使用秒级 CURRENT_TIMESTAMP；
    // 显式写入时间，避免刚创建的记录更新后丢失毫秒精度。
    user.updatedAt = new Date(Math.max(Date.now(), user.updatedAt.getTime()));

    // save() 执行 UPDATE SQL，持久化修改。
    return toPublicUser(await this.usersRepository.save(user));
  }

  // 按 UUID 删除用户。
  async remove(id: string): Promise<void> {
    // 先查询，保证不存在时能返回清晰的 404。
    const user = await this.getUser(id);

    // remove() 执行 DELETE SQL，从 MySQL 的 users 表中删除该记录。
    await this.usersRepository.remove(user);
  }
}
