# 🚀 Quick Start - Vercel Deployment

## Prerequisites
- Vercel account (sign up at vercel.com)
- Your Supabase credentials
- Your reCAPTCHA keys
- Domain: easyabaca.site ready

## 📦 Step 1: Install Vercel CLI
```bash
npm install -g vercel
vercel login
```

## 🔧 Step 2: Deploy Backend

```bash
cd backend
```

Create `.env` file:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_strong_secret_minimum_32_chars
RECAPTCHA_SECRET_KEY=your_secret
RECAPTCHA_SITE_KEY=your_site_key
FRONTEND_URL=https://easyabaca.site
```

Deploy:
```bash
vercel --prod
```

**Save the backend URL** (e.g., https://easyabaca-api.vercel.app)

## 🎨 Step 3: Deploy Frontend

```bash
cd frontend
```

Create `.env` file:
```env
VITE_API_URL=https://your-backend-url.vercel.app
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

Deploy:
```bash
vercel --prod
```

## 🌐 Step 4: Configure Domain

1. Go to Vercel Dashboard → Your Frontend Project → Settings → Domains
2. Add domain: `easyabaca.site`
3. Update DNS records at your domain registrar:
   - A Record: `@` → `76.76.21.21`
   - CNAME: `www` → `cname.vercel-dns.com`
4. Wait 5-30 minutes for DNS propagation

## ✅ Step 5: Test

- https://easyabaca.site → Homepage ✓
- https://easyabaca.site/mao → MAO Login ✓
- https://your-backend-url.vercel.app/health → API Health ✓

## 🔄 Update Backend CORS

After domain is active:
1. Backend project in Vercel → Settings → Environment Variables
2. Update `FRONTEND_URL` to: `https://easyabaca.site`
3. Redeploy backend

---

**Full guide**: See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
