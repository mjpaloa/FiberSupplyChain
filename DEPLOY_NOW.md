# 🚀 Deploy Frontend Now - Quick Guide

Your backend is live: **https://easyabaca-api.vercel.app** ✅

## Step 1: Deploy Frontend to Vercel

### Project Settings:
```
Repository: mjdesu1/FiberSupplyChain-v2
Branch: main
Project Name: easyabaca
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Environment Variables (Add in Vercel Dashboard):
```
VITE_API_URL=https://easyabaca-api.vercel.app
VITE_RECAPTCHA_SITE_KEY=your_actual_recaptcha_site_key
```

## Step 2: After Frontend Deploys

1. Copy your frontend URL (e.g., `https://easyabaca.vercel.app`)
2. Update backend CORS:
   - Go to backend project in Vercel
   - Settings → Environment Variables
   - Update `FRONTEND_URL=https://easyabaca.vercel.app`
   - Redeploy backend

## Step 3: Add Your Domain

1. Go to Frontend Project → Settings → Domains
2. Add: `easyabaca.site`
3. Update DNS at your domain registrar:
   - A Record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`

## Step 4: Update Backend CORS Again

After domain is active:
- Update backend `FRONTEND_URL=https://easyabaca.site`
- Redeploy backend

## URLs:
- **Homepage**: https://easyabaca.site
- **MAO Login**: https://easyabaca.site/mao
- **Backend API**: https://easyabaca-api.vercel.app

---

**Deploy the frontend now with these exact settings!**
