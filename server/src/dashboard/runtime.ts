import { BadRequestException } from '@nestjs/common';

import { DataSource } from 'typeorm';

import { UserRole } from '../users/entities/user.entity.js';

import { decode, type Row } from './schema.js';

export class DashboardRuntime {
  constructor(private readonly db: DataSource) {}

  async userRoles(userId: string): Promise<Row[]> {
    const users: Row[] = await this.db.query(
      'SELECT role FROM users WHERE id = ?',
      [userId],
    );
    if (!users.length) return [];
    const isAdmin = users[0].role === UserRole.SuperAdmin;
    return [
      {
        kvid: isAdmin ? 'app-role:admin' : 'app-role:user',
        code: isAdmin ? 'admin' : 'user',
        name: isAdmin ? '管理员' : '普通用户',
      },
    ];
  }

  private async allowed(
    userId: string,
    isAdmin: boolean,
  ): Promise<Set<string> | null> {
    if (isAdmin) return null;
    const [roleRows, departmentRows]: [Row[], Row[]] = await Promise.all([
      this.db.query(
        "SELECT rf.function_kvid FROM dashboard_role_functions rf JOIN dashboard_roles r ON r.kvid = rf.role_kvid WHERE r.code = 'user' AND r.is_active = true",
      ),
      this.db.query(
        `WITH RECURSIVE department_path AS (
          SELECT d.id, d.parent_id FROM dashboard_departments d JOIN users u ON u.department_id = d.id WHERE u.id = ? AND d.is_active = true
          UNION DISTINCT
          SELECT parent.id, parent.parent_id FROM dashboard_departments parent JOIN department_path child ON child.parent_id = parent.id WHERE parent.is_active = true
        ) SELECT DISTINCT df.function_kvid FROM dashboard_department_functions df JOIN department_path path ON path.id = df.department_id`,
        [userId],
      ),
    ]);
    const ordinaryAccess = new Set(roleRows.map((row) => row.function_kvid));
    return new Set(
      departmentRows
        .map((row) => row.function_kvid)
        .filter((id) => ordinaryAccess.has(id)),
    );
  }

  async runtime(internalCode: string, userId: string, isAdmin: boolean) {
    if (!internalCode) throw new BadRequestException('internalCode 不能为空');
    const roots: Row[] = await this.db.query(
      'SELECT kvid, title, display_name FROM dashboard_menu_roots WHERE internal_code = ?',
      [internalCode],
    );
    if (!roots.length)
      return {
        MenuRoot: { Kvid: '', Title: '' },
        MenusMain: { Results: [], Total: 0 },
      };
    const root = roots[0];
    const rows: Row[] = await this.db.query(
      `SELECT m.*, f.handler, f.source_url AS function_source_url FROM dashboard_menus m LEFT JOIN dashboard_functions f ON f.kvid = m.function_kvid AND f.is_active = true WHERE m.menu_root_kvid = ? AND m.is_active = true ORDER BY m.sort_order`,
      [root.kvid],
    );
    const allowed = await this.allowed(userId, isAdmin);
    const children = new Map<string, Row[]>();
    for (const row of rows) {
      const key = row.parent_kvid ?? '';
      children.set(key, [...(children.get(key) ?? []), row]);
    }
    const included = new Set<string>();
    const visit = (row: Row, seen: Set<string>): boolean => {
      if (seen.has(row.kvid)) return false;
      const next = new Set(seen);
      next.add(row.kvid);
      let childVisible = false;
      for (const child of children.get(row.kvid) ?? []) {
        if (visit(child, next)) childVisible = true;
      }
      const ownVisible =
        !allowed ||
        Boolean(
          row.function_kvid && row.handler && allowed.has(row.function_kvid),
        );
      if (childVisible || ownVisible) included.add(row.kvid);
      return included.has(row.kvid);
    };
    for (const row of rows)
      if (
        !row.parent_kvid ||
        !rows.some((item) => item.kvid === row.parent_kvid)
      )
        visit(row, new Set());
    const results = rows
      .filter((row) => included.has(row.kvid))
      .map((row) => ({
        Kvid: row.kvid,
        ParentKvid: row.parent_kvid,
        Title: row.title,
        DisplayName: row.display_name,
        Type: row.type,
        Icon: row.icon,
        Order: row.sort_order,
        Remark: row.function_source_url ?? row.remark,
        FunctionKvid: row.function_kvid,
        Parameters: decode(row).parameters,
        Handler: row.handler ?? '',
      }));
    return {
      MenuRoot: {
        Kvid: root.kvid,
        Title: root.title,
        DisplayName: root.display_name ?? undefined,
      },
      MenusMain: { Results: results, Total: results.length },
    };
  }

  async autostart(
    rootKvid: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<string | null> {
    if (!rootKvid) throw new BadRequestException('menuRootKvid 不能为空');
    const rows: Row[] = await this.db.query(
      'SELECT kvid, function_kvid, parameters FROM dashboard_menus WHERE menu_root_kvid = ? AND parent_kvid IS NULL AND is_active = true ORDER BY sort_order',
      [rootKvid],
    );
    const allowed = await this.allowed(userId, isAdmin);
    const item = rows.find((row) => {
      const value = decode(row).parameters?.AutoStartup;
      return (
        (value === true || value === 'true' || value === 1) &&
        (!allowed ||
          Boolean(row.function_kvid && allowed.has(row.function_kvid)))
      );
    });
    return item?.kvid ?? null;
  }
}
