#!/usr/bin/env bash
# Server deploy: pull, install, migrate, build, pm2 restart.
#
# One-time on server:
#   chmod +x /var/www/financial-web-app/scripts/deploy.sh
#
# Usage:
#   ./scripts/deploy.sh
#   ./scripts/deploy.sh --seed-admin
#   DEPLOY_BRANCH=main APP_DIR=/var/www/financial-web-app ./scripts/deploy.sh
#
# Before first deploy with push notifications, add to .env.local on server:
#   FIREBASE_SERVICE_ACCOUNT_JSON={...}   OR
#   FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
set -e

APP_DIR="${APP_DIR:-/var/www/financial-web-app}"
BRANCH="${DEPLOY_BRANCH:-main}"
SEED_ADMIN=false

for arg in "$@"; do
  [ "$arg" = "--seed-admin" ] && SEED_ADMIN=true
done

cd "$APP_DIR"
echo "[deploy] App: $APP_DIR | Branch: $BRANCH"

echo "[deploy] Git pull..."
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

echo "[deploy] npm install..."
npm install --no-audit --no-fund

echo "[deploy] Database migrate..."
npm run db:migrate

if [ "$SEED_ADMIN" = true ]; then
  echo "[deploy] Seed admin..."
  npm run seed-admin
fi

echo "[deploy] Build..."
npm run build

echo "[deploy] PM2 restart..."
pm2 restart financial-web-app || pm2 start ecosystem.config.js
pm2 save

echo "[deploy] Done."
echo "[deploy] Check logs: pm2 logs financial-web-app --lines 30"
echo "[deploy] Expect: [FCM Admin] Initialized for project: ..."
