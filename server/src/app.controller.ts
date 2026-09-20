import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  // Nest 通过依赖注入提供 AppService 实例。
  constructor(private readonly appService: AppService) {}

  // 匹配 GET /，并将 Service 的返回值自动序列化为 JSON。
  @Get()
  getHello(): object {
    return this.appService.getHello();
  }
}
