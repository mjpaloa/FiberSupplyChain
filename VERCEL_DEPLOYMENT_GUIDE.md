# Vercel Deployment Guide for MAO Culiram Abaca System

This guide will help you deploy both the frontend and backend of your application to Vercel with your custom domain **easyabaca.site**.

## 🎯 Deployment Architecture

- **Frontend**: `easyabaca.site` - Main application (React + Vite)
- **Backend API**: Separate Vercel deployment for the Node.js/Express API
- **MAO Login Route**: `easyabaca.site/mao` - Special route for MAO officers

---

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab Account**: Your code should be in a Git repository
3. **Domain**: `easyabaca.site` ready to configure
4. **Database**: Supabase project set up and running
5. **reCAPTCHA Keys**: Get from [Google reCAPTCHA](https://www.google.com/recaptcha/admin)

---

## 🚀 Part 1: Deploy Backend API

### Step 1: Prepare Backend Environment Variables

Create a `.env` file in the `backend` directory with these values:

```env
PORT=3001
NODE_ENV=production
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_VERSION=v3
RECAPTCHA_MIN_SCORE=0.5
FRONTEND_URL=https://easyabaca.site
```

### Step 2: Deploy Backend to Vercel

1. **Login to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? `easyabaca-api` (or your preferred name)
   - In which directory is your code located? `./`
   - Want to override settings? **N**

5. **Add Environment Variables in Vercel Dashboard**:
   - Go to your Vercel dashboard
   - Select your backend project
   - Go to Settings → Environment Variables
   - Add all variables from your `.env` file
   - Make sure to add them for **Production**, **Preview**, and **Development**

6. **Note your Backend URL**: 
   - After deployment, you'll get a URL like: `https://easyabaca-api.vercel.app`
   - **Copy this URL - you'll need it for the frontend**

7. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🎨 Part 2: Deploy Frontend

### Step 1: Update Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=https://easyabaca-api.vercel.app
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

**Important**: Replace `https://easyabaca-api.vercel.app` with your actual backend URL from Part 1, Step 6.

### Step 2: Build and Test Locally (Optional)

```bash
cd frontend
npm install
npm run build
npm run preview
```

### Step 3: Deploy Frontend to Vercel

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow prompts**:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? `easyabaca` (or your preferred name)
   - In which directory is your code located? `./`
   - Want to override settings? **N**

4. **Add Environment Variables in Vercel Dashboard**:
   - Go to Vercel dashboard
   - Select your frontend project
   - Go to Settings → Environment Variables
   - Add:
     - `VITE_API_URL` = Your backend URL
     - `VITE_RECAPTCHA_SITE_KEY` = Your reCAPTCHA site key

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🌐 Part 3: Configure Custom Domain

### Step 1: Add Domain to Frontend Project

1. Go to your Vercel dashboard
2. Select your **frontend project** (easyabaca)
3. Go to **Settings → Domains**
4. Click **Add Domain**
5. Enter: `easyabaca.site`
6. Click **Add**

### Step 2: Configure DNS Records

Vercel will provide DNS records. Go to your domain registrar and add:

**Option A: Using Nameservers (Recommended)**
- Update nameservers to Vercel's nameservers (shown in Vercel dashboard)

**Option B: Using A/CNAME Records**
- Add an **A Record**:
  - Name: `@`
  - Value: `76.76.21.21` (Vercel's IP)
  
- Add a **CNAME Record** for www:
  - Name: `www`
  - Value: `cname.vercel-dns.com`

### Step 3: Verify Domain

1. Wait for DNS propagation (5-30 minutes)
2. Vercel will automatically verify your domain
3. SSL certificate will be automatically provisioned

### Step 4: Test Routes

Once deployed, test these URLs:
- ✅ `https://easyabaca.site` - Main page (homepage)
- ✅ `https://easyabaca.site/mao` - MAO login page
- ✅ `https://easyabaca.site/farmer-login` - Farmer login
- ✅ `https://easyabaca.site/buyer-login` - Buyer login
- ✅ `https://easyabaca.site/dashboard` - Protected dashboard

---

## 🔧 Part 4: Update Backend CORS

After deploying, update your backend's CORS settings:

1. Go to your backend Vercel project
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to: `https://easyabaca.site`
4. Redeploy the backend

---

## 📱 Part 5: Final Verification Checklist

### Backend API Tests
- [ ] `https://your-backend-url.vercel.app/health` returns OK
- [ ] `https://your-backend-url.vercel.app/` returns API info
- [ ] POST requests to `/api/auth/login` work
- [ ] Database connection is working

### Frontend Tests
- [ ] `https://easyabaca.site` loads homepage
- [ ] `https://easyabaca.site/mao` shows MAO login
- [ ] Login functionality works
- [ ] API calls are successful
- [ ] Dashboard loads after login
- [ ] Logout redirects properly

### Security Tests
- [ ] HTTPS is enforced (no HTTP access)
- [ ] JWT tokens are working
- [ ] reCAPTCHA is functioning
- [ ] CORS allows only your frontend domain

---

## 🔄 Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to your main branch
- Generate preview URLs for pull requests
- Run builds and tests

To manually redeploy:
```bash
# In backend directory
vercel --prod

# In frontend directory
vercel --prod
```

---

## 🆘 Troubleshooting

### Issue: "API calls fail with CORS error"
**Solution**: 
- Check `FRONTEND_URL` in backend environment variables
- Ensure it matches your frontend domain exactly
- Redeploy backend after changing

### Issue: "/mao route shows 404"
**Solution**:
- Verify `vercel.json` exists in frontend directory
- Check the routing configuration includes `/mao` route
- Redeploy frontend

### Issue: "Environment variables not working"
**Solution**:
- Verify all environment variables are set in Vercel dashboard
- Check they're enabled for Production environment
- Redeploy after adding variables

### Issue: "Database connection fails"
**Solution**:
- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure IP whitelist in Supabase allows all IPs (0.0.0.0/0) for serverless

### Issue: "Build fails with TypeScript errors"
**Solution**:
- Run `npm run build` locally first to catch errors
- Fix all TypeScript errors before deploying
- Check Node.js version compatibility

---

## 📊 Monitoring

### View Logs
- Go to your Vercel project
- Click **Deployments**
- Select a deployment
- Click **View Function Logs**

### Check Performance
- Vercel provides analytics in the dashboard
- Monitor API response times
- Check error rates

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - They're gitignored
2. **Use strong JWT secrets** - Minimum 32 characters
3. **Enable rate limiting** - Already configured in your backend
4. **Regular updates** - Keep dependencies updated
5. **Monitor logs** - Check for suspicious activity

---

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Your Backend URL**: `https://your-backend-api.vercel.app`
- **Your Frontend URL**: `https://easyabaca.site`

---

## 🎉 Success!

Your application is now live at:
- **Main Site**: https://easyabaca.site
- **MAO Login**: https://easyabaca.site/mao
- **API**: https://your-backend-api.vercel.app

Remember to share only the frontend URL (`easyabaca.site`) with your users!
