#!/usr/bin/env npx tsx
/**
 * Change admin password on the server.
 * Usage (on droplet, from app dir):
 *   npx tsx scripts/change-admin-password.ts "YourNewPassword"
 * Or with env (no password in shell history):
 *   ADMIN_NEW_PASSWORD=YourNewPassword npx tsx scripts/change-admin-password.ts
 *
 * Requires .env.local with DB_* and optionally ADMIN_EMAIL (default admin@khalijtamweel.com).
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function changeAdminPassword() {
  const newPassword = process.env.ADMIN_NEW_PASSWORD || process.argv[2];
  if (!newPassword || newPassword.length < 6) {
    console.error('Usage: npx tsx scripts/change-admin-password.ts "NewPassword"');
    console.error('   or: ADMIN_NEW_PASSWORD=NewPassword npx tsx scripts/change-admin-password.ts');
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const { default: pool } = await import('../src/lib/db');
  const { hashPassword } = await import('../src/lib/auth');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@khalijtamweel.com';

  try {
    const [rows] = await pool.query('SELECT id, email FROM users WHERE role = ? AND email = ?', ['admin', adminEmail]) as any[];
    if (!rows || rows.length === 0) {
      console.error('Admin user not found for email:', adminEmail);
      process.exit(1);
    }

    const passwordHash = await hashPassword(newPassword);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, rows[0].id]);

    console.log('Admin password updated successfully for', rows[0].email);
  } catch (error) {
    console.error('Failed to change admin password:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

changeAdminPassword();
