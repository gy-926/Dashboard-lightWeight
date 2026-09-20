import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// 允许前端用于搜索的字段白名单。
// 不允许前端任意传数据库列名，避免越权查询与 SQL 注入风险。
export const USER_QUERY_KEYS = ['name', 'email'] as const;

// 从白名单推导出的 TypeScript 联合类型：'name' | 'email'。
export type UserQueryKey = (typeof USER_QUERY_KEYS)[number];

// 当前支持的查询方式。
export const QUERY_MODES = ['fuzzy', 'exact'] as const;

// 从查询方式列表推导出的联合类型：'fuzzy' | 'exact'。
export type QueryMode = (typeof QUERY_MODES)[number];

// 排序字段只允许使用公开的用户字段。
export const USER_SORT_KEYS = ['name', 'email', 'createdAt'] as const;
export type UserSortKey = (typeof USER_SORT_KEYS)[number];

export const SORT_ORDERS = ['ASC', 'DESC'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

// 定义 GET /users 的搜索与分页查询参数。
export class QueryUsersDto {
  // 跳过的记录数量可不传；默认不跳过任何记录。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip: number = 0;

  // 获取的记录数量可不传；默认获取 10 条。
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)

  // 限制最大值，避免一次查询过多数据拖慢数据库。
  @Max(100)
  take: number = 10;

  // queryKeys=name,email 会被转换为 ['name', 'email']。
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)
      : value,
  )
  @IsArray()

  // 传入 queryKeys 时，至少要指定一个字段。
  @ArrayNotEmpty()

  // 每一个字段都必须存在于白名单中。
  @IsIn(USER_QUERY_KEYS, { each: true })
  queryKeys?: UserQueryKey[];

  // 查询的文本或精确值。
  @IsOptional()
  @IsString()
  @MaxLength(100)
  queryValue?: string;

  // 不传时默认模糊搜索；也可以指定 exact 精确查询。
  @IsOptional()
  @IsIn(QUERY_MODES)
  queryMode: QueryMode = 'fuzzy';

  // 默认按名称升序；排序字段和值都由白名单限制。
  @IsOptional()
  @IsIn(USER_SORT_KEYS)
  sortBy: UserSortKey = 'name';

  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder: SortOrder = 'ASC';
}
