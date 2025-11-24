# 🚀 MrX App Builder Dashboard - Deployment Guide

Complete guide for deploying the MrX App Builder Dashboard to Cloudflare Pages.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account
- ✅ Cloudflare account (free tier is sufficient)
- ✅ Repository pushed to GitHub
- ✅ Environment variables configured

---

## 🌐 Deploying to Cloudflare Pages

### Method 1: GitHub Integration (Recommended)

#### Step 1: Connect GitHub Repository

1. Login to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Pages**
3. Click **"Create application"** → **"Pages"**
4. Click **"Connect to Git"**
5. Select **GitHub** and authorize Cloudflare
6. Choose your repository: `mrx-app-builder-dashboard`

#### Step 2: Configure Build Settings

```yaml
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Root directory: /
```

**Advanced Build Settings:**
```yaml
Node version: 18
Install command: npm install
Environment variables: (see below)
```

#### Step 3: Add Environment Variables

In **Settings** → **Environment variables**, add:

**Production:**
```
VITE_API_BASE_URL=https://api.mrx-builder.pages.dev/api
VITE_MOCK_API=false
VITE_ENABLE_ANALYTICS=true
VITE_APP_NAME=MrX App Builder
VITE_APP_VERSION=1.0.0
```

**Preview (Optional):**
```
VITE_API_BASE_URL=https://preview-api.mrx-builder.pages.dev/api
VITE_MOCK_API=true
VITE_ENABLE_DEV_TOOLS=true
```

#### Step 4: Deploy

1. Click **"Save and Deploy"**
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at: `https://mrx-app-builder-dashboard.pages.dev`

#### Step 5: Verify Deployment

Visit your deployment URL and check:
- ✅ App loads without errors
- ✅ Dark theme is applied
- ✅ Navigation works
- ✅ API endpoints (if backend is ready)

---

### Method 2: Wrangler CLI

#### Step 1: Install Wrangler

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

#### Step 2: Create Pages Project

```bash
# Initialize project
wrangler pages project create mrx-app-builder-dashboard

# Build your app
npm run build

# Deploy
wrangler pages deploy dist --project-name=mrx-app-builder-dashboard
```

#### Step 3: Set Environment Variables

```bash
# Production
wrangler pages secret put VITE_API_BASE_URL --project-name=mrx-app-builder-dashboard

# Enter value when prompted
```

---

## 🔧 Custom Domain Setup

### Step 1: Add Custom Domain

1. Go to **Pages** → Your project → **Custom domains**
2. Click **"Set up a custom domain"**
3. Enter your domain: `app.yourdomain.com`
4. Click **"Continue"**

### Step 2: Update DNS Records

Add these records to your domain:

**For root domain (yourdomain.com):**
```
Type: CNAME
Name: @
Content: mrx-app-builder-dashboard.pages.dev
Proxy: Enabled (orange cloud)
```

**For subdomain (app.yourdomain.com):**
```
Type: CNAME
Name: app
Content: mrx-app-builder-dashboard.pages.dev
Proxy: Enabled (orange cloud)
```

### Step 3: Wait for Propagation

- DNS propagation: 5-60 minutes
- SSL certificate: Automatic (Let's Encrypt)
- Check status in Cloudflare dashboard

---

## 🔐 Security Configuration

### Enable Security Headers

Create `_headers` file in `public/` directory:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.mrx-builder.pages.dev
```

### Enable HTTPS Redirect

In Cloudflare dashboard:
1. **SSL/TLS** → **Overview**
2. Set mode to **"Full (strict)"**
3. **Edge Certificates** → Enable **"Always Use HTTPS"**

---

## 📊 Monitoring & Analytics

### Cloudflare Analytics

1. Go to **Pages** → Your project → **Analytics**
2. View:
   - Page views
   - Unique visitors
   - Bandwidth usage
   - Top pages

### Custom Analytics (Optional)

Add analytics provider in `.env`:

```
VITE_ANALYTICS_ID=your-analytics-id
VITE_ENABLE_ANALYTICS=true
```

Update `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_ID');
</script>
```

---

## 🚨 Error Tracking

### Sentry Integration (Optional)

1. **Install Sentry:**
```bash
npm install @sentry/react @sentry/vite-plugin
```

2. **Configure `vite.config.js`:**
```javascript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-org",
      project: "mrx-dashboard"
    })
  ]
});
```

3. **Initialize in `main.jsx`:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.MODE
});
```

---

## 🔄 CI/CD Pipeline

### Automatic Deployments

Cloudflare Pages automatically deploys when you push to GitHub:

**Production Branch:** `main`
- Triggers production deployment
- Uses production environment variables

**Preview Branches:** All other branches
- Creates preview deployment
- Unique URL per branch: `https://abc123.mrx-dashboard.pages.dev`

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: mrx-app-builder-dashboard
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🧪 Testing Deployment

### Pre-Deployment Checklist

- [ ] Run `npm run build` locally (no errors)
- [ ] Test production build with `npm run preview`
- [ ] Verify all environment variables are set
- [ ] Check API endpoints are accessible
- [ ] Test responsive design (mobile/tablet/desktop)
- [ ] Verify dark/light theme switching
- [ ] Test all major features:
  - [ ] Project selection
  - [ ] Chat creation
  - [ ] Message sending
  - [ ] File explorer
  - [ ] Log viewer
  - [ ] Artifact download

### Post-Deployment Verification

```bash
# Check deployment status
curl -I https://mrx-app-builder-dashboard.pages.dev

# Expected response:
# HTTP/2 200
# content-type: text/html
# cf-cache-status: HIT
```

**Browser Tests:**
1. Open deployment URL
2. Open DevTools → Console (no errors)
3. Check Network tab (all resources load)
4. Test authentication flow
5. Send test message
6. Verify API communication

---

## 📈 Performance Optimization

### Build Optimization

Already configured in `vite.config.js`:
- ✅ Terser minification
- ✅ Console removal
- ✅ Code splitting
- ✅ Manual chunks for vendors

### Cloudflare Optimizations

1. **Enable Auto Minify:**
   - Go to **Speed** → **Optimization**
   - Enable JavaScript, CSS, HTML minification

2. **Enable Brotli Compression:**
   - Automatic on Cloudflare Pages
   - Reduces file sizes by ~20-30%

3. **Cache Configuration:**
   - Cloudflare automatically caches static assets
   - Cache TTL: Browser (4 hours), Edge (1 week)

### Bundle Size Analysis

```bash
# Install analyzer
npm install --save-dev rollup-plugin-visualizer

# Build with analysis
npm run build

# Open stats.html to view bundle size
```

---

## 🔧 Troubleshooting

### Build Fails

**Error:** `npm ERR! code ELIFECYCLE`

**Solution:**
1. Check Node version (must be 18+)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and reinstall

---

### Deployment Succeeds but App Not Loading

**Error:** White screen or "Failed to fetch"

**Solution:**
1. Check browser console for errors
2. Verify `dist/` directory has `index.html`
3. Check environment variables are set
4. Verify API base URL is correct

---

### API Requests Failing (CORS)

**Error:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution:**
1. Backend must include CORS headers:
```javascript
headers: {
  'Access-Control-Allow-Origin': 'https://mrx-dashboard.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

2. For development, use Vite proxy (already configured)

---

### SSL Certificate Issues

**Error:** "Your connection is not private"

**Solution:**
1. Wait 5-10 minutes for certificate provisioning
2. Ensure SSL mode is "Full (strict)"
3. Check DNS records are correct

---

## 📞 Support

If you encounter issues:

1. **Check Cloudflare Status:** https://www.cloudflarestatus.com/
2. **Review Build Logs:** In Cloudflare Pages dashboard
3. **Community Forum:** https://community.cloudflare.com/
4. **Open GitHub Issue:** With build logs and error details

---

## 🎉 Success!

Your MrX App Builder Dashboard is now live! 🚀

**Next Steps:**
- Set up backend API (Cloudflare Workers)
- Configure Google Colab agent
- Connect GitHub repositories
- Set up Google Drive for APK storage

---

Made with ❤️ by the MrX Team
