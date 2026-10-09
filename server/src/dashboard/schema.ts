import { BadRequestException } from '@nestjs/common';

export type Row = Record<string, any>;
export const specs = {
  functions: {
    table: 'dashboard_functions',
    required: ['kvid', 'handler'],
    fields: [
      'kvid',
      'title',
      'handler',
      'remark',
      'parameters',
      'render_type',
      'source_type',
      'source_module',
      'source_url',
      'source_component',
      'icon',
      'sort_order',
      'is_active',
    ],
  },
  roots: {
    table: 'dashboard_menu_roots',
    required: ['kvid', 'title', 'internal_code'],
    fields: [
      'kvid',
      'title',
      'display_name',
      'internal_code',
      'scope',
      'sort_order',
      'icon',
      'remark',
      'parameters',
    ],
  },
  menus: {
    table: 'dashboard_menus',
    required: ['kvid', 'title', 'menu_root_kvid', 'type'],
    fields: [
      'kvid',
      'parent_kvid',
      'menu_root_kvid',
      'title',
      'display_name',
      'internal_code',
      'scope',
      'type',
      'icon',
      'sort_order',
      'remark',
      'function_kvid',
      'parameters',
      'is_active',
    ],
  },
  roles: {
    table: 'dashboard_roles',
    required: ['kvid', 'code', 'name'],
    fields: ['kvid', 'code', 'name', 'remark', 'is_active'],
  },
} as const;
export type Kind = keyof typeof specs;

export function normalize(kind: Kind, input: unknown, partial = false): Row {
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new BadRequestException('请求内容必须是对象');
  const source = input as Row;
  const spec = specs[kind];
  const out: Row = {};
  for (const field of spec.fields) {
    if (!(field in source)) continue;
    const value = source[field];
    if (field === 'parameters') {
      out[field] = JSON.stringify(
        value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : {},
      );
    } else if (field === 'sort_order') {
      const n = Number(value);
      if (!Number.isFinite(n))
        throw new BadRequestException('sort_order 必须是数字');
      out[field] = Math.max(0, Math.trunc(n));
    } else if (field === 'is_active') {
      if (typeof value !== 'boolean')
        throw new BadRequestException('is_active 必须是布尔值');
      out[field] = value;
    } else {
      out[field] = value == null ? null : String(value).trim();
    }
  }
  if (!partial)
    for (const field of spec.required)
      if (!out[field]) throw new BadRequestException(`${field} 不能为空`);
  if (out.render_type && !['webview', 'vue', 'umd'].includes(out.render_type))
    throw new BadRequestException('render_type 不合法');
  if (out.source_type && !['manual', 'umd', 'system'].includes(out.source_type))
    throw new BadRequestException('source_type 不合法');
  if (out.type && !['Page', 'Folder', 'Link', 'System'].includes(out.type))
    throw new BadRequestException('菜单 type 不合法');
  return out;
}

export function decode(row: Row): Row {
  if (row && 'parameters' in row) {
    row.parameters =
      typeof row.parameters === 'string'
        ? JSON.parse(row.parameters)
        : (row.parameters ?? {});
  }
  if (row && 'is_active' in row) row.is_active = Boolean(row.is_active);
  return row;
}
