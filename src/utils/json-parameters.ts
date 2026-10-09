/** 参数必须是 JSON 对象；保留编辑文本，提交时才调用此解析器。 */
export function parseJsonParameters(text: string): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(text.trim() || '{}');
  } catch {
    throw new Error('扩展参数必须是合法 JSON');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('扩展参数必须是 JSON 对象');
  }
  return value as Record<string, unknown>;
}
