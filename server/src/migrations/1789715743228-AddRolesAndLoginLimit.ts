import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRolesAndLoginLimit1789715743228 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`role\` ENUM('user', 'super_admin') NOT NULL DEFAULT 'user';
    `);
    await queryRunner.query(`
      CREATE TABLE \`auth_login_attempts\` (
        \`email_hash\` CHAR(64) NOT NULL PRIMARY KEY,
        \`failed_count\` INT NOT NULL DEFAULT 0,
        \`window_started_at\` DATETIME(6) NULL,
        \`locked_until\` DATETIME(6) NULL
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `auth_login_attempts`;');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `role`;');
  }
}
