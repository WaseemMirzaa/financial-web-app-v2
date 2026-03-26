import { loadEnvFiles } from './load-env';

loadEnvFiles();

async function seedAdmin() {
  const { default: pool } = await import('../src/lib/db');
  const { hashPassword } = await import('../src/lib/auth');
  const { saveUserNameTranslations } = await import('../src/lib/translations');

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    console.error(
      'Set ADMIN_EMAIL in `.env` or `.env.local` (same file as your DB settings).'
    );
    process.exit(1);
  }
  if (!password || password.length < 8) {
    console.error(
      'Set ADMIN_PASSWORD in `.env` or `.env.local` (min 8 characters).'
    );
    process.exit(1);
  }

  try {
    const adminId = 'admin-1';
    const nameEn = 'Khalijtamweel';
    const nameAr = 'خليج تمويل';

    // Check if admin already exists
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user (is_deleted for schema compatibility; fallback if column missing)
    try {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, role, is_active, is_deleted) VALUES (?, ?, ?, 'admin', TRUE, FALSE)`,
        [adminId, email, passwordHash]
      );
    } catch (e: any) {
      if (e?.code === 'ER_BAD_FIELD_ERROR' && e?.message?.includes('is_deleted')) {
        await pool.query(
          `INSERT INTO users (id, email, password_hash, role, is_active) VALUES (?, ?, ?, 'admin', TRUE)`,
          [adminId, email, passwordHash]
        );
      } else throw e;
    }

    // Save translations
    await saveUserNameTranslations(adminId, nameEn, nameAr);

    console.log('Admin user created successfully!');
    console.log(`Email: ${email}`);
    console.log('Password: (value from ADMIN_PASSWORD in your env file — not shown)');
  } catch (error) {
    console.error('Failed to seed admin user:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedAdmin()
  .then(() => {
    console.log('Admin seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Admin seeding error:', error);
    process.exit(1);
  });
