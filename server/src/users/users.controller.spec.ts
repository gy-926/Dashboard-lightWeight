import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { AuthSession } from '../auth/entities/auth-session.entity.js';

describe('UsersController', () => {
  // 被测的用户 Controller 实例。
  let controller: UsersController;

  beforeEach(async () => {
    // 构建 UsersController 所需的最小 Nest 测试模块。
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          // 单元测试不连接真实 MySQL；用空对象替代 Repository<User>。
          provide: getRepositoryToken(User),
          useValue: {},
        },
        { provide: getRepositoryToken(AuthSession), useValue: {} },
      ],
    }).compile();

    // 从依赖注入容器取得待测对象。
    controller = module.get<UsersController>(UsersController);
  });

  // 基础冒烟测试：验证模块能成功创建 Controller。
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
