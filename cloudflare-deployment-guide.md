# Cloudflare Pages Deployment Guide

## Quick Deploy (Recommended - Static Export)

Your app is configured for **static export**, which works perfectly with Cloudflare Pages since your app uses client-side features (localStorage).

### Step 1: Push to Git Repository

Make sure your code is pushed to GitHub, GitLab, or Bitbucket:

```bash
git init  # if not already initialized
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Deploy via Cloudflare Dashboard

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Sign up/Log in (free account works)

2. **Create a Pages Project**
   - Click **"Workers & Pages"** in the left sidebar
   - Click **"Create application"**
   - Select the **"Pages"** tab
   - Click **"Connect to Git"**

3. **Connect Your Repository**
   - Authorize Cloudflare to access your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository: `financial-web-app`
   - Click **"Begin setup"**

4. **Configure Build Settings**
   - **Framework preset:** `Next.js (Static HTML Export)` or `None`
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** `/` (leave as default)
   - **Node version:** `18` or `20` (select latest LTS)

5. **Environment Variables** (Optional)
   - Add any environment variables if needed
   - For this app, none are required (uses localStorage)

6. **Deploy**
   - Click **"Save and Deploy"**
   - Wait for build to complete (~2-3 minutes)

### Step 3: Access Your Site

After deployment, you'll get a URL like:
- `https://financial-web-app.pages.dev`

### Step 4: Custom Domain (Optional)

1. Go to your project → **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter your domain name
4. Follow DNS setup instructions (add CNAME record)

---

## Alternative: Deploy via Wrangler CLI

### Install Wrangler

```bash
npm install -g wrangler
```

### Login

```bash
wrangler login
```

### Build and Deploy

```bash
# Build the static site
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy out --project-name=financial-web-app
```

---

## Important Notes

### ✅ What Works on Cloudflare Pages

- ✅ Client-side React components
- ✅ localStorage (user auth, locale, data)
- ✅ Client-side routing
- ✅ All your UI components
- ✅ Static assets (images, CSS, JS)

### ⚠️ What Doesn't Work (Not Needed for Your App)

- ❌ Server-side API routes (you don't use these)
- ❌ Server Components with server-side data fetching (you use client components)
- ❌ Server-side rendering (SSR) - but you don't need it

### Your App is Perfect for Static Export

Since your app:
- Uses `localStorage` for data persistence
- Has client-side authentication
- Doesn't use server-side features
- Works entirely in the browser

**Static export is the perfect choice!** It's faster, cheaper, and simpler.

---

## Troubleshooting

### Build Fails

1. Check Node version in Cloudflare settings (use 18 or 20)
2. Ensure all dependencies are in `package.json`
3. Check build logs in Cloudflare dashboard

### Site Works But Routes Don't

Cloudflare Pages automatically handles Next.js routing. If you have issues:
- Ensure `output: 'export'` is in `next.config.js`
- Check that all pages are in the `out` folder after build

### localStorage Not Working

localStorage works fine on Cloudflare Pages - it's client-side only. If you have issues:
- Check browser console for errors
- Ensure you're not in incognito mode (localStorage restrictions)

---

## Quick Reference

**Build Command:** `npm run build`  
**Output Directory:** `out`  
**Framework:** Next.js (Static Export)  
**Node Version:** 18 or 20

---

## Need Help?

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Next.js Static Export: https://nextjs.org/docs/app/building-your-application/deploying/static-exports
