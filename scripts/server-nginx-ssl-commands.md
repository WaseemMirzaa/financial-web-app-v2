# Server: Nginx + SSL (remove :3000, HTTPS)

Replace `YOUR_DOMAIN` with your domain (e.g. `app.yourcompany.com`). Point DNS A record to the droplet IP first.

## 1) Install Nginx and Certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

## 2) Create Nginx site config

```bash
sudo nano /etc/nginx/sites-available/financial-web-app
```

Paste this (replace `YOUR_DOMAIN`):

```nginx
upstream nextjs {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;
    server_name YOUR_DOMAIN;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    access_log /var/log/nginx/financial-web-app-access.log;
    error_log /var/log/nginx/financial-web-app-error.log;
    client_max_body_size 20M;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Save and exit (Ctrl+O, Enter, Ctrl+X).

## 3) Enable site and test

```bash
sudo ln -sf /etc/nginx/sites-available/financial-web-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Ensure the app is running on port 3000 (e.g. `pm2 status`). You should now reach the app at `http://YOUR_DOMAIN` (no :3000).

## 4) Get SSL and turn on HTTPS

```bash
sudo certbot --nginx -d YOUR_DOMAIN --non-interactive --agree-tos -m your@email.com
```

Use a real email for renewal notices. Certbot will add HTTPS and redirect HTTP → HTTPS.

## 5) Auto-renewal (optional check)

```bash
sudo certbot renew --dry-run
```

Cron is usually set by certbot. Reload nginx after renewals:

```bash
sudo certbot renew --quiet && sudo systemctl reload nginx
```

Add to crontab if needed: `0 3 * * * certbot renew --quiet && systemctl reload nginx`
