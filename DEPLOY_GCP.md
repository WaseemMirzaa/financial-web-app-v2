# Google Cloud Platform (GCP) Deployment Guide

## Architecture

- **Cloud SQL** (MySQL) - Managed database
- **Cloud Run** (Next.js) - Serverless containers (recommended)
- **Cloud Build** - CI/CD (optional)

## Prerequisites

- GCP account with billing enabled
- `gcloud` CLI installed: https://cloud.google.com/sdk/docs/install
- Project created in GCP Console

## Step 1: Setup GCP Project

```bash
# Login to GCP
gcloud auth login

# Set your project ID
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudsql.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

## Step 2: Create Cloud SQL MySQL Instance

### Via Console:
1. Go to **SQL** → **Create Instance**
2. Choose **MySQL**
3. Select **MySQL 8.0**
4. Instance ID: `financial-app-db`
5. Root password: Set a strong password
6. Region: Choose closest to your users
7. Machine type: `db-f1-micro` (dev) or `db-n1-standard-1` (prod)
8. Click **Create**

### Via CLI:

```bash
# Create Cloud SQL instance
gcloud sql instances create financial-app-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_ROOT_PASSWORD

# Create database
gcloud sql databases create financial_app \
  --instance=financial-app-db

# Create user
gcloud sql users create app_user \
  --instance=financial-app-db \
  --password=YOUR_DB_PASSWORD
```

### Get Connection Details:

```bash
# Get connection name (needed for Cloud Run)
gcloud sql instances describe financial-app-db --format="value(connectionName)"

# Output: PROJECT_ID:REGION:INSTANCE_NAME
```

## Step 3: Store Secrets in Secret Manager

```bash
# Store database password
echo -n "YOUR_DB_PASSWORD" | gcloud secrets create db-password --data-file=-

# Store SendGrid API key
echo -n "SG.xxx" | gcloud secrets create sendgrid-api-key --data-file=-

# Store JWT secret
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
```

## Step 4: Create Dockerfile for Cloud Run

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Update `next.config.js` to enable standalone output:

```js
const nextConfig = {
  output: 'standalone',
  // ... rest of config
}
```

## Step 5: Deploy to Cloud Run

### Build and Deploy:

```bash
# Build container image
gcloud builds submit --tag gcr.io/$PROJECT_ID/financial-app

# Deploy to Cloud Run
gcloud run deploy financial-app \
  --image gcr.io/$PROJECT_ID/financial-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --add-cloudsql-instances $PROJECT_ID:us-central1:financial-app-db \
  --set-env-vars="DB_HOST=/cloudsql/$PROJECT_ID:us-central1:financial-app-db" \
  --set-env-vars="DB_USER=app_user" \
  --set-env-vars="DB_NAME=financial_app" \
  --set-env-vars="DB_PORT=3306" \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --set-secrets="SENDGRID_API_KEY=sendgrid-api-key:latest" \
  --set-secrets="JWT_SECRET=jwt-secret:latest" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10
```

### Get Service URL:

```bash
gcloud run services describe financial-app \
  --region us-central1 \
  --format="value(status.url)"
```

## Step 6: Update Environment Variables

Set public env vars:

```bash
gcloud run services update financial-app \
  --region us-central1 \
  --update-env-vars="NEXT_PUBLIC_APP_URL=https://your-service-url.run.app" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your-key" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-bucket" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-id" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id" \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id" \
  --update-env-vars="GOOGLE_TRANSLATE_API_KEY=your-key"
```

## Step 7: Run Database Migration

### Option 1: From Local Machine (with Cloud SQL Proxy)

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy (in separate terminal)
./cloud-sql-proxy $PROJECT_ID:us-central1:financial-app-db

# Run migration (in another terminal)
DB_HOST=127.0.0.1 \
DB_PORT=3306 \
DB_USER=app_user \
DB_PASSWORD=YOUR_PASSWORD \
DB_NAME=financial_app \
npm run migrate
```

### Option 2: From Cloud Run Job (Recommended)

```bash
# Create Cloud Run job for migrations
gcloud run jobs create migrate-db \
  --image gcr.io/$PROJECT_ID/financial-app \
  --region us-central1 \
  --add-cloudsql-instances $PROJECT_ID:us-central1:financial-app-db \
  --set-env-vars="DB_HOST=/cloudsql/$PROJECT_ID:us-central1:financial-app-db" \
  --set-env-vars="DB_USER=app_user" \
  --set-env-vars="DB_NAME=financial_app" \
  --set-env-vars="DB_PORT=3306" \
  --set-secrets="DB_PASSWORD=db-password:latest" \
  --command="npm" \
  --args="run,migrate"

# Execute migration job
gcloud run jobs execute migrate-db --region us-central1
```

## Step 8: Custom Domain (Optional)

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service financial-app \
  --domain your-domain.com \
  --region us-central1

# Follow DNS instructions shown
```

## Step 9: Continuous Deployment (Optional)

Create `.gcloudbuild.yaml`:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/financial-app', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/financial-app']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'financial-app'
      - '--image'
      - 'gcr.io/$PROJECT_ID/financial-app'
      - '--region'
      - 'us-central1'
```

Trigger on Git push:

```bash
gcloud builds triggers create github \
  --repo-name=financial-web-app \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=.gcloudbuild.yaml
```

## Troubleshooting

### View Logs:

```bash
gcloud run services logs read financial-app --region us-central1
```

### Check Database Connection:

```bash
gcloud sql connect financial-app-db --user=app_user
```

### Update Service:

```bash
gcloud run services update financial-app \
  --region us-central1 \
  --update-env-vars="KEY=VALUE"
```

### Scale Service:

```bash
gcloud run services update financial-app \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 20 \
  --cpu 2 \
  --memory 2Gi
```

## Cost Optimization

- Use `db-f1-micro` for dev/testing
- Set `--min-instances 0` to scale to zero when idle
- Use Cloud Run's pay-per-use pricing
- Enable Cloud SQL's automatic backups (optional)

## Security Best Practices

1. Use Secret Manager for sensitive data
2. Enable Cloud SQL private IP (recommended)
3. Use IAM roles for service accounts
4. Enable Cloud Armor for DDoS protection (optional)
5. Use Cloud CDN for static assets (optional)
