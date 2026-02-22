#!/bin/bash
# Build locally and create .next.tar.gz for upload to server (use when server build fails with Bus error)
set -e
cd "$(dirname "$0")/.."
echo "Building..."
npm run build
echo "Creating .next.tar.gz..."
tar czf .next.tar.gz .next
echo "Done. Copy to server and extract:"
echo "  scp .next.tar.gz user@server:/var/www/financial-web-app/"
echo "  On server: cd /var/www/financial-web-app && tar xzf .next.tar.gz && pm2 restart financial-web-app"
