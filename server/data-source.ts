// Node 24 内置：从本地 .env 读取数据库配置。
// .env 已被 Git 忽略，不会泄露密码。
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity.js';

// 让 TypeORM CLI 也能读取与 Nest 服务相同的数据库环境变量。
if (existsSync('.env')) loadEnvFile('.env');

// Migration 命令使用的独立数据库连接配置。
export default new DataSource({
  // 当前数据库类型。
  type: 'mysql',

  // 读取本机 .env；未填写主机和端口时采用本地默认值。
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),

  // 这些变量必须在 .env 中配置。
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // 告诉 TypeORM：User 类对应数据库中的 users 表。
  entities: [User],

  // 告诉 TypeORM：Migration 源文件都放在这里。
  migrations: ['src/migrations/*.ts'],
});