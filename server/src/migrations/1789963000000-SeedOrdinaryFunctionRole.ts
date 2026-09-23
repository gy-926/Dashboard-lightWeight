import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedOrdinaryFunctionRole1789963000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query("INSERT IGNORE INTO dashboard_roles (kvid, code, name, remark, is_active) VALUES ('role-user', 'user', '普通用户', '普通用户的功能访问还需同时获得部门授权', true)");
    await q.query("UPDATE dashboard_roles SET name = '普通用户', is_active = true WHERE code = 'user'");
    await q.query("DELETE rf FROM dashboard_role_functions rf JOIN dashboard_roles r ON r.kvid = rf.role_kvid WHERE r.code = 'user'");
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query("DELETE FROM dashboard_role_functions WHERE role_kvid = 'role-user'");
    await q.query("DELETE FROM dashboard_roles WHERE kvid = 'role-user'");
  }
}
