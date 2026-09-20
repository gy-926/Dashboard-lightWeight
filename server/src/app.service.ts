import { Injectable } from '@nestjs/common';

@Injectable()
// 根模块的简单业务服务。
export class AppService {
  // 返回学习项目的首页响应数据。
  getHello(): object {
    return {
      message: 'NestJS 学习开始',
      author: 'Gavin',
    };
  }
}
