import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { DataSource } from 'typeorm';

import { type Row } from './schema.js';

export class DashboardOrganization {
  constructor(private readonly db: DataSource) {}

  async departments(): Promise<Row[]> {
    const rows: Row[] = await this.db.query(
      'SELECT id, parent_id, code, name, kind, full_name, address, mnemonic_code, internal_code, manager_user_id, floor, is_active, sort_order FROM dashboard_departments ORDER BY sort_order, name',
    );
    return rows.map((row) => ({ ...row, is_active: Boolean(row.is_active) }));
  }

  async saveDepartment(input: unknown): Promise<Row> {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new BadRequestException('部门信息必须是对象');
    const source = input as Row;
    const id = source.id ? String(source.id) : randomUUID();
    const name = String(source.name ?? '').trim();
    const parentId = source.parent_id ? String(source.parent_id).trim() : null;
    const kind = source.kind ?? (parentId ? 'department' : 'organization');
    const fullName =
      kind === 'department' ? name : String(source.full_name ?? name).trim();
    const address = String(source.address ?? '').trim() || null;
    const mnemonicCode = String(source.mnemonic_code ?? '').trim() || null;
    const internalCode = String(source.internal_code ?? '').trim() || null;
    const managerUserId = source.manager_user_id
      ? String(source.manager_user_id).trim()
      : null;
    const floor = String(source.floor ?? '').trim() || null;
    const sortOrder = Number(source.sort_order ?? 0);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    )
      throw new BadRequestException('部门 ID 不合法');
    if (!name || name.length > 255)
      throw new BadRequestException('部门名称不能为空且不能超过 255 字');
    if (!fullName || fullName.length > 255)
      throw new BadRequestException('机构全称不能为空且不能超过 255 字');
    if (kind !== 'organization' && kind !== 'department')
      throw new BadRequestException('机构类型不合法');
    if (parentId && kind !== 'department')
      throw new BadRequestException('下级节点只能创建部门');
    if (!parentId && kind !== 'organization')
      throw new BadRequestException('顶层节点只能创建组织');
    if (address && address.length > 500)
      throw new BadRequestException('机构地址不能超过 500 字');
    if (mnemonicCode && mnemonicCode.length > 100)
      throw new BadRequestException('助记码不能超过 100 字');
    if (internalCode && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(internalCode))
      throw new BadRequestException('内部编码不合法');
    if (
      managerUserId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        managerUserId,
      )
    )
      throw new BadRequestException('部门负责人不合法');
    if (floor && floor.length > 100)
      throw new BadRequestException('部门楼层不能超过 100 字');
    if (
      typeof source.is_active !== 'undefined' &&
      typeof source.is_active !== 'boolean'
    )
      throw new BadRequestException('启用状态必须是布尔值');
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0)
      throw new BadRequestException('排序必须是非负整数');
    if (parentId === id)
      throw new BadRequestException('部门不能成为自己的上级');
    if (parentId) {
      const visited = new Set([id]);
      let cursor: string | null = parentId;
      while (cursor) {
        if (visited.has(cursor))
          throw new BadRequestException('部门层级不能形成循环');
        visited.add(cursor);
        const rows: Row[] = await this.db.query(
          'SELECT parent_id FROM dashboard_departments WHERE id = ?',
          [cursor],
        );
        if (!rows.length) throw new NotFoundException('上级部门不存在');
        cursor = rows[0].parent_id;
      }
    }
    if (managerUserId) {
      const managers: Row[] = await this.db.query(
        'SELECT id FROM users WHERE id = ?',
        [managerUserId],
      );
      if (!managers.length) throw new NotFoundException('部门负责人不存在');
    }
    try {
      const existing: Row[] = await this.db.query(
        'SELECT id, code FROM dashboard_departments WHERE id = ?',
        [id],
      );
      const code = String(
        source.code ||
          existing[0]?.code ||
          internalCode ||
          `dept_${id.replace(/-/g, '')}`,
      ).trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(code))
        throw new BadRequestException('部门编码不合法');
      if (existing.length) {
        await this.db.query(
          'UPDATE dashboard_departments SET parent_id = ?, code = ?, name = ?, kind = ?, full_name = ?, address = ?, mnemonic_code = ?, internal_code = ?, manager_user_id = ?, floor = ?, is_active = ?, sort_order = ? WHERE id = ?',
          [
            parentId,
            code,
            name,
            kind,
            fullName,
            address,
            mnemonicCode,
            internalCode,
            managerUserId,
            floor,
            source.is_active ?? true,
            sortOrder,
            id,
          ],
        );
      } else {
        await this.db.query(
          'INSERT INTO dashboard_departments (id, parent_id, code, name, kind, full_name, address, mnemonic_code, internal_code, manager_user_id, floor, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            parentId,
            code,
            name,
            kind,
            fullName,
            address,
            mnemonicCode,
            internalCode,
            managerUserId,
            floor,
            source.is_active ?? true,
            sortOrder,
          ],
        );
      }
    } catch (error) {
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY')
        throw new ConflictException('部门编码已存在');
      throw error;
    }
    const rows: Row[] = await this.db.query(
      'SELECT id, parent_id, code, name, kind, full_name, address, mnemonic_code, internal_code, manager_user_id, floor, is_active, sort_order FROM dashboard_departments WHERE id = ?',
      [id],
    );
    return { ...rows[0], is_active: Boolean(rows[0].is_active) };
  }

  async deleteDepartment(id: string): Promise<null> {
    const rows: Row[] = await this.db.query(
      'SELECT id FROM dashboard_departments WHERE id = ?',
      [id],
    );
    if (!rows.length) throw new NotFoundException('部门不存在');
    const [children, users]: [Row[], Row[]] = await Promise.all([
      this.db.query(
        'SELECT id FROM dashboard_departments WHERE parent_id = ? LIMIT 1',
        [id],
      ),
      this.db.query('SELECT id FROM users WHERE department_id = ? LIMIT 1', [
        id,
      ]),
    ]);
    if (children.length || users.length)
      throw new ConflictException('部门仍有下级或成员，请先调整归属');
    await this.db.query('DELETE FROM dashboard_departments WHERE id = ?', [id]);
    return null;
  }

  async assignUserDepartment(
    userId: string,
    departmentId: unknown,
  ): Promise<null> {
    if (
      departmentId !== null &&
      (typeof departmentId !== 'string' || !departmentId.trim())
    )
      throw new BadRequestException('部门 ID 不合法');
    const users: Row[] = await this.db.query(
      'SELECT id FROM users WHERE id = ?',
      [userId],
    );
    if (!users.length) throw new NotFoundException('用户不存在');
    if (departmentId) {
      const departments: Row[] = await this.db.query(
        'SELECT id FROM dashboard_departments WHERE id = ?',
        [departmentId],
      );
      if (!departments.length) throw new NotFoundException('部门不存在');
    }
    await this.db.query('UPDATE users SET department_id = ? WHERE id = ?', [
      departmentId,
      userId,
    ]);
    return null;
  }

  async addDepartmentUsers(
    departmentId: string,
    userIds: unknown,
  ): Promise<{ assigned: number }> {
    const uuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
      !Array.isArray(userIds) ||
      userIds.length < 1 ||
      userIds.length > 500 ||
      userIds.some((id) => typeof id !== 'string' || !uuid.test(id))
    ) {
      throw new BadRequestException('请选择有效的用户');
    }
    const uniqueIds = [...new Set(userIds as string[])];
    const departments: Row[] = await this.db.query(
      'SELECT id FROM dashboard_departments WHERE id = ?',
      [departmentId],
    );
    if (!departments.length) throw new NotFoundException('部门不存在');
    const users: Row[] = await this.db.query(
      `SELECT id FROM users WHERE id IN (${uniqueIds.map(() => '?').join(', ')})`,
      uniqueIds,
    );
    if (users.length !== uniqueIds.length)
      throw new BadRequestException('包含不存在的用户');
    await this.db.query(
      `UPDATE users SET department_id = ? WHERE id IN (${uniqueIds.map(() => '?').join(', ')})`,
      [departmentId, ...uniqueIds],
    );
    return { assigned: uniqueIds.length };
  }
}
