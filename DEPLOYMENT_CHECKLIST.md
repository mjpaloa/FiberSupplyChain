# Vercel Deployment Checklist

## ✅ Completed Updates

### Frontend (https://easyabaca.site)
- [x] Created `.env.production` with `VITE_API_URL=https://easyabaca-api.vercel.app`
- [x] Updated `apiClient.ts` default API URL to production
- [x] Updated `authToken.ts` to use environment variable for refresh endpoint
- [x] Replaced **150+ hardcoded localhost URLs** across all components and pages
- [x] Created `vercel.json` for frontend deployment configuration
- [x] Created centralized API config at `src/config/api.ts`

### Backend (https://easyabaca-api.vercel.app)
- [x] Created `vercel.json` for serverless function deployment
- [x] Updated CORS configuration to allow:
  - `https://easyabaca.site`
  - `https://www.easyabaca.site`
  - Local development URLs
- [x] Set credentials and proper CORS options

## 📋 Pre-Deployment Steps

### Backend Deployment
1. **Environment Variables** - Set in Vercel dashboard:
   ```
   DATABASE_URL=<your-supabase-connection-string>
   JWT_SECRET=<your-jwt-secret>
   JWT_REFRESH_SECRET=<your-refresh-secret>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_KEY=<your-supabase-anon-key>
   NODE_ENV=production
   PORT=3001
   ```

2. **Deploy to Vercel**:
   ```bash
   cd backend
   vercel --prod
   ```
   - Ensure project is linked to `easyabaca-api` on Vercel
   - Domain should be: `easyabaca-api.vercel.app`

### Frontend Deployment
1. **Environment Variables** - Set in Vercel dashboard:
   ```
   VITE_API_URL=https://easyabaca-api.vercel.app
   VITE_RECAPTCHA_SITE_KEY=<your-recaptcha-key>
   ```

2. **Deploy to Vercel**:
   ```bash
   cd frontend
   vercel --prod
   ```
   - Ensure project is linked to your frontend project on Vercel
   - Connect custom domain: `easyabaca.site`

## 🔍 Post-Deployment Verification

1. **Backend Health Check**:
   - Visit: `https://easyabaca-api.vercel.app/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

2. **Frontend Test**:
   - Visit: `https://easyabaca.site`
   - Test login functionality
   - Check browser console for any API errors
   - Verify all API calls go to `easyabaca-api.vercel.app`

3. **CORS Test**:
   - Open browser DevTools on frontend
   - Monitor Network tab for CORS errors
   - All API requests should succeed

## ⚠️ Important Notes

- **Database**: Ensure Supabase is accessible from Vercel's IP ranges
- **API Keys**: Never commit `.env` files to git
- **Build Command**: Frontend uses `npm run build` (tsc + vite build)
- **Node Version**: Backend requires Node.js 18.x or higher
- **Serverless Limits**: Be aware of Vercel's serverless function timeout (10s hobby, 60s pro)

## 🐛 Troubleshooting

### If API calls fail:
1. Check Vercel function logs
2. Verify environment variables are set
3. Check database connectivity
4. Verify CORS configuration

### If frontend can't connect to backend:
1. Verify `VITE_API_URL` in Vercel environment variables
2. Check browser console for actual URL being called
3. Test backend health endpoint directly
4. Check for mixed content errors (http vs https)

## 📝 Files Modified

### Frontend (58 files):
- `src/utils/apiClient.ts` - Updated default API URL
- `src/utils/authToken.ts` - Updated refresh token endpoint
- `src/config/api.ts` - NEW: Centralized API configuration
- `.env.production` - NEW: Production environment variables
- `.env.example` - NEW: Example environment file
- `vercel.json` - NEW: Vercel deployment config
- All page and component files with API calls (150+ URLs replaced)

### Backend (2 files):
- `src/server.ts` - Updated CORS configuration
- `vercel.json` - NEW: Vercel deployment config
