import type {
  PageDescriptor,
  PageIdentityQuery,
  PageIdentityQueryValue,
} from './types';

function normalizeQueryValue(value: PageIdentityQueryValue): string | string[] | null {
  if (Array.isArray(value)) return [...value];
  return value ?? null;
}

/** 生成与属性插入顺序无关、可序列化的 query。 */
export function normalizePageIdentityQuery(
  query?: PageIdentityQuery
): Record<string, string | string[] | null> {
  if (!query) return {};

  return Object.keys(query)
    .sort()
    .reduce<Record<string, string | string[] | null>>((result, key) => {
      result[key] = normalizeQueryValue(query[key]);
      return result;
    }, {});
}

/**
 * 为标签对应的页面实例生成稳定键。
 *
 * 键不包含时间戳或随机量；同一标签身份与参数在刷新恢复后得到相同结果，
 * 不同 query 则得到不同实例，避免错误共享表单状态。
 */
export function createPageInstanceKey(descriptor: PageDescriptor): string {
  const identity = [
    'v1',
    descriptor.tabKey || descriptor.path,
    descriptor.path,
    descriptor.kvid || '',
    normalizePageIdentityQuery(descriptor.query),
  ];

  return `page:${encodeURIComponent(JSON.stringify(identity))}`;
}
