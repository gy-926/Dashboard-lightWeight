import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentManagerAndFloor1789962000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE dashboard_departments
      ADD COLUMN manager_user_id char(36) NULL,
      ADD COLUMN floor varchar(100) NULL,
      ADD KEY idx_dashboard_departments_manager (manager_user_id),
      ADD CONSTRAINT fk_dashboard_departments_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE dashboard_departments
      DROP FOREIGN KEY fk_dashboard_departments_manager,
      DROP KEY idx_dashboard_departments_manager,
      DROP COLUMN floor,
      DROP COLUMN manager_user_id`);
  }
}
