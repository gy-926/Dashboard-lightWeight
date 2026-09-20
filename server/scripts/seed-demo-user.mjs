import { randomBytes, randomUUID, scrypt as scryptCallback } from 'node:crypto';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { promisify } from 'node:util';
import mysql from 'mysql2/promise';

if (existsSync('.env')) loadEnvFile('.env');

const email = (process.env.DEMO_ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
const password = process.env.DEMO_ADMIN_PASSWORD || 'admin@123456';
const name = process.env.DEMO_ADMIN_NAME || 'Demo Admin';
const scrypt = promisify(scryptCallback);

async function hashPassword(value) {
  const salt = randomBytes(16);
  const key = await scrypt(value, salt, 64, {
    N: 1 << 17,
    r: 8,
    p: 1,
    maxmem: 256 * 1024 * 1024,
  });
  return `scrypt$${1 << 17}$8$1$${salt.toString('hex')}$${key.toString('hex')}`;
}

const database = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

try {
  const [rows] = await database.execute('SELECT id FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    await database.execute(
      "INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, 'super_admin')",
      [randomUUID(), name, email, await hashPassword(password)],
    );
    console.log(`已创建本地演示管理员：${email}`);
  } else {
    await database.execute("UPDATE users SET role = 'super_admin' WHERE email = ?", [email]);
    console.log(`本地演示管理员已存在：${email}（保留原密码）`);
  }
} finally {
  await database.end();
}
