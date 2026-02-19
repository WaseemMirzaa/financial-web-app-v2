#!/bin/bash
# Digital Ocean – full setup from scratch: clone, env, DB, run app
# Run as root on a fresh Ubuntu 22.04 droplet:
#   curl -sSL https://raw.githubusercontent.com/WaseemMirzaa/financial-web-app/backend/scripts/digitalocean-setup.sh | sudo bash
#   Or: sudo bash digitalocean-setup.sh
#
# Optional env vars (set before running):
#   GITHUB_REPO, BRANCH, APP_DIR, APP_USER, NODE_VERSION, PORT
#   DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
#   JWT_SECRET, INSTALL_MYSQL=y, SEED_ADMIN=y
#   ENV_FILE=/path/to/your/.env.local  (copy this file to droplet and use instead of generated template)

set -e

# --- Config (override with env vars) ---
GITHUB_REPO="${GITHUB_REPO:-https://github.com/WaseemMirzaa/financial-web-app.git}"
BRANCH="${BRANCH:-backend}"
APP_DIR="${APP_DIR:-/var/www/financial-web-app}"
APP_USER="${APP_USER:-www-data}"
NODE_VERSION="${NODE_VERSION:-20}"
PORT="${PORT:-3000}"

# DB (use for managed DB or local MySQL)
DB_USER_ENV="${DB_USER:-root}"
DB_PASSWORD_ENV="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-financial_app}"
DB_PORT="${DB_PORT:-3306}"
DB_HOST="${DB_HOST:-localhost}"

JWT_SECRET="${JWT_SECRET:-change-me-in-production}"
INSTALL_MYSQL="${INSTALL_MYSQL:-n}"
SEED_ADMIN="${SEED_ADMIN:-n}"

# --- Ensure root ---
if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (e.g. sudo bash digitalocean-setup.sh)"
  exit 1
fi

echo "=== Updating system and installing dependencies ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y git curl ufw

echo "=== Installing Node.js ${NODE_VERSION} (via NodeSource) ==="
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs

echo "=== Optional: install MySQL server on this droplet ==="
if [[ "$INSTALL_MYSQL" =~ ^[yY] ]]; then
  apt-get install -y mysql-server
  systemctl start mysql
  systemctl enable mysql
  MYSQL_APP_PASS="${DB_PASSWORD_ENV:-$(openssl rand -base64 24)}"
  mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;"
  mysql -e "CREATE USER IF NOT EXISTS '${DB_USER_ENV}'@'localhost' IDENTIFIED BY '${MYSQL_APP_PASS}';"
  mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER_ENV}'@'localhost'; FLUSH PRIVILEGES;"
  DB_PASSWORD_ENV="$MYSQL_APP_PASS"
  echo "MySQL installed. DB: ${DB_NAME}, user: ${DB_USER_ENV}. Password in .env.local."
fi

echo "=== Allow all required permissions (directories and firewall) ==="
# Allow ports: SSH, HTTP, HTTPS, app
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow "${PORT}/tcp"
ufw --force enable || true

echo "=== Clone project from GitHub ==="
mkdir -p "$(dirname "$APP_DIR")"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR" && git fetch && git checkout "$BRANCH" && git pull && cd -
else
  git clone -b "$BRANCH" "$GITHUB_REPO" "$APP_DIR"
fi
cd "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"

echo "=== Creating .env.local (template from project .env.local.example) ==="
# If ENV_FILE is set and exists (e.g. you uploaded your .env.local), use it; else generate from template
if [ -n "${ENV_FILE}" ] && [ -f "${ENV_FILE}" ]; then
  cp "$ENV_FILE" "$APP_DIR/.env.local"
  echo "Using provided env file: $ENV_FILE"
else
  # Template matches repo .env.local.example; fill from env vars
  cat > "$APP_DIR/.env.local" << ENVFILE
# Database
DB_HOST=${DB_HOST}
DB_USER=${DB_USER_ENV}
DB_PASSWORD=${DB_PASSWORD_ENV}
DB_NAME=${DB_NAME}
DB_PORT=${DB_PORT}

# JWT
JWT_SECRET=${JWT_SECRET}

# Google Translate (optional)
GOOGLE_TRANSLATE_API_KEY=

# Firebase – Web (optional)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Production
NODE_ENV=production
PORT=${PORT}
# NEXT_PUBLIC_APP_URL=https://your-domain.com
# SENDGRID_API_KEY=
# SENDGRID_FROM_EMAIL=
ENVFILE
fi
chown "$APP_USER:$APP_USER" "$APP_DIR/.env.local"
chmod 600 "$APP_DIR/.env.local"

echo "=== Install app deps, migrate, build ==="
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm ci"
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run migrate"
[ "$SEED_ADMIN" = "y" ] && sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run seed-admin" || true
sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run build"

echo "=== Install PM2 and start app ==="
npm install -g pm2
cd "$APP_DIR" && PORT=$PORT pm2 start npm --name financial-web-app -- start
cd - >/dev/null
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo "=== Setup complete ==="
echo "App dir: $APP_DIR"
echo "Env file: $APP_DIR/.env.local (edit DB, JWT, Firebase, SendGrid as needed)"
echo "Port: $PORT (ensure firewall allows it; UFW rules applied)"
echo "Commands: pm2 status | pm2 logs financial-web-app | pm2 restart financial-web-app"
