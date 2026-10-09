import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import { specs, normalize, decode, type Row, type Kind } from './schema.js';

export class DashboardRecords {
  constructor(private readonly db: DataSource) {}

  async list(kind: Kind): Promise<Row[]> {
    const order =
      kind === 'roles'
        ? 'ORDER BY is_active DESC, name'
        : 'ORDER BY sort_order, title';
    return (
      await this.db.query(`SELECT * FROM ${specs[kind].table} ${order}`)
    ).map(decode);
  }

  async one(kind: Kind, kvid: string): Promise<Row> {
    const rows = await this.db.query(
      `SELECT * FROM ${specs[kind].table} WHERE kvid = ?`,
      [kvid],
    );
    if (!rows.length) throw new NotFoundException(`${kvid} 不存在`);
    return decode(rows[0]);
  }

  async upsert(kind: Kind, input: unknown): Promise<Row> {
    const row = normalize(kind, input);
    const keys = Object.keys(row);
    const assignments = keys
      .filter((k) => k !== 'kvid')
      .map((k) => `\`${k}\` = VALUES(\`${k}\`)`)
      .join(', ');
    await this.db.query(
      `INSERT INTO ${specs[kind].table} (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')}) ON DUPLICATE KEY UPDATE ${assignments}`,
      Object.values(row),
    );
    return this.one(kind, row.kvid);
  }

  async patchFunction(kvid: string, input: unknown): Promise<Row> {
    await this.one('functions', kvid);
    const row = normalize('functions', input, true);
    delete row.kvid;
    const keys = Object.keys(row);
    if (!keys.length) throw new BadRequestException('没有可更新的字段');
    await this.db.query(
      `UPDATE dashboard_functions SET ${keys.map((k) => `\`${k}\` = ?`).join(', ')} WHERE kvid = ?`,
      [...Object.values(row), kvid],
    );
    return this.one('functions', kvid);
  }

  async remove(kind: Kind, kvid: string): Promise<null> {
    if (kind === 'roles') {
      const role = await this.one('roles', kvid);
      if (role.code === 'admin')
        throw new BadRequestException('不能删除内置管理员角色');
    } else if (kind === 'roots' || kind === 'menus') {
      return this.db.transaction(async (manager) => {
        const rows: Row[] = await manager.query(
          `SELECT kvid FROM ${specs[kind].table} WHERE kvid = ? FOR UPDATE`,
          [kvid],
        );
        if (!rows.length) throw new NotFoundException(`${kvid} 不存在`);
        const parentColumn =
          kind === 'roots' ? 'menu_root_kvid' : 'parent_kvid';
        const children: Row[] = await manager.query(
          `SELECT kvid FROM dashboard_menus WHERE ${parentColumn} = ? LIMIT 1 FOR UPDATE`,
          [kvid],
        );
        if (children.length)
          throw new ConflictException(
            '请先删除全部子菜单和关联页面，再删除当前节点',
          );
        await manager.query(`DELETE FROM ${specs[kind].table} WHERE kvid = ?`, [
          kvid,
        ]);
        return null;
      });
    } else await this.one(kind, kvid);
    await this.db.query(`DELETE FROM ${specs[kind].table} WHERE kvid = ?`, [
      kvid,
    ]);
    return null;
  }

  async bulkMenus(items: unknown): Promise<Row[]> {
    if (!Array.isArray(items) || items.length < 1 || items.length > 200)
      throw new BadRequestException('items 数量必须在 1 到 200 之间');
    const rows = items.map((item) => normalize('menus', item));
    return this.db.transaction(async (manager) => {
      for (const row of rows) {
        const keys = Object.keys(row);
        await manager.query(
          `INSERT INTO dashboard_menus (${keys.map((k) => `\`${k}\``).join(',')}) VALUES (${keys.map(() => '?').join(',')})`,
          Object.values(row),
        );
      }
      return Promise.all(
        rows.map((row) =>
          manager
            .query('SELECT * FROM dashboard_menus WHERE kvid = ?', [row.kvid])
            .then((result: Row[]) => decode(result[0])),
        ),
      );
    });
  }

  async importFunctions(
    items: unknown,
  ): Promise<{ inserted: number; skipped: number }> {
    if (!Array.isArray(items) || items.length < 1 || items.length > 100)
      throw new BadRequestException('items 数量必须在 1 到 100 之间');
    const rows = items.map((item) => normalize('functions', item));
    return this.db.transaction(async (manager) => {
      const existing: Row[] = await manager.query(
        "SELECT source_component, source_url FROM dashboard_functions WHERE render_type = 'umd'",
      );
      const keys = new Set(
        existing.map(
          (row) => `${row.source_component ?? ''}::${row.source_url ?? ''}`,
        ),
      );
      let inserted = 0;
      for (const row of rows) {
        const key = `${row.source_component ?? ''}::${row.source_url ?? ''}`;
        if (keys.has(key)) continue;
        keys.add(key);
        const columns = Object.keys(row);
        await manager.query(
          `INSERT INTO dashboard_functions (${columns.map((k) => `\`${k}\``).join(',')}) VALUES (${columns.map(() => '?').join(',')})`,
          Object.values(row),
        );
        inserted++;
      }
      return { inserted, skipped: rows.length - inserted };
    });
  }

  async menuConfig() {
    const [roots, menus, functions] = await Promise.all([
      this.list('roots'),
      this.list('menus'),
      this.list('functions'),
    ]);
    return { roots, menus, functions };
  }
}
