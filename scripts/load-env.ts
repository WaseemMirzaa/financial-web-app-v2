import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * Loads `.env` then `.env.local` from the project root (later file overrides).
 * Exits if neither file exists — admin seeding expects credentials in one of them.
 */
export function loadEnvFiles(): void {
  const root = process.cwd();
  const envPath = path.join(root, '.env');
  const envLocalPath = path.join(root, '.env.local');
  const hasEnv = fs.existsSync(envPath);
  const hasEnvLocal = fs.existsSync(envLocalPath);

  if (!hasEnv && !hasEnvLocal) {
    console.error(
      'Missing environment file: create `.env` or `.env.local` in the project root.\n' +
        '  Copy from `.env.local.example`, then set ADMIN_EMAIL, ADMIN_PASSWORD, and DB_*.\n' +
        '  Run: npm run seed-admin'
    );
    process.exit(1);
  }

  if (hasEnv) dotenv.config({ path: envPath });
  if (hasEnvLocal) dotenv.config({ path: envLocalPath });
}
