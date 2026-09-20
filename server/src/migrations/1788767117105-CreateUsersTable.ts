import { MigrationInterface, QueryRunner } from 'typeorm';

// 创建 users 表的数据库结构变更记录。
export class CreateUsersTable1788767117105 implements MigrationInterface {
  // 执行 Migration 时调用：创建 users 表。
  public async up(queryRunner: QueryRunner): Promise<void> {
    // queryRunner.query() 直接向 MySQL 执行 SQL。
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        -- 自增主键，对应 User Entity 中的 id。
        \`id\` INT NOT NULL AUTO_INCREMENT,

        -- 用户名称，最长 100 个字符。
        \`name\` VARCHAR(100) NOT NULL,

        -- 用户邮箱，最长 255 个字符，且数据库层面必须唯一。
        \`email\` VARCHAR(255) NOT NULL UNIQUE,

        -- 指定 id 是这张表的主键。
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);
  }

  // 回滚 Migration 时调用：删除 users 表。
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 与 up() 相反，使数据库回到创建 users 表之前的状态。
    await queryRunner.query('DROP TABLE IF EXISTS `users`;');
  }
}