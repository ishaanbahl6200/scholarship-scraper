# Vercel Deployment Guide

## Quick Deploy Steps

### Option 1: Vercel Web Interface (Easiest)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with GitHub
3. **Import Project**:
   - Click "Add New..." → "Project"
   - Select your repository: `ishaanbahl6200/scholarship-scraper`
4. **Configure Project**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. **Add Environment Variables**:
   - `AUTH0_SECRET` - Your Auth0 secret
   - `AUTH0_BASE_URL` - Your Vercel URL (will be provided after first deploy)
   - `AUTH0_ISSUER_BASE_URL` - `https://dev-vxvtfq5nmj6gloyn.us.auth0.com`
   - `AUTH0_CLIENT_ID` - Your Auth0 client ID
   - `AUTH0_CLIENT_SECRET` - Your Auth0 client secret
6. **Deploy**: Click "Deploy"

### Option 2: Vercel CLI

```bash
cd frontend
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No** (first time)
- Project name? **grantly** (or your choice)
- Directory? **./** (current directory)
- Override settings? **No**

Then add environment variables:
```bash
vercel env add AUTH0_SECRET
vercel env add AUTH0_BASE_URL
vercel env add AUTH0_ISSUER_BASE_URL
vercel env add AUTH0_CLIENT_ID
vercel env add AUTH0_CLIENT_SECRET
```

## Important: Update Auth0 URLs

After deployment, you'll get a URL like: `https://grantly.vercel.app`

**Update Auth0 Application Settings:**
1. Go to Auth0 Dashboard → Applications → Your App
2. Add to **Allowed Callback URLs**:
   ```
   http://localhost:3000/api/auth/callback, https://your-app.vercel.app/api/auth/callback
   ```
3. Add to **Allowed Logout URLs**:
   ```
   http://localhost:3000, https://your-app.vercel.app
   ```
4. Add to **Allowed Web Origins**:
   ```
   http://localhost:3000, https://your-app.vercel.app
   ```
5. Save changes

**Update Vercel Environment Variable:**
- Set `AUTH0_BASE_URL` to your Vercel URL: `https://your-app.vercel.app`

## Production Deployment

After first deploy:
1. Get your production URL from Vercel
2. Update Auth0 URLs (see above)
3. Update `AUTH0_BASE_URL` in Vercel environment variables
4. Redeploy (or it will auto-redeploy)

## Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **Auth0 errors**: Make sure callback URLs are correct
- **Environment variables**: Ensure all are set in Vercel dashboard
