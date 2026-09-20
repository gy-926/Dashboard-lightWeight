import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDashboardDefaults1789717001000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query("INSERT IGNORE INTO dashboard_roles (kvid, code, name, remark, is_active) VALUES ('role-admin', 'admin', '管理员', '拥有全部功能访问与维护权限', true), ('role-demo', 'demo', '演示账号', '仅授予指定功能访问权限', true), ('role-viewer', 'viewer', '只读账号', '仅查看授权功能', true)");
    await q.query("INSERT IGNORE INTO dashboard_functions (kvid, handler, title, render_type, source_type) VALUES ('func-demo-iframe', 'https://example.com', 'iframe 示例', 'webview', 'manual')");
    await q.query("INSERT IGNORE INTO dashboard_menu_roots (kvid, title, display_name, internal_code) VALUES ('root-mock', 'GavinYin Hub', 'GavinYin Hub', 'umdDashboard')");
    await q.query("INSERT IGNORE INTO dashboard_menus (kvid, menu_root_kvid, title, type, icon, sort_order) VALUES ('mock-demo', 'root-mock', '功能演示', 'Folder', 'fas fa-flask', 1)");
    await q.query("INSERT IGNORE INTO dashboard_menus (kvid, parent_kvid, menu_root_kvid, title, display_name, type, icon, sort_order, function_kvid) VALUES ('mock-demo-iframe', 'mock-demo', 'root-mock', 'iframe 嵌入示例', 'iframe 嵌入示例', 'Page', 'fas fa-window-restore', 1, 'func-demo-iframe')");
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query("DELETE FROM dashboard_menus WHERE kvid IN ('mock-demo-iframe','mock-demo')");
    await q.query("DELETE FROM dashboard_menu_roots WHERE kvid = 'root-mock'");
    await q.query("DELETE FROM dashboard_functions WHERE kvid = 'func-demo-iframe'");
    await q.query("DELETE FROM dashboard_roles WHERE kvid IN ('role-admin','role-demo','role-viewer')");
  }
}
