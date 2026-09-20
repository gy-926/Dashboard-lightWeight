import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
// 捕获所有 HTTP 请求中的异常，并返回统一错误响应格式。
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    // 切换到 HTTP 上下文，取得 Express 的请求与响应对象。
    const context = host.switchToHttp();
    const response = context.getResponse();

    // 已知的 Nest HTTP 异常保留原状态码；未知异常统一视为 500。
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 读取 Nest 异常自带的响应内容，例如 DTO 校验失败的 message 数组。
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // 从异常内容中提取可显示的信息。
    const rawMessage =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
        ? exceptionResponse.message
        : exceptionResponse;

    // 多条 DTO 校验信息转换为更易读的一条文字。
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(', ')
      : typeof rawMessage === 'string'
        ? rawMessage
        : '服务器内部错误';

    // 未预期错误只记录在服务端；不把内部实现细节泄露给客户端。
    if (!(exception instanceof HttpException)) {
      console.error(exception);
    }

    // 设置真实 HTTP 状态码，并返回与成功响应一致的字段结构。
    response.status(status).json({
      status,
      message,
      Results: null,
      Total: 0,
    });
  }
}