import { MigrationInterface, QueryRunner } from 'typeorm';

// 将 users 表的整数主键转换为 UUID，同时保留已有用户的 name 与 email 数据。
export class ConvertUsersIdToUuid1788767895030 implements MigrationInterface {
  // 执行升级：将旧整数 id 替换为 UUID 字符串 id。
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 临时添加 UUID 列；先允许为空，方便为已有用户补齐 UUID。
    await queryRunner.query(
      'ALTER TABLE `users` ADD COLUMN `uuid` CHAR(36) NULL AFTER `id`;',
    );

    // 为已有记录生成 UUID，保留其他用户数据不变。
    await queryRunner.query(
      'UPDATE `users` SET `uuid` = UUID() WHERE `uuid` IS NULL;',
    );

    // 所有记录已有 UUID 后，将该列设为非空。
    await queryRunner.query(
      'ALTER TABLE `users` MODIFY `uuid` CHAR(36) NOT NULL;',
    );

    // 删除旧主键前必须先移除 id 的 AUTO_INCREMENT 属性。
    await queryRunner.query('ALTER TABLE `users` MODIFY `id` INT NOT NULL;');
    await queryRunner.query('ALTER TABLE `users` DROP PRIMARY KEY;');

    // 删除旧整数 id，将 UUID 列改名为 id，并将它设置为新的主键。
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `id`;');
    await queryRunner.query(
      'ALTER TABLE `users` CHANGE COLUMN `uuid` `id` CHAR(36) NOT NULL;',
    );
    await queryRunner.query('ALTER TABLE `users` ADD PRIMARY KEY (`id`);');
  }

  // 执行回滚：恢复整数自增主键。
  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除 UUID 主键后，创建新的整数自增主键列。
    await queryRunner.query('ALTER TABLE `users` DROP PRIMARY KEY;');
    await queryRunner.query(
      'ALTER TABLE `users` ADD COLUMN `numeric_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST;',
    );

    // UUID 无法还原为原来的整数值；回滚会重新分配整数 ID，但保留用户其他数据。
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `id`;');
    await queryRunner.query(
      'ALTER TABLE `users` CHANGE COLUMN `numeric_id` `id` INT NOT NULL AUTO_INCREMENT;',
    );
  }
}
