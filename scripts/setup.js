/**
 * Setup: copy .env.local from .env.local.example if missing, then run migrate + seed.
 * Run: node scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const envLocal = path.join(root, '.env.local');
const envExample = path.join(root, '.env.local.example');

if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, envLocal);
  console.log('Created .env.local from .env.local.example');
} else if (!fs.existsSync(envLocal)) {
  console.warn('No .env.local or .env.local.example found. Create .env.local with DB_* and other vars.');
}

console.log('Running database migrate...');
execSync('npx tsx scripts/migrate.ts', { cwd: root, stdio: 'inherit' });
console.log('Running database seed...');
execSync('npx tsx scripts/seed.ts', { cwd: root, stdio: 'inherit' });
console.log('Setup complete. Start the app with: npm run dev');
console.log('Log in with ADMIN_EMAIL and ADMIN_PASSWORD from .env.');
