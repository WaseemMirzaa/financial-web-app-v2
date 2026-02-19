# Hostinger Deployment Guide

## Prerequisites

- Hostinger VPS or Cloud hosting plan (Node.js support required)
- MySQL database created in Hostinger hPanel
- Domain name configured (optional, can use IP)

## Step 1: Setup MySQL Database

1. Log into Hostinger hPanel
2. Go to **Databases** → **MySQL Databases**
3. Create a new database (e.g., `financial_app`)
4. Create a MySQL user and grant privileges
5. Note down:
   - Database name
   - MySQL username
   - MySQL password
   - MySQL host (usually `localhost` or `mysql.hostinger.com`)

## Step 2: Server Setup

### Connect via SSH

```bash
ssh root@your-server-ip
```

### Install Node.js (if not installed)

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 (Process Manager)

```bash
npm install -g pm2
```

### Install MySQL Client (optional, for testing)

```bash
sudo apt-get update
sudo apt-get install mysql-client
```

## Step 3: Deploy Application

### Clone/Upload Code

```bash
# Option 1: Clone from Git
cd /var/www
git clone https://github.com/your-username/financial-web-app.git
cd financial-web-app

# Option 2: Upload via FTP/SFTP and extract
```

### Install Dependencies

```bash
npm install --production
```

### Configure Environment Variables

```bash
# Copy example env file
cp .env.local.example .env.local

# Edit with your Hostinger MySQL credentials
nano .env.local
```

Update these values:
```env
DB_HOST=localhost  # or mysql.hostinger.com
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
NEXT_PUBLIC_APP_URL=https://your-domain.com
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
NODE_ENV=production
```

### Run Database Migration

```bash
npm run migrate
```

### Build Application

```bash
npm run build
```

## Step 4: Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
# Follow the command it outputs
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs financial-web-app

# Restart
pm2 restart financial-web-app

# Stop
pm2 stop financial-web-app
```

## Step 5: Configure Nginx (Reverse Proxy)

### Install Nginx

```bash
sudo apt-get install nginx
```

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/financial-app
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/financial-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 6: SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Step 7: Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

## Troubleshooting

### Check Application Logs

```bash
pm2 logs financial-web-app
tail -f logs/pm2-error.log
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Test MySQL Connection

```bash
mysql -h localhost -u your_mysql_username -p your_database_name
```

### Restart Services

```bash
pm2 restart financial-web-app
sudo systemctl restart nginx
```

## Updating Application

```bash
cd /var/www/financial-web-app
git pull  # or upload new files
npm install --production
npm run build
pm2 restart financial-web-app
```
