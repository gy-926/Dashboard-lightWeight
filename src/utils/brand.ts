const BRAND_NAME = 'GavinYinHub';

/** 统一用户可见品牌文案，不修改 API、包名或后端类型标识。 */
export function normalizeBrandText(
  value: string | null | undefined,
  fallback = BRAND_NAME
): string {
  const text = String(value ?? '').trim() || fallback;
  return text
    .replace(/GavinYin\s+Hub/gi, BRAND_NAME)
    .replace(/Kivii/gi, BRAND_NAME);
}

export { BRAND_NAME };
