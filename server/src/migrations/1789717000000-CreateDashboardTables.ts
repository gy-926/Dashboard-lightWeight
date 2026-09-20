import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardTables1789717000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE dashboard_functions (
      kvid varchar(100) PRIMARY KEY, title varchar(255) NULL, handler varchar(500) NOT NULL,
      remark text NULL, parameters json NULL, render_type enum('webview','vue','umd') NOT NULL DEFAULT 'webview',
      source_type enum('manual','umd','system') NOT NULL DEFAULT 'manual',
      source_module varchar(255) NULL, source_url text NULL, source_component varchar(255) NULL,
      icon varchar(255) NULL, sort_order int NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE dashboard_menu_roots (
      kvid varchar(100) PRIMARY KEY, title varchar(255) NOT NULL, display_name varchar(255) NULL,
      internal_code varchar(100) NOT NULL UNIQUE, scope varchar(100) NOT NULL DEFAULT 'Member',
      sort_order int NOT NULL DEFAULT 0, icon varchar(255) NULL, remark text NULL, parameters json NULL
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE dashboard_menus (
      kvid varchar(100) PRIMARY KEY, parent_kvid varchar(100) NULL, menu_root_kvid varchar(100) NOT NULL,
      title varchar(255) NOT NULL, display_name varchar(255) NULL, internal_code varchar(100) NULL,
      scope varchar(100) NOT NULL DEFAULT 'Member', type enum('Page','Folder','Link','System') NOT NULL,
      icon varchar(255) NULL, sort_order int NOT NULL DEFAULT 0, remark text NULL,
      function_kvid varchar(100) NULL, parameters json NULL, is_active boolean NOT NULL DEFAULT true,
      INDEX idx_menu_root (menu_root_kvid), INDEX idx_menu_parent (parent_kvid),
      CONSTRAINT fk_menu_root FOREIGN KEY (menu_root_kvid) REFERENCES dashboard_menu_roots(kvid) ON DELETE CASCADE,
      CONSTRAINT fk_menu_function FOREIGN KEY (function_kvid) REFERENCES dashboard_functions(kvid) ON DELETE SET NULL
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE dashboard_roles (
      kvid varchar(100) PRIMARY KEY, code varchar(100) NOT NULL UNIQUE, name varchar(255) NOT NULL,
      remark text NULL, is_active boolean NOT NULL DEFAULT true
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE dashboard_role_functions (
      role_kvid varchar(100) NOT NULL, function_kvid varchar(100) NOT NULL,
      PRIMARY KEY (role_kvid, function_kvid),
      FOREIGN KEY (role_kvid) REFERENCES dashboard_roles(kvid) ON DELETE CASCADE,
      FOREIGN KEY (function_kvid) REFERENCES dashboard_functions(kvid) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE dashboard_user_roles (
      user_id char(36) NOT NULL, role_kvid varchar(100) NOT NULL,
      PRIMARY KEY (user_id, role_kvid),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_kvid) REFERENCES dashboard_roles(kvid) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }

  async down(q: QueryRunner): Promise<void> {
    for (const table of ['dashboard_user_roles', 'dashboard_role_functions', 'dashboard_roles', 'dashboard_menus', 'dashboard_menu_roots', 'dashboard_functions']) {
      await q.query(`DROP TABLE ${table}`);
    }
  }
}
