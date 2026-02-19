#!/bin/bash
# Downgrade Node.js to v20.19.6 on existing server
# Run as root: bash downgrade-node.sh

set -e

TARGET_VERSION="20.19.6"

echo "=== Installing nvm ==="
export NVM_DIR="/root/.nvm"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "=== Installing Node.js ${TARGET_VERSION} ==="
nvm install ${TARGET_VERSION}
nvm use ${TARGET_VERSION}
nvm alias default ${TARGET_VERSION}

echo "=== Making node/npm available system-wide ==="
ln -sf "$NVM_DIR/versions/node/v${TARGET_VERSION}/bin/node" /usr/local/bin/node
ln -sf "$NVM_DIR/versions/node/v${TARGET_VERSION}/bin/npm" /usr/local/bin/npm

echo "=== Verifying installation ==="
node --version
npm --version

echo "=== Node.js downgraded to ${TARGET_VERSION} ==="
echo "Restart PM2: pm2 restart financial-web-app"
