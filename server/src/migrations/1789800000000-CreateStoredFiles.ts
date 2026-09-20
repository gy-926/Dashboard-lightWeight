import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStoredFiles1789800000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE \`stored_files\` (
      \`id\` char(36) NOT NULL,
      \`owner_user_id\` char(36) NOT NULL,
      \`original_name\` varchar(255) NOT NULL,
      \`stored_name\` char(36) NOT NULL,
      \`mime_type\` varchar(255) NOT NULL,
      \`size\` int unsigned NOT NULL,
      \`sha256\` char(64) NOT NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_stored_files_stored_name\` (\`stored_name\`),
      KEY \`idx_stored_files_owner_created\` (\`owner_user_id\`, \`created_at\`),
      CONSTRAINT \`fk_stored_files_owner\` FOREIGN KEY (\`owner_user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE `stored_files`');
  }
}
