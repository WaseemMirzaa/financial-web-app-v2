/**
 * Create admin user in DB (used by Digital Ocean setup script).
 * Env: ADMIN_EMAIL (optional), ADMIN_PASSWORD (required — no default).
 * DB from .env.local.
 */
require('dotenv').config({ path: require('path').join(process.cwd(), '.env.local') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@khalijtamweel.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 8) {
  console.error('Set ADMIN_PASSWORD (min 8 characters) in the environment before running create-admin-do.js');
  process.exit(1);
}

async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'financial_app',
    port: parseInt(process.env.DB_PORT || '3306', 10),
  });
  const [existing] = await c.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
  if (existing.length > 0) {
    console.log('Admin already exists:', ADMIN_EMAIL);
    await c.end();
    process.exit(0);
  }
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const id = 'admin-1';
  await c.query(
    "INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, 'admin', TRUE)",
    [id, ADMIN_EMAIL, hash]
  );
  await c.query(
    "INSERT INTO user_translations (user_id, locale, name) VALUES (?, 'en', ?), (?, 'ar', ?)",
    [id, 'Khalijtamweel', id, 'خليج تمويل']
  );
  console.log('Admin created:', ADMIN_EMAIL, '| Password: (set via ADMIN_PASSWORD — not echoed)');
  await c.end();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
