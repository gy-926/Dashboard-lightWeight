import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartments1789960000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE dashboard_departments (
      id char(36) NOT NULL,
      parent_id char(36) NULL,
      code varchar(100) NOT NULL,
      name varchar(255) NOT NULL,
      is_active boolean NOT NULL DEFAULT true,
      sort_order int NOT NULL DEFAULT 0,
      created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (id),
      UNIQUE KEY uq_dashboard_departments_code (code),
      KEY idx_dashboard_departments_parent (parent_id),
      CONSTRAINT fk_dashboard_departments_parent FOREIGN KEY (parent_id) REFERENCES dashboard_departments(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB`);
    await q.query(`ALTER TABLE users ADD COLUMN department_id char(36) NULL,
      ADD KEY idx_users_department (department_id),
      ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES dashboard_departments(id) ON DELETE RESTRICT`);
    await q.query(`CREATE TABLE dashboard_department_functions (
      department_id char(36) NOT NULL,
      function_kvid varchar(100) NOT NULL,
      PRIMARY KEY (department_id, function_kvid),
      KEY idx_dashboard_department_functions_function (function_kvid),
      CONSTRAINT fk_dashboard_department_functions_department FOREIGN KEY (department_id) REFERENCES dashboard_departments(id) ON DELETE CASCADE,
      CONSTRAINT fk_dashboard_department_functions_function FOREIGN KEY (function_kvid) REFERENCES dashboard_functions(kvid) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE dashboard_department_functions');
    await q.query('ALTER TABLE users DROP FOREIGN KEY fk_users_department, DROP KEY idx_users_department, DROP COLUMN department_id');
    await q.query('DROP TABLE dashboard_departments');
  }
}
