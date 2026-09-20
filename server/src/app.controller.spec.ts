import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  // 被测的根路径 Controller 实例。
  let appController: AppController;

  beforeEach(async () => {
    // 创建一个仅包含 Controller 与其依赖 Service 的测试模块。
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    // 从 Nest 的依赖注入容器取出待测 Controller。
    appController = app.get<AppController>(AppController);
  });

  describe('根路径 GET /', () => {
    // 首页接口应返回当前学习项目定义的 JSON 数据。
    it('should return the learning project information', () => {
      expect(appController.getHello()).toEqual({
        message: 'NestJS 学习开始',
        author: 'Gavin',
      });
    });
  });
});
