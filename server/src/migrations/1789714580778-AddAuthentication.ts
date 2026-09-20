import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthentication1789714580778 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `users` ADD COLUMN `password_hash` VARCHAR(255) NULL;',
    );
    await queryRunner.query(`
      CREATE TABLE \`auth_sessions\` (
        \`id\` CHAR(36) NOT NULL,
        \`user_id\` CHAR(36) NOT NULL,
        \`access_hash\` CHAR(64) NOT NULL,
        \`refresh_hash\` CHAR(64) NOT NULL,
        \`access_expires_at\` DATETIME(6) NOT NULL,
        \`refresh_expires_at\` DATETIME(6) NOT NULL,
        \`revoked_at\` DATETIME(6) NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_auth_sessions_access_hash\` (\`access_hash\`),
        UNIQUE KEY \`uq_auth_sessions_refresh_hash\` (\`refresh_hash\`),
        KEY \`idx_auth_sessions_user_id\` (\`user_id\`),
        CONSTRAINT \`fk_auth_sessions_user\` FOREIGN KEY (\`user_id\`)
          REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE `auth_sessions`;');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `password_hash`;');
  }
}
