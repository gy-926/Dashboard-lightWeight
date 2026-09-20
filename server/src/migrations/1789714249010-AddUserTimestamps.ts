import { MigrationInterface, QueryRunner } from 'typeorm';

// 为已有用户补上迁移执行时的时间，并为后续写入自动维护时间。
export class AddUserTimestamps1789714249010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD COLUMN \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        ADD COLUMN \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP COLUMN \`updated_at\`,
        DROP COLUMN \`created_at\`;
    `);
  }
}
