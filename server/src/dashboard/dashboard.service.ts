import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import { DataSource } from 'typeorm';
import { FilesService, type UploadedFile } from '../files/files.service.js';

type Row = Record<string, any>;
const specs = {
  functions: { table: 'dashboard_functions', required: ['kvid', 'handler'], fields: ['kvid','title','handler','remark','parameters','render_type','source_type','source_module','source_url','source_component','icon','sort_order','is_active'] },
  roots: { table: 'dashboard_menu_roots', required: ['kvid', 'title', 'internal_code'], fields: ['kvid','title','display_name','internal_code','scope','sort_order','icon','remark','parameters'] },
  menus: { table: 'dashboard_menus', required: ['kvid', 'title', 'menu_root_kvid', 'type'], fields: ['kvid','parent_kvid','menu_root_kvid','title','display_name','internal_code','scope','type','icon','sort_order','remark','function_kvid','parameters','is_active'] },
  roles: { table: 'dashboard_roles', required: ['kvid', 'code', 'name'], fields: ['kvid','code','name','remark','is_active'] },
} as const;
type Kind = keyof typeof specs;

function normalize(kind: Kind, input: unknown, partial = false): Row {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestException('请求内容必须是对象');
  const source = input as Row;
  const spec = specs[kind];
  const out: Row = {};
  for (const field of spec.fields) {
    if (!(field in source)) continue;
    const value = source[field];
    if (field === 'parameters') {
      out[field] = JSON.stringify(value && typeof value === 'object' && !Array.isArray(value) ? value : {});
    } else if (field === 'sort_order') {
      const n = Number(value);
      if (!Number.isFinite(n)) throw new BadRequestException('sort_order 必须是数字');
      out[field] = Math.max(0, Math.trunc(n));
    } else if (field === 'is_active') {
      if (typeof value !== 'boolean') throw new BadRequestException('is_active 必须是布尔值');
      out[field] = value;
    } else {
      out[field] = value == null ? null : String(value).trim();
    }
  }
  if (!partial) for (const field of spec.required) if (!out[field]) throw new BadRequestException(`${field} 不能为空`);
  if (out.render_type && !['webview','vue','umd'].includes(out.render_type)) throw new BadRequestException('render_type 不合法');
  if (out.source_type && !['manual','umd','system'].includes(out.source_type)) throw new BadRequestException('source_type 不合法');
  if (out.type && !['Page','Folder','Link','System'].includes(out.type)) throw new BadRequestException('菜单 type 不合法');
  return out;
}

function decode(row: Row): Row {
  if (row && 'parameters' in row) {
    row.parameters = typeof row.parameters === 'string' ? JSON.parse(row.parameters) : row.parameters ?? {};
  }
  if (row && 'is_active' in row) row.is_active = Boolean(row.is_active);
  return row;
}

@Injectable()
export class DashboardService {
  constructor(private readonly db: DataSource, private readonly files: FilesService) {}

  async list(kind: Kind): Promise<Row[]> {
    const order = kind === 'roles' ? 'ORDER BY is_active DESC, name' : 'ORDER BY sort_order, title';
    return (await this.db.query(`SELECT * FROM ${specs[kind].table} ${order}`)).map(decode);
  }

  async one(kind: Kind, kvid: string): Promise<Row> {
    const rows = await this.db.query(`SELECT * FROM ${specs[kind].table} WHERE kvid = ?`, [kvid]);
    if (!rows.length) throw new NotFoundException(`${kvid} 不存在`);
    return decode(rows[0]);
  }

  async upsert(kind: Kind, input: unknown): Promise<Row> {
    const row = normalize(kind, input);
    const keys = Object.keys(row);
    const assignments = keys.filter(k => k !== 'kvid').map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ');
    await this.db.query(`INSERT INTO ${specs[kind].table} (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE ${assignments}`, Object.values(row));
    return this.one(kind, row.kvid);
  }

  async patchFunction(kvid: string, input: unknown): Promise<Row> {
    await this.one('functions', kvid);
    const row = normalize('functions', input, true);
    delete row.kvid;
    const keys = Object.keys(row);
    if (!keys.length) throw new BadRequestException('没有可更新的字段');
    await this.db.query(`UPDATE dashboard_functions SET ${keys.map(k => `\`${k}\` = ?`).join(', ')} WHERE kvid = ?`, [...Object.values(row), kvid]);
    return this.one('functions', kvid);
  }

  async remove(kind: Kind, kvid: string): Promise<null> {
    if (kind === 'roles') {
      const role = await this.one('roles', kvid);
      if (role.code === 'admin') throw new BadRequestException('不能删除内置管理员角色');
    } else await this.one(kind, kvid);
    await this.db.query(`DELETE FROM ${specs[kind].table} WHERE kvid = ?`, [kvid]);
    return null;
  }

  async bulkMenus(items: unknown): Promise<Row[]> {
    if (!Array.isArray(items) || items.length < 1 || items.length > 200) throw new BadRequestException('items 数量必须在 1 到 200 之间');
    const rows = items.map(item => normalize('menus', item));
    return this.db.transaction(async manager => {
      for (const row of rows) {
        const keys = Object.keys(row);
        await manager.query(`INSERT INTO dashboard_menus (${keys.map(k => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, Object.values(row));
      }
      return Promise.all(rows.map(row => manager.query('SELECT * FROM dashboard_menus WHERE kvid = ?', [row.kvid]).then((result: Row[]) => decode(result[0]))));
    });
  }

  async importFunctions(items: unknown): Promise<{inserted:number; skipped:number}> {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100) throw new BadRequestException('items 数量必须在 1 到 100 之间');
    const rows = items.map(item => normalize('functions', item));
    return this.db.transaction(async manager => {
      const existing: Row[] = await manager.query("SELECT source_component, source_url FROM dashboard_functions WHERE render_type = 'umd'");
      const keys = new Set(existing.map(row => `${row.source_component ?? ''}::${row.source_url ?? ''}`));
      let inserted = 0;
      for (const row of rows) {
        const key = `${row.source_component ?? ''}::${row.source_url ?? ''}`;
        if (keys.has(key)) continue;
        keys.add(key);
        const columns = Object.keys(row);
        await manager.query(`INSERT INTO dashboard_functions (${columns.map(k => `\`${k}\``).join(',')}) VALUES (${columns.map(() => '?').join(',')})`, Object.values(row));
        inserted++;
      }
      return {inserted, skipped: rows.length - inserted};
    });
  }

  private parseJsonObject(value: unknown, label: string): Row {
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
      return parsed as Row;
    } catch {
      throw new BadRequestException(`${label} 必须是 JSON 对象`);
    }
  }

  private parseUmdComponents(value: unknown, manifest: Row): Row[] {
    let parsed: unknown = value;
    if (typeof value === 'string') {
      try { parsed = JSON.parse(value); } catch { throw new BadRequestException('components 必须是 JSON 数组'); }
    }
    if (!Array.isArray(parsed)) parsed = manifest.componentsDetailed ?? manifest.components;
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 100) {
      throw new BadRequestException('UMD 组件数量必须在 1 到 100 之间');
    }
    const map = manifest.componentsMap && typeof manifest.componentsMap === 'object' ? manifest.componentsMap as Row : {};
    return parsed.map(item => {
      const source = typeof item === 'string' ? { name: item } : item as Row;
      const name = String(source?.name ?? '').trim();
      if (!/^[A-Za-z][A-Za-z0-9_-]{0,99}$/.test(name)) throw new BadRequestException(`组件名称不合法: ${name || '(空)'}`);
      return {
        name,
        title: String(source.zhName ?? source.title ?? name).trim().slice(0, 255),
        description: String(source.description ?? map[name] ?? '').trim().slice(0, 2000),
        icon: String(source.icon ?? 'fas fa-cube').trim().slice(0, 255),
      };
    });
  }

  private umdAssetUrl(versionId: string, fileName: string): string {
    return `/api/dashboard-assets/${versionId}/${encodeURIComponent(fileName)}`;
  }

  async importUmd(userId: string, upload: UploadedFile | undefined, input: Row) {
    if (!upload?.buffer?.length) throw new BadRequestException('请选择 UMD JavaScript 文件');
    if (!basename(upload.originalname).toLowerCase().endsWith('.js')) throw new BadRequestException('只允许导入 .js 文件');
    const manifest = this.parseJsonObject(input.manifest, 'manifest');
    const rawModuleKey = String(input.moduleKey ?? manifest.libName ?? manifest.name ?? basename(upload.originalname, '.js')).trim();
    const moduleKey = rawModuleKey.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
    if (!moduleKey) throw new BadRequestException('moduleKey 不能为空');
    const version = String(input.version ?? manifest.version ?? '').trim().slice(0, 64);
    if (!/^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/.test(version)) throw new BadRequestException('版本号不合法');
    const name = String(input.name ?? manifest.zhName ?? manifest.name ?? moduleKey).trim().slice(0, 255);
    const components = this.parseUmdComponents(input.components, manifest);

    const duplicate: Row[] = await this.db.query(`SELECT v.id FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id WHERE p.module_key = ? AND v.version = ?`, [moduleKey, version]);
    if (duplicate.length) throw new ConflictException(`模块 ${moduleKey} 的版本 ${version} 已存在`);

    const stored = await this.files.store(userId, upload);
    const packageId = randomUUID();
    const versionId = randomUUID();
    const assetUrl = this.umdAssetUrl(versionId, stored.originalName);
    try {
      const result = await this.db.transaction(async manager => {
        await manager.query(`INSERT INTO dashboard_umd_packages (id, module_key, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`, [packageId, moduleKey, name]);
        const packages: Row[] = await manager.query('SELECT id FROM dashboard_umd_packages WHERE module_key = ?', [moduleKey]);
        const actualPackageId = packages[0].id;
        await manager.query('UPDATE dashboard_umd_versions SET is_current = false WHERE package_id = ?', [actualPackageId]);
        await manager.query(`INSERT INTO dashboard_umd_versions (id, package_id, version, file_id, manifest, created_by, is_current) VALUES (?, ?, ?, ?, ?, ?, true)`, [versionId, actualPackageId, version, stored.id, JSON.stringify(manifest), userId]);
        for (const [index, component] of components.entries()) {
          const kvid = `umd-${createHash('sha256').update(`${moduleKey}:${component.name}`).digest('hex').slice(0, 28)}`;
          await manager.query(`INSERT INTO dashboard_functions
            (kvid, title, handler, remark, parameters, render_type, source_type, source_module, source_url, source_component, icon, sort_order, is_active)
            VALUES (?, ?, ?, ?, '{}', 'umd', 'umd', ?, ?, ?, ?, ?, true)
            ON DUPLICATE KEY UPDATE title = VALUES(title), handler = VALUES(handler), remark = VALUES(remark), render_type = 'umd', source_type = 'umd', source_module = VALUES(source_module), source_url = VALUES(source_url), source_component = VALUES(source_component), icon = VALUES(icon)`,
          [kvid, component.title, `<${component.name} />`, component.description || null, moduleKey, assetUrl, component.name, component.icon, index]);
        }
        return { moduleKey, name, version, versionId, file: stored, sourceUrl: assetUrl, imported: components.length };
      });
      return result;
    } catch (error) {
      await this.files.removeStored(stored.id);
      if ((error as { code?: string })?.code === 'ER_DUP_ENTRY') throw new ConflictException(`模块 ${moduleKey} 的版本 ${version} 已存在`);
      throw error;
    }
  }

  async umdVersions(moduleKey?: string) {
    const values: unknown[] = [];
    const where = moduleKey ? 'WHERE p.module_key = ?' : '';
    if (moduleKey) values.push(moduleKey);
    const rows: Row[] = await this.db.query(`SELECT v.id, p.module_key, p.name, v.version, v.file_id, f.original_name, f.size, f.sha256, v.manifest, v.is_current, v.created_by, v.created_at FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id JOIN stored_files f ON f.id = v.file_id ${where} ORDER BY p.name, v.created_at DESC`, values);
    return rows.map(row => ({
      ...row,
      manifest: typeof row.manifest === 'string' ? JSON.parse(row.manifest) : row.manifest ?? {},
      is_current: Boolean(row.is_current),
      sourceUrl: this.umdAssetUrl(row.id, row.original_name),
    }));
  }

  async activateUmdVersion(versionId: string) {
    const rows: Row[] = await this.db.query(`SELECT v.id, v.package_id, v.version, p.module_key, f.original_name FROM dashboard_umd_versions v JOIN dashboard_umd_packages p ON p.id = v.package_id JOIN stored_files f ON f.id = v.file_id WHERE v.id = ?`, [versionId]);
    if (!rows.length) throw new NotFoundException('UMD 版本不存在');
    const version = rows[0];
    const assetUrl = this.umdAssetUrl(version.id, version.original_name);
    await this.db.transaction(async manager => {
      await manager.query('UPDATE dashboard_umd_versions SET is_current = false WHERE package_id = ?', [version.package_id]);
      await manager.query('UPDATE dashboard_umd_versions SET is_current = true WHERE id = ?', [version.id]);
      await manager.query(`UPDATE dashboard_functions SET source_url = ? WHERE render_type = 'umd' AND source_module = ?`, [assetUrl, version.module_key]);
    });
    return { versionId, moduleKey: version.module_key, version: version.version, sourceUrl: assetUrl };
  }

  async openUmdAsset(versionId: string) {
    const rows: Row[] = await this.db.query('SELECT file_id FROM dashboard_umd_versions WHERE id = ?', [versionId]);
    if (!rows.length) throw new NotFoundException('UMD 版本不存在');
    return this.files.openStored(rows[0].file_id);
  }

  async userRoles(userId: string): Promise<Row[]> {
    return this.db.query('SELECT r.kvid, r.code, r.name FROM dashboard_roles r JOIN dashboard_user_roles ur ON ur.role_kvid = r.kvid WHERE ur.user_id = ? AND r.is_active = true', [userId]);
  }

  private async allowed(userId: string, isAdmin: boolean): Promise<Set<string> | null> {
    if (isAdmin) return null;
    const rows: Row[] = await this.db.query('SELECT rf.function_kvid FROM dashboard_role_functions rf JOIN dashboard_user_roles ur ON ur.role_kvid = rf.role_kvid JOIN dashboard_roles r ON r.kvid = rf.role_kvid WHERE ur.user_id = ? AND r.is_active = true', [userId]);
    return new Set(rows.map(row => row.function_kvid));
  }

  async runtime(internalCode: string, userId: string, isAdmin: boolean) {
    if (!internalCode) throw new BadRequestException('internalCode 不能为空');
    const roots: Row[] = await this.db.query('SELECT kvid, title, display_name FROM dashboard_menu_roots WHERE internal_code = ?', [internalCode]);
    if (!roots.length) return { MenuRoot: { Kvid: '', Title: '' }, MenusMain: { Results: [], Total: 0 } };
    const root = roots[0];
    const rows: Row[] = await this.db.query(`SELECT m.*, f.handler, f.source_url AS function_source_url FROM dashboard_menus m LEFT JOIN dashboard_functions f ON f.kvid = m.function_kvid AND f.is_active = true WHERE m.menu_root_kvid = ? AND m.is_active = true ORDER BY m.sort_order`, [root.kvid]);
    const allowed = await this.allowed(userId, isAdmin);
    const children = new Map<string, Row[]>();
    for (const row of rows) { const key = row.parent_kvid ?? ''; children.set(key, [...(children.get(key) ?? []), row]); }
    const included = new Set<string>();
    const visit = (row: Row, seen: Set<string>): boolean => {
      if (seen.has(row.kvid)) return false;
      const next = new Set(seen); next.add(row.kvid);
      let childVisible = false;
      for (const child of children.get(row.kvid) ?? []) {
        if (visit(child, next)) childVisible = true;
      }
      const ownVisible = !allowed || Boolean(row.function_kvid && row.handler && allowed.has(row.function_kvid));
      if (childVisible || ownVisible) included.add(row.kvid);
      return included.has(row.kvid);
    };
    for (const row of rows) if (!row.parent_kvid || !rows.some(item => item.kvid === row.parent_kvid)) visit(row, new Set());
    const results = rows.filter(row => included.has(row.kvid)).map(row => ({ Kvid: row.kvid, ParentKvid: row.parent_kvid, Title: row.title, DisplayName: row.display_name, Type: row.type, Icon: row.icon, Order: row.sort_order, Remark: row.function_source_url ?? row.remark, FunctionKvid: row.function_kvid, Parameters: decode(row).parameters, Handler: row.handler ?? '' }));
    return { MenuRoot: { Kvid: root.kvid, Title: root.title, DisplayName: root.display_name ?? undefined }, MenusMain: { Results: results, Total: results.length } };
  }

  async autostart(rootKvid: string, userId: string, isAdmin: boolean): Promise<string | null> {
    if (!rootKvid) throw new BadRequestException('menuRootKvid 不能为空');
    const rows: Row[] = await this.db.query('SELECT kvid, function_kvid, parameters FROM dashboard_menus WHERE menu_root_kvid = ? AND parent_kvid IS NULL AND is_active = true ORDER BY sort_order', [rootKvid]);
    const allowed = await this.allowed(userId, isAdmin);
    const item = rows.find(row => {
      const value = decode(row).parameters?.AutoStartup;
      return (value === true || value === 'true' || value === 1) && (!allowed || Boolean(row.function_kvid && allowed.has(row.function_kvid)));
    });
    return item?.kvid ?? null;
  }

  async menuConfig() {
    const [roots, menus, functions] = await Promise.all([this.list('roots'), this.list('menus'), this.list('functions')]);
    return { roots, menus, functions };
  }

  async permissions() {
    const [roles, roleFunctions, userRoles, users] = await Promise.all([
      this.list('roles'),
      this.db.query('SELECT role_kvid, function_kvid FROM dashboard_role_functions'),
      this.db.query('SELECT user_id, role_kvid FROM dashboard_user_roles'),
      this.db.query("SELECT id AS user_id, email, IF(role = 'super_admin', 'admin', NULL) AS app_role, created_at, NULL AS last_sign_in_at FROM users ORDER BY created_at DESC"),
    ]);
    return { roles, roleFunctions, userRoles, users };
  }

  async replaceBindings(kind: 'role' | 'user', id: string, ids: unknown): Promise<null> {
    if (!Array.isArray(ids) || ids.some(value => typeof value !== 'string' || !value.trim()) || ids.length > 500) throw new BadRequestException('权限 ID 列表不合法');
    const unique = [...new Set(ids.map(value => value.trim()))];
    const table = kind === 'role' ? 'dashboard_role_functions' : 'dashboard_user_roles';
    const key = kind === 'role' ? 'role_kvid' : 'user_id';
    const target = kind === 'role' ? 'function_kvid' : 'role_kvid';
    if (kind === 'role') await this.one('roles', id);
    else if (!(await this.db.query('SELECT id FROM users WHERE id = ?', [id])).length) throw new NotFoundException('用户不存在');
    await this.db.transaction(async manager => {
      await manager.query(`DELETE FROM ${table} WHERE ${key} = ?`, [id]);
      for (const value of unique) await manager.query(`INSERT INTO ${table} (${key}, ${target}) VALUES (?, ?)`, [id, value]);
    });
    return null;
  }
}
