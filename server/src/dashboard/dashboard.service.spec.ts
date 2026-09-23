import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { DataSource } from 'typeorm';
import type { FilesService } from '../files/files.service.js';
import { DashboardService } from './dashboard.service.js';
import { UserRole } from '../users/entities/user.entity.js';

describe('DashboardService account roles', () => {
  it('updates the account role and revokes existing sessions in one transaction', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ id: 'admin-1' }, { id: 'admin-2' }])
      .mockResolvedValueOnce([{ id: 'user-1', role: UserRole.User }])
      .mockResolvedValue([]);
    const db = { transaction: vi.fn(async callback => callback({ query })) } as unknown as DataSource;
    const service = new DashboardService(db, {} as FilesService);

    await expect(service.setUserAppRole('user-1', UserRole.SuperAdmin)).resolves.toEqual({ role: UserRole.SuperAdmin });
    expect(query).toHaveBeenNthCalledWith(3, 'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP(6) WHERE id = ?', [UserRole.SuperAdmin, 'user-1']);
    expect(query).toHaveBeenNthCalledWith(4, 'UPDATE auth_sessions SET revoked_at = CURRENT_TIMESTAMP(6) WHERE user_id = ? AND revoked_at IS NULL', ['user-1']);
  });

  it('keeps the last administrator', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ id: 'admin-1' }])
      .mockResolvedValueOnce([{ id: 'admin-1', role: UserRole.SuperAdmin }]);
    const db = { transaction: vi.fn(async callback => callback({ query })) } as unknown as DataSource;
    const service = new DashboardService(db, {} as FilesService);

    await expect(service.setUserAppRole('admin-1', UserRole.User)).rejects.toBeInstanceOf(ConflictException);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('rejects roles outside the two account types', async () => {
    const db = { transaction: vi.fn() } as unknown as DataSource;
    const service = new DashboardService(db, {} as FilesService);

    await expect(service.setUserAppRole('user-1', 'demo')).rejects.toBeInstanceOf(BadRequestException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe('DashboardService UMD versions', () => {
  const version = {
    id: 'version-id',
    package_id: 'package-id',
    module_key: 'example',
    name: 'Example',
    version: '1.0.0',
    file_id: 'file-id',
    original_name: 'example.umd.js',
    stored_name: 'stored-id',
    size: 12,
    manifest: '{}',
    is_current: 1,
  };

  it('reports a missing local file without exposing its stored name', async () => {
    const db = { query: vi.fn().mockResolvedValue([version]) } as unknown as DataSource;
    const files = { isStoredFileAvailable: vi.fn().mockResolvedValue(false) } as unknown as FilesService;
    const service = new DashboardService(db, files);

    const [result] = await service.umdVersions();

    expect(result.file_available).toBe(false);
    expect(result.is_current).toBe(true);
    expect(result).not.toHaveProperty('stored_name');
    expect(files.isStoredFileAvailable).toHaveBeenCalledWith('stored-id', 12);
  });

  it('refuses to activate a version whose file is missing', async () => {
    const db = {
      query: vi.fn().mockResolvedValue([version]),
      transaction: vi.fn(),
    } as unknown as DataSource;
    const files = { isStoredFileAvailable: vi.fn().mockResolvedValue(false) } as unknown as FilesService;
    const service = new DashboardService(db, files);

    await expect(service.activateUmdVersion(version.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});

describe('DashboardService function role authorization', () => {
  it('replaces only the selected function bindings in one transaction', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const db = {
      query: vi.fn()
        .mockResolvedValueOnce([{ kvid: 'function-id' }])
        .mockResolvedValueOnce([{ kvid: 'role-a' }, { kvid: 'role-b' }]),
      transaction: vi.fn(async callback => callback({ query })),
    } as unknown as DataSource;
    const service = new DashboardService(db, {} as FilesService);

    await service.replaceFunctionRoles('function-id', ['role-a', 'role-a', 'role-b']);

    expect(query).toHaveBeenCalledTimes(3);
    expect(query).toHaveBeenNthCalledWith(1, 'DELETE FROM dashboard_role_functions WHERE function_kvid = ?', ['function-id']);
    expect(query).toHaveBeenNthCalledWith(2, 'INSERT INTO dashboard_role_functions (role_kvid, function_kvid) VALUES (?, ?)', ['role-a', 'function-id']);
    expect(query).toHaveBeenNthCalledWith(3, 'INSERT INTO dashboard_role_functions (role_kvid, function_kvid) VALUES (?, ?)', ['role-b', 'function-id']);
  });
});

describe('DashboardService department access', () => {
  it('saves the organization form fields and generates a stable code when the optional internal code is blank', async () => {
    const query = vi.fn(async (sql: string, _params?: unknown[]) => {
      if (sql.startsWith('SELECT id, code FROM dashboard_departments')) return [];
      if (sql.startsWith('SELECT id, parent_id, code, name, kind')) return [{ id: '11111111-1111-4111-8111-111111111111', name: '测试平台', kind: 'organization', full_name: '测试平台', is_active: 1 }];
      return [];
    });
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);

    const result = await service.saveDepartment({
      id: '11111111-1111-4111-8111-111111111111',
      name: '测试平台', full_name: '测试平台', kind: 'organization',
      address: '一层', mnemonic_code: 'CPB', internal_code: '', parent_id: null,
    });

    expect(result.full_name).toBe('测试平台');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO dashboard_departments'), expect.arrayContaining(['organization', '测试平台', '一层', 'CPB', null]));
    const insertArgs = query.mock.calls.find(([sql]) => sql.startsWith('INSERT INTO dashboard_departments'))?.[1] as string[];
    expect(insertArgs[2]).toMatch(/^dept_[0-9a-f]{32}$/);
  });

  it('rejects a department at the root and an organization below another node', async () => {
    const query = vi.fn();
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);
    const base = { id: '11111111-1111-4111-8111-111111111111', name: '测试', full_name: '测试' };

    await expect(service.saveDepartment({ ...base, parent_id: null, kind: 'department' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.saveDepartment({ ...base, parent_id: '22222222-2222-4222-8222-222222222222', kind: 'organization' })).rejects.toBeInstanceOf(BadRequestException);
    expect(query).not.toHaveBeenCalled();
  });

  it('stores a department manager and floor while using its name as the full name', async () => {
    const parentId = '22222222-2222-4222-8222-222222222222';
    const managerId = '33333333-3333-4333-8333-333333333333';
    const query = vi.fn(async (sql: string, _params?: unknown[]) => {
      if (sql.startsWith('SELECT parent_id FROM dashboard_departments')) return [{ parent_id: null }];
      if (sql.startsWith('SELECT id FROM users')) return [{ id: managerId }];
      if (sql.startsWith('SELECT id, code FROM dashboard_departments')) return [];
      if (sql.startsWith('SELECT id, parent_id, code, name, kind')) return [{ id: '11111111-1111-4111-8111-111111111111', name: '产品部', full_name: '产品部', manager_user_id: managerId, floor: '3 楼', is_active: 1 }];
      return [];
    });
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);

    const result = await service.saveDepartment({
      id: '11111111-1111-4111-8111-111111111111', parent_id: parentId,
      name: '产品部', full_name: '旧全称', kind: 'department',
      manager_user_id: managerId, floor: '3 楼',
    });

    expect(result.manager_user_id).toBe(managerId);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO dashboard_departments'), expect.arrayContaining(['产品部', managerId, '3 楼']));
    const insertArgs = query.mock.calls.find(([sql]) => sql.startsWith('INSERT INTO dashboard_departments'))?.[1] as string[];
    expect(insertArgs[4]).toBe('department');
    expect(insertArgs[5]).toBe('产品部');
  });

  it('assigns selected users to a department in one update', async () => {
    const departmentId = '11111111-1111-4111-8111-111111111111';
    const userA = '22222222-2222-4222-8222-222222222222';
    const userB = '33333333-3333-4333-8333-333333333333';
    const query = vi.fn(async (sql: string) => {
      if (sql.startsWith('SELECT id FROM dashboard_departments')) return [{ id: departmentId }];
      if (sql.startsWith('SELECT id FROM users')) return [{ id: userA }, { id: userB }];
      return [];
    });
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);

    await expect(service.addDepartmentUsers(departmentId, [userA, userB, userA])).resolves.toEqual({ assigned: 2 });
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users SET department_id = ? WHERE id IN'), [departmentId, userA, userB]);
    expect(query.mock.calls.filter(([sql]) => sql.startsWith('UPDATE users'))).toHaveLength(1);
  });

  it('shows only functions granted to ordinary users and the department hierarchy', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('FROM dashboard_menu_roots')) return [{ kvid: 'root-id', title: 'Workspace', display_name: 'Workspace' }];
      if (sql.includes('FROM dashboard_menus m')) return [
        { kvid: 'both-menu', parent_kvid: null, function_kvid: 'both', handler: '/both', parameters: '{}', title: 'Both' },
        { kvid: 'role-menu', parent_kvid: null, function_kvid: 'role-only', handler: '/role', parameters: '{}', title: 'Role only' },
        { kvid: 'department-menu', parent_kvid: null, function_kvid: 'department-only', handler: '/department', parameters: '{}', title: 'Department only' },
      ];
      if (sql.includes('FROM dashboard_role_functions rf')) return [{ function_kvid: 'both' }, { function_kvid: 'role-only' }];
      if (sql.includes('WITH RECURSIVE department_path')) return [{ function_kvid: 'both' }, { function_kvid: 'department-only' }];
      return [];
    });
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);

    const result = await service.runtime('workspace', 'user-id', false);

    expect(result.MenusMain.Results.map((item: { Kvid: string }) => item.Kvid)).toEqual(['both-menu']);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("r.code = 'user'"));
    expect(query.mock.calls.some(([sql]) => sql.includes('dashboard_user_roles'))).toBe(false);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('WITH RECURSIVE department_path'), ['user-id']);
  });

  it('ignores old custom role bindings when ordinary access is empty', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('FROM dashboard_menu_roots')) return [{ kvid: 'root-id', title: 'Workspace' }];
      if (sql.includes('FROM dashboard_menus m')) return [{ kvid: 'legacy-menu', parent_kvid: null, function_kvid: 'legacy-function', handler: '/legacy', parameters: '{}' }];
      if (sql.includes('FROM dashboard_role_functions rf')) return [];
      if (sql.includes('WITH RECURSIVE department_path')) return [{ function_kvid: 'legacy-function' }];
      return [];
    });
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);

    const result = await service.runtime('workspace', 'user-id', false);

    expect(result.MenusMain.Results).toEqual([]);
    expect(query).toHaveBeenCalledWith(expect.stringContaining("r.code = 'user'"));
  });

  it('allows administrators without ordinary or department grants', async () => {
    const query = vi.fn(async (sql: string) => {
      if (sql.includes('FROM dashboard_menu_roots')) return [{ kvid: 'root-id', title: 'Workspace' }];
      if (sql.includes('FROM dashboard_menus m')) return [{ kvid: 'admin-menu', parent_kvid: null, function_kvid: 'admin-function', handler: '/admin', parameters: '{}' }];
      return [];
    });
    const service = new DashboardService({ query } as unknown as DataSource, {} as FilesService);

    const result = await service.runtime('workspace', 'admin-id', true);

    expect(result.MenusMain.Results.map((item: { Kvid: string }) => item.Kvid)).toEqual(['admin-menu']);
    expect(query.mock.calls.some(([sql]) => sql.includes('dashboard_role_functions') || sql.includes('department_path'))).toBe(false);
  });

  it('saves role and department grants in one transaction', async () => {
    const writes = vi.fn().mockResolvedValue([]);
    const db = {
      query: vi.fn()
        .mockResolvedValueOnce([{ kvid: 'function-id' }])
        .mockResolvedValueOnce([{ kvid: 'role-user' }])
        .mockResolvedValueOnce([{ id: 'department-id' }]),
      transaction: vi.fn(async callback => callback({ query: writes })),
    } as unknown as DataSource;
    const service = new DashboardService(db, {} as FilesService);

    await service.replaceFunctionAccess('function-id', ['role-user'], ['department-id']);

    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(writes).toHaveBeenNthCalledWith(1, 'DELETE FROM dashboard_role_functions WHERE function_kvid = ?', ['function-id']);
    expect(writes).toHaveBeenNthCalledWith(2, 'DELETE FROM dashboard_department_functions WHERE function_kvid = ?', ['function-id']);
    expect(writes).toHaveBeenNthCalledWith(3, 'INSERT INTO dashboard_role_functions (role_kvid, function_kvid) VALUES (?, ?)', ['role-user', 'function-id']);
    expect(writes).toHaveBeenNthCalledWith(4, 'INSERT INTO dashboard_department_functions (department_id, function_kvid) VALUES (?, ?)', ['department-id', 'function-id']);
  });

  it('rejects legacy custom roles from the feature access endpoint', async () => {
    const db = {
      query: vi.fn()
        .mockResolvedValueOnce([{ kvid: 'function-id' }])
        .mockResolvedValueOnce([{ kvid: 'role-user' }]),
      transaction: vi.fn(),
    } as unknown as DataSource;
    const service = new DashboardService(db, {} as FilesService);

    await expect(service.replaceFunctionAccess('function-id', ['role-demo'], [])).rejects.toBeInstanceOf(BadRequestException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
});
