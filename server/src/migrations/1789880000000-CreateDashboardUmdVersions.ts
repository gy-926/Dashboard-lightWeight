import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDashboardUmdVersions1789880000000 implements MigrationInterface {
  async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE TABLE IF NOT EXISTS \`dashboard_umd_packages\` (
      \`id\` char(36) NOT NULL,
      \`module_key\` varchar(120) NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_dashboard_umd_packages_module_key\` (\`module_key\`)
    ) ENGINE=InnoDB`);
    await q.query(`CREATE TABLE IF NOT EXISTS \`dashboard_umd_versions\` (
      \`id\` char(36) NOT NULL,
      \`package_id\` char(36) NOT NULL,
      \`version\` varchar(64) NOT NULL,
      \`file_id\` char(36) NOT NULL,
      \`manifest\` json NOT NULL,
      \`created_by\` char(36) NOT NULL,
      \`is_current\` boolean NOT NULL DEFAULT false,
      \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uq_dashboard_umd_package_version\` (\`package_id\`, \`version\`),
      KEY \`idx_dashboard_umd_versions_current\` (\`package_id\`, \`is_current\`),
      CONSTRAINT \`fk_dashboard_umd_versions_package\` FOREIGN KEY (\`package_id\`) REFERENCES \`dashboard_umd_packages\` (\`id\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_dashboard_umd_versions_file\` FOREIGN KEY (\`file_id\`) REFERENCES \`stored_files\` (\`id\`) ON DELETE RESTRICT,
      CONSTRAINT \`fk_dashboard_umd_versions_user\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT
    ) ENGINE=InnoDB`);
  }

  async down(q: QueryRunner): Promise<void> {
    await q.query('DROP TABLE IF EXISTS `dashboard_umd_versions`');
    await q.query('DROP TABLE IF EXISTS `dashboard_umd_packages`');
  }
}
