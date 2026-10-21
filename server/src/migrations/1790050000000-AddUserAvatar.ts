import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAvatar1790050000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE `users` ADD COLUMN `avatar_file_id` char(36) NULL, ADD KEY `idx_users_avatar_file` (`avatar_file_id`), ADD CONSTRAINT `fk_users_avatar_file` FOREIGN KEY (`avatar_file_id`) REFERENCES `stored_files` (`id`) ON DELETE SET NULL',
    );
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query(
      'ALTER TABLE `users` DROP FOREIGN KEY `fk_users_avatar_file`, DROP INDEX `idx_users_avatar_file`, DROP COLUMN `avatar_file_id`',
    );
  }
}
