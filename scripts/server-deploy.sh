#!/bin/bash
# Run on server to deploy backend branch: stash, pull, install, build, migrate, ensure admin, pm2 start/save/startup
set -e
APP_DIR="${APP_DIR:-/var/www/financial-web-app}"
BRANCH="${BRANCH:-backend}"
cd "$APP_DIR"

echo "=== Stashing local changes ==="
git stash push -m "pre-deploy $(date +%Y%m%d-%H%M%S)" || true

echo "=== Pulling $BRANCH ==="
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "=== Installing dependencies ==="
npm ci --no-audit --no-fund || npm install --no-audit --no-fund

echo "=== Building ==="
npm run build

echo "=== Migrating DB ==="
npm run migrate

echo "=== Ensuring admin user exists ==="
npm run seed-admin 2>/dev/null || true

echo "=== Starting with PM2 ==="
export NODE_ENV=production
export PORT="${PORT:-3000}"
pm2 delete financial-web-app 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== Done. Status ==="
pm2 status
