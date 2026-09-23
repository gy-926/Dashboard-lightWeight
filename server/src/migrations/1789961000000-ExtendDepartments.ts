import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendDepartments1789961000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE dashboard_departments
      ADD COLUMN kind varchar(20) NOT NULL DEFAULT 'department',
      ADD COLUMN full_name varchar(255) NOT NULL DEFAULT '',
      ADD COLUMN address varchar(500) NULL,
      ADD COLUMN mnemonic_code varchar(100) NULL,
      ADD COLUMN internal_code varchar(100) NULL,
      ADD UNIQUE KEY uq_dashboard_departments_internal_code (internal_code)`);
    await q.query(`UPDATE dashboard_departments
      SET kind = IF(parent_id IS NULL, 'organization', 'department'),
          full_name = name,
          internal_code = code`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE dashboard_departments
      DROP KEY uq_dashboard_departments_internal_code,
      DROP COLUMN internal_code,
      DROP COLUMN mnemonic_code,
      DROP COLUMN address,
      DROP COLUMN full_name,
      DROP COLUMN kind`);
  }
}
