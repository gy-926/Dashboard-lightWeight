import mysql from 'mysql2/promise';

const email = process.env.DEMO_ADMIN_EMAIL || 'admin@example.com';
const password = process.env.DEMO_ADMIN_PASSWORD || 'admin@123456';
const apiBaseUrl = process.env.API_BASE_URL || 'http://api:3000';

const registration = await fetch(`${apiBaseUrl}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Demo Admin', email, password }),
});

if (!registration.ok && registration.status !== 409) {
  throw new Error(`创建演示账号失败（HTTP ${registration.status}）：${await registration.text()}`);
}

const database = await mysql.createConnection({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'dashboard',
  password: process.env.DB_PASSWORD || 'dashboard-demo-password',
  database: process.env.DB_NAME || 'dashboard_demo',
});

try {
  const [result] = await database.execute(
    "UPDATE users SET role = 'super_admin' WHERE email = ? AND password_hash IS NOT NULL",
    [email],
  );
  if (result.affectedRows !== 1) throw new Error(`无法确认演示管理员账号：${email}`);
  console.log(`演示管理员已就绪：${email}`);
} finally {
  await database.end();
}
