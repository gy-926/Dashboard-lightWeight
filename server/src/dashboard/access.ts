import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import { UserRole } from '../users/entities/user.entity.js';

import { type Row } from './schema.js';
import { DashboardRecords } from './records.js';
import { DashboardOrganization } from './organization.js';

export class DashboardAccess {
  constructor(
    private readonly db: DataSource,
    private readonly records: DashboardRecords,
    private readonly organization: DashboardOrganization,
  ) {}

  async permissions() {
    const [
      roles,
      roleFunctions,
      userRoles,
      users,
      departments,
      departmentFunctions,
    ] = await Promise.all([
      this.records.list('roles'),
      this.db.query(
        'SELECT role_kvid, function_kvid FROM dashboard_role_functions',
      ),
      this.db.query('SELECT user_id, role_kvid FROM dashboard_user_roles'),
      this.db.query(
        "SELECT id AS user_id, name, email, department_id, IF(role = 'super_admin', 'admin', NULL) AS app_role, created_at, NULL AS last_sign_in_at FROM users ORDER BY created_at DESC",
      ),
      this.organization.departments(),
      this.db.query(
        'SELECT department_id, function_kvid FROM dashboard_department_functions',
      ),
    ]);
    return {
      roles,
      roleFunctions,
      userRoles,
      users,
      departments,
      departmentFunctions,
    };
  }

  async setUserAppRole(
    userId: string,
    role: unknown,
  ): Promise<{ role: UserRole }> {
    if (role !== UserRole.User && role !== UserRole.SuperAdmin) {
      throw new BadRequestException('用户角色只能是普通用户或管理员');
    }
    return this.db.transaction(async (manager) => {
      const admins: Row[] = await manager.query(
        "SELECT id FROM users WHERE role = 'super_admin' FOR UPDATE",
      );
      const users: Row[] = await manager.query(
        'SELECT id, role FROM users WHERE id = ? FOR UPDATE',
        [userId],
      );
      if (!users.length) throw new NotFoundException('用户不存在');
      if (users[0].role === role) return { role };
      if (
        users[0].role === UserRole.SuperAdmin &&
        role === UserRole.User &&
        admins.length <= 1
      ) {
        throw new ConflictException('至少需要保留一位管理员');
      }
      await manager.query(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP(6) WHERE id = ?',
        [role, userId],
      );
      await manager.query(
        'UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP(6) WHERE user_id = ? AND revoked_at IS NULL',
        [userId],
      );
      return { role };
    });
  }

  async replaceBindings(
    kind: 'role' | 'user',
    id: string,
    ids: unknown,
  ): Promise<null> {
    if (
      !Array.isArray(ids) ||
      ids.some((value) => typeof value !== 'string' || !value.trim()) ||
      ids.length > 500
    )
      throw new BadRequestException('权限 ID 列表不合法');
    const unique = [...new Set(ids.map((value) => value.trim()))];
    const table =
      kind === 'role' ? 'dashboard_role_functions' : 'dashboard_user_roles';
    const key = kind === 'role' ? 'role_kvid' : 'user_id';
    const target = kind === 'role' ? 'function_kvid' : 'role_kvid';
    if (kind === 'role') await this.records.one('roles', id);
    else if (
      !(await this.db.query('SELECT id FROM users WHERE id = ?', [id])).length
    )
      throw new NotFoundException('用户不存在');
    await this.db.transaction(async (manager) => {
      await manager.query(`DELETE FROM ${table} WHERE ${key} = ?`, [id]);
      for (const value of unique)
        await manager.query(
          `INSERT INTO ${table} (${key}, ${target}) VALUES (?, ?)`,
          [id, value],
        );
    });
    return null;
  }

  async replaceFunctionRoles(
    functionKvid: string,
    ids: unknown,
  ): Promise<null> {
    if (
      !Array.isArray(ids) ||
      ids.some(
        (value) =>
          typeof value !== 'string' ||
          !value.trim() ||
          value.trim().length > 100,
      ) ||
      ids.length > 500
    ) {
      throw new BadRequestException('角色 ID 列表不合法');
    }
    await this.records.one('functions', functionKvid);
    const unique = [...new Set(ids.map((value: string) => value.trim()))];
    if (unique.length) {
      const existing: Row[] = await this.db.query(
        `SELECT kvid FROM dashboard_roles WHERE kvid IN (${unique.map(() => '?').join(', ')})`,
        unique,
      );
      if (existing.length !== unique.length)
        throw new BadRequestException('包含不存在的角色');
    }
    await this.db.transaction(async (manager) => {
      await manager.query(
        'DELETE FROM dashboard_role_functions WHERE function_kvid = ?',
        [functionKvid],
      );
      for (const roleKvid of unique) {
        await manager.query(
          'INSERT INTO dashboard_role_functions (role_kvid, function_kvid) VALUES (?, ?)',
          [roleKvid, functionKvid],
        );
      }
    });
    return null;
  }

  async replaceFunctionDepartments(
    functionKvid: string,
    ids: unknown,
  ): Promise<null> {
    if (
      !Array.isArray(ids) ||
      ids.some(
        (value) =>
          typeof value !== 'string' ||
          !value.trim() ||
          value.trim().length > 36,
      ) ||
      ids.length > 500
    ) {
      throw new BadRequestException('部门 ID 列表不合法');
    }
    await this.records.one('functions', functionKvid);
    const unique = [...new Set(ids.map((value: string) => value.trim()))];
    if (unique.length) {
      const existing: Row[] = await this.db.query(
        `SELECT id FROM dashboard_departments WHERE id IN (${unique.map(() => '?').join(', ')})`,
        unique,
      );
      if (existing.length !== unique.length)
        throw new BadRequestException('包含不存在的部门');
    }
    await this.db.transaction(async (manager) => {
      await manager.query(
        'DELETE FROM dashboard_department_functions WHERE function_kvid = ?',
        [functionKvid],
      );
      for (const departmentId of unique) {
        await manager.query(
          'INSERT INTO dashboard_department_functions (department_id, function_kvid) VALUES (?, ?)',
          [departmentId, functionKvid],
        );
      }
    });
    return null;
  }

  async replaceFunctionAccess(
    functionKvid: string,
    roleIds: unknown,
    departmentIds: unknown,
  ): Promise<null> {
    const validIds = (ids: unknown, maxLength: number) =>
      Array.isArray(ids) &&
      ids.length <= 500 &&
      ids.every(
        (value) =>
          typeof value === 'string' &&
          value.trim().length > 0 &&
          value.trim().length <= maxLength,
      );
    if (!validIds(roleIds, 100) || !validIds(departmentIds, 36))
      throw new BadRequestException('授权 ID 列表不合法');
    await this.records.one('functions', functionKvid);
    const uniqueRoles = [
      ...new Set((roleIds as string[]).map((value) => value.trim())),
    ];
    const uniqueDepartments = [
      ...new Set((departmentIds as string[]).map((value) => value.trim())),
    ];
    if (uniqueRoles.length) {
      const rows: Row[] = await this.db.query(
        "SELECT kvid FROM dashboard_roles WHERE code = 'user' AND is_active = true",
      );
      if (uniqueRoles.length !== 1 || uniqueRoles[0] !== rows[0]?.kvid)
        throw new BadRequestException('只能授权普通用户');
    }
    if (uniqueDepartments.length) {
      const rows: Row[] = await this.db.query(
        `SELECT id FROM dashboard_departments WHERE id IN (${uniqueDepartments.map(() => '?').join(', ')})`,
        uniqueDepartments,
      );
      if (rows.length !== uniqueDepartments.length)
        throw new BadRequestException('包含不存在的部门');
    }
    await this.db.transaction(async (manager) => {
      await manager.query(
        'DELETE FROM dashboard_role_functions WHERE function_kvid = ?',
        [functionKvid],
      );
      await manager.query(
        'DELETE FROM dashboard_department_functions WHERE function_kvid = ?',
        [functionKvid],
      );
      for (const roleId of uniqueRoles)
        await manager.query(
          'INSERT INTO dashboard_role_functions (role_kvid, function_kvid) VALUES (?, ?)',
          [roleId, functionKvid],
        );
      for (const departmentId of uniqueDepartments)
        await manager.query(
          'INSERT INTO dashboard_department_functions (department_id, function_kvid) VALUES (?, ?)',
          [departmentId, functionKvid],
        );
    });
    return null;
  }
}
