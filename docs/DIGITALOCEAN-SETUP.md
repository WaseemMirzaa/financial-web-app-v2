# DigitalOcean setup: same domain for web app + APIs

One server, one domain. Web at `https://alkhalijtamweel.com`, APIs at `https://alkhalijtamweel.com/api/*`.

---

## 1. On your droplet (SSH in)

```bash
ssh root@YOUR_DROPLET_IP
# or: ssh your_user@YOUR_DROPLET_IP
```

---

## 2. Install Node, PM2, Nginx (if not already)

```bash
# Node 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt-get update
sudo apt-get install -y nginx
```

---

## 3. Deploy the app

```bash
# Create app directory
sudo mkdir -p /var/www/financial-web-app
sudo chown $USER:$USER /var/www/financial-web-app
cd /var/www/financial-web-app
```

Upload your project (from your Mac, in a new terminal):

```bash
# From your Mac (project folder)
rsync -avz --exclude node_modules --exclude .next --exclude .git . your_user@YOUR_DROPLET_IP:/var/www/financial-web-app/
```

Or clone from Git if you use a repo:

```bash
cd /var/www/financial-web-app
git clone YOUR_REPO_URL .
```

Then on the droplet:

```bash
cd /var/www/financial-web-app
npm install --production
```

---

## 4. Environment and database

```bash
cp .env.local.example .env.local
nano .env.local
```

Set at least:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (your MySQL on DO or elsewhere)
- `NEXT_PUBLIC_APP_URL=https://alkhalijtamweel.com`
- Any other keys (JWT, SendGrid, etc.)

Run migrations and seed admin:

```bash
npm run db:migrate
npm run seed-admin
```

---

## 5. Build and run with PM2

```bash
cd /var/www/financial-web-app
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # run the command it prints so app starts on reboot
```

Check:

```bash
pm2 status
curl -s http://127.0.0.1:3000/api/mobile/settings
```

You should get JSON. Same app serves pages and `/api/*`.

---

## 6. Nginx (same domain for site + APIs)

```bash
sudo cp /var/www/financial-web-app/nginx.conf.example /etc/nginx/sites-available/financial-web-app
sudo sed -i 's/YOUR_DOMAIN_OR_IP/alkhalijtamweel.com/g' /etc/nginx/sites-available/financial-web-app
sudo ln -sf /etc/nginx/sites-available/financial-web-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

All traffic (site and API) goes to Next.js:

- `https://alkhalijtamweel.com/` → web app  
- `https://alkhalijtamweel.com/api/auth/login` → API  
- `https://alkhalijtamweel.com/api/customers` → API  

---

## 7. HTTPS (recommended)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d alkhalijtamweel.com
```

Use `https://alkhalijtamweel.com` in the app and for the mobile `BASE_URL`.

---

## 8. Point domain to the droplet

In your domain DNS (where you manage alkhalijtamweel.com):

- **A record** for `@` (and `www` if you want) → your droplet IP.

---

## Quick checks

- Web: open `https://alkhalijtamweel.com`
- API: `curl https://alkhalijtamweel.com/api/mobile/settings`
- Mobile app: `BASE_URL=https://alkhalijtamweel.com` (no trailing slash)

---

## Useful commands

| Task              | Command                    |
|-------------------|----------------------------|
| Restart app       | `pm2 restart financial-web-app` |
| Logs              | `pm2 logs financial-web-app`   |
| Rebuild after code| `npm run build && pm2 restart financial-web-app` |

---

## Deploy after push (on droplet)

From your machine, sync code then on the droplet pull and rebuild:

```bash
# From your Mac (project root)
rsync -avz --exclude node_modules --exclude .next --exclude .git . your_user@YOUR_DROPLET_IP:/var/www/financial-web-app/
```

Then on the droplet:

```bash
cd /var/www/financial-web-app
git pull origin backend-no-firebase
npm install --production
npm run build
pm2 restart financial-web-app
```

Or if you deploy by clone (first time) or pull (updates):

```bash
cd /var/www/financial-web-app
git fetch origin
git checkout backend-no-firebase
git pull origin backend-no-firebase
npm install --production
npm run build
pm2 restart financial-web-app
```
