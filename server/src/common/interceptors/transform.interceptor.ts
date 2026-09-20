import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

// 所有成功接口统一使用的响应结构。
export interface ApiResponse<T> {
  // HTTP 成功状态码。
  status: number;

  // 给前端或调用方阅读的信息。
  message: string;

  // Controller 原本返回的业务数据。
  Results: T;

  // 本次响应中包含的数据数量。
  Total: number;
}
// Service 用于传递分页数据的内部结构，不直接暴露给前端。
interface PaginatedData<T> {
  items: T[];
  total: number;
}

// 判断 Controller 返回的是否为分页数据。
function isPaginatedData(value: unknown): value is PaginatedData<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'total' in value &&
    Array.isArray(value.items) &&
    typeof value.total === 'number'
  );
}
@Injectable()
// 拦截 Controller 的成功返回值，并包装成统一 JSON 格式。
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    // 当前请求上下文，用于读取实际 HTTP 响应状态码。
    context: ExecutionContext,

    // next.handle() 代表继续执行 Controller，并取得其返回结果。
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // 取得 Express 即将返回给客户端的响应对象。
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      // 将 Controller 的原始 data 转换为统一响应结构。
      map((data) => {
        // 分页查询会返回 { items, total }；普通接口返回原始业务数据。
        const paginated = isPaginatedData(data);

        return {
          // 使用真实 HTTP 状态码：GET 通常是 200，POST 创建通常是 201。
          status: response.statusCode,
          message: 'success',

          // 分页时只把当前页数组放进 Results；普通接口保持原始数据。
          Results: paginated ? data.items : data,

          // 分页时使用数据库总记录数；普通接口按返回数据数量计算。
          Total: paginated
            ? data.total
            : Array.isArray(data)
              ? data.length
              : data == null
                ? 0
                : 1,
        };
      }),
    );
  }
}
