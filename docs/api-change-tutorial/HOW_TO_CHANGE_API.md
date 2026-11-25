# How to Change the API Server (Maintenance & Handover Guide)

This guide explains how to point the **FiberSupplyChain** application to a new backend API server without editing dozens of frontend files.

All frontend API requests are centralized in a single file: **`frontend/src/config/api.ts`**.

---

## Quick Summary (TL;DR)

1. Update **`VITE_API_URL`** in **`frontend/.env`** (for local dev) **and** in your frontend hosting platform's Environment Variables (e.g., Vercel → _Settings → Environment Variables_).
2. Update **`DEFAULT_API_BASE_URL`** in **`frontend/src/config/api.ts`** so the default fallback also matches the new server.
3. If your frontend domain also changed, add it to **`FRONTEND_URL`** on your backend server (or `allowedOrigins` in `backend/src/server.ts`) so CORS allows requests.
4. Rebuild / redeploy the frontend (Vite injects `VITE_*` variables at **build time**).

---

## Step 1: Change the Frontend API URL

### How URL priority works

Inside [`frontend/src/config/api.ts`](../../frontend/src/config/api.ts):

```ts
const DEFAULT_API_BASE_URL = "https://fibersupplychain.onrender.com";

const envApiUrl =
  typeof import.meta.env !== "undefined"
    ? import.meta.env.VITE_API_URL
    : undefined;

export const API_BASE_URL = (envApiUrl || DEFAULT_API_BASE_URL)
  .trim()
  .replace(/\/+$/, "")
  .replace(/\/api$/i, "");

export const API_URL = `${API_BASE_URL}/api`;
```

- **Priority 1 (Highest):** `VITE_API_URL` from `frontend/.env` or your hosting provider (Vercel, Netlify, etc.).
- **Priority 2 (Fallback):** `DEFAULT_API_BASE_URL` in `frontend/src/config/api.ts`.
- Trailing slashes (`/`) and a trailing `/api` are stripped automatically from `API_BASE_URL` so both `https://new-api.example.com` and `https://new-api.example.com/` work safely.

### Option A — Change via Environment Variable (Recommended)

1. Open **`frontend/.env`** and update `VITE_API_URL`:
   ```env
   VITE_API_URL=https://your-new-backend-url.com
   ```
2. Update the fallback in **`frontend/src/config/api.ts`** to match:
   ```ts
   const DEFAULT_API_BASE_URL = "https://your-new-backend-url.com";
   ```
3. If deployed on **Vercel** (or another host):
   - Go to **Project Settings → Environment Variables**.
   - Update `VITE_API_URL` to `https://your-new-backend-url.com`.
   - Trigger a **Redeploy** (required because Vite bakes `VITE_*` env vars during `npm run build`).

### Option B — Control It Purely From `frontend/src/config/api.ts`

If you want `frontend/src/config/api.ts` to be the only place to edit:

1. Remove (or comment out) the `VITE_API_URL=...` line in **`frontend/.env`** and remove `VITE_API_URL` from your hosting dashboard.
2. Edit **`DEFAULT_API_BASE_URL`** in **`frontend/src/config/api.ts`**:
   ```ts
   const DEFAULT_API_BASE_URL = "https://your-new-backend-url.com";
   ```
3. Restart `npm run dev` (local) or run `npm run build` / redeploy (production).

### Switching to a Local Backend for Development

To test against a locally running backend (`backend/` defaults to port `3001`):

```env
VITE_API_URL=http://localhost:3001
```

Then restart the Vite dev server (`npm run dev`).

---

## Step 2: Check Backend CORS Settings (If Frontend Domain Changes)

Backend CORS rules live in [`backend/src/server.ts`](../../backend/src/server.ts):

```ts
const allowedOrigins = [
  "https://easyabaca.site",
  "https://www.easyabaca.site",
  "https://app.easyabaca.site",
  "http://localhost:5173",
  "http://localhost:3000",
];
```

`server.ts` also reads **`FRONTEND_URL`** from the backend environment (single URL or comma-separated list):

```env
FRONTEND_URL=https://your-frontend.com,https://www.your-frontend.com
```

If users see **`Blocked by CORS`** in backend logs or browser console, add the frontend domain to `FRONTEND_URL` on the backend host (or to `allowedOrigins` in `backend/src/server.ts`) and restart/redeploy the backend.

---

## Step 3: If You Are Also Moving the Backend or Database

### Backend Environment Variables (`backend/.env` or Host Dashboard)

Set these on the new backend server (reference: [`backend/src/config/env.ts`](../../backend/src/config/env.ts)):

| Variable                 | Purpose                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `PORT`                   | Server port (defaults to `3001`)                                                      |
| `NODE_ENV`               | `production` or `development`                                                         |
| `FRONTEND_URL`           | Allowed frontend origin(s) for CORS (comma-separated supported)                       |
| `SUPABASE_URL`           | Supabase project URL                                                                  |
| `SUPABASE_KEY`           | Supabase service/anon key used by backend                                             |
| `JWT_SECRET`             | Secret for signing access & refresh tokens (use a strong random string in production) |
| `JWT_EXPIRES_IN`         | Access token lifetime (default: `30m`)                                                |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (default: `7d`)                                                |
| `RECAPTCHA_SECRET_KEY`   | Google reCAPTCHA secret key                                                           |
| `RECAPTCHA_SITE_KEY`     | Google reCAPTCHA site key                                                             |

### Frontend Environment Variables (`frontend/.env` or Host Dashboard)

| Variable                  | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `VITE_API_URL`            | Backend API base URL (e.g., `https://your-new-backend-url.com`) |
| `VITE_SUPABASE_URL`       | Supabase project URL                                            |
| `VITE_SUPABASE_KEY`       | Supabase anon public key                                        |
| `VITE_RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key                                       |

### Setting Up a Fresh Database

If you are provisioning a brand-new Supabase / PostgreSQL database, run the schema script in:

- [`database/migrations/FINAL_COMPLETE_FIX.sql`](../../database/migrations/FINAL_COMPLETE_FIX.sql)

---

## Step 4: Verify Your Changes

Run these commands inside the `frontend/` folder after updating the API URL:

```bash
cd frontend
node scripts/verify-api-config.mjs
node scripts/verify-api-cache.mjs
npm run build
```

All three must succeed:

- `verify-api-config.mjs` — verifies `api.ts` exports and ensures zero hardcoded backend URLs exist in `frontend/src/`.
- `verify-api-cache.mjs` — verifies the API cache works with the configured `API_BASE_URL`.
- `npm run build` — verifies TypeScript (`tsc`) and Vite production bundling.

### Browser Smoke Check

1. Open the app in Chrome and open **DevTools → Network** (`F12`).
2. Reload or sign in.
3. Click any `/api/...` request (e.g., `/api/maintenance/status` or `/api/auth/login`) and confirm:
   - **Request URL** points to your new backend domain.
   - **Status** is `200` (not `CORS error`, `404`, or `500`).

---

## Step 5: Rules for Future Code Changes

When adding new pages or components, **never hardcode the backend domain**. Always import from `src/config/api.ts` (or use `apiFetch`/`apiGet` from `src/utils/apiClient.ts`):

```ts
// From src/pages/* or src/Auth/*
import { API_BASE_URL, API_URL, getApiUrl } from "../config/api";

// From src/components/<Folder>/*
import { API_BASE_URL, API_URL, getApiUrl } from "../../config/api";

// Usage examples:
fetch(`${API_BASE_URL}/api/farmers/profile`);
fetch(`${API_URL}/activity-logs`);
fetch(getApiUrl("/api/auth/login"));

// Authenticated helper (automatically prepends API_BASE_URL and refreshes tokens):
import { apiGet } from "../../utils/apiClient";
apiGet("/api/farmers/monitoring");
```

---

## Troubleshooting

| Symptom                                                              | Cause                                                                                                                 | Fix                                                                                                                        |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Edited `frontend/src/config/api.ts`, but app still calls the old URL | `VITE_API_URL` in `frontend/.env` or Vercel/host env vars overrides `DEFAULT_API_BASE_URL`, or build wasn't restarted | Update or remove `VITE_API_URL` in `frontend/.env` and hosting env vars, then restart `npm run dev` / redeploy             |
| `Access to fetch ... has been blocked by CORS policy`                | New frontend domain is not in backend CORS whitelist                                                                  | Add frontend origin to `FRONTEND_URL` on backend host (or `allowedOrigins` in `backend/src/server.ts`) and restart backend |
| Requests go to `/api/api/...` (404)                                  | Mixed `API_URL` with another `/api/` prefix                                                                           | Use `` `${API_BASE_URL}/api/...` `` or `` `${API_URL}/...` `` — never `` `${API_URL}/api/...` ``                           |
| Users get `401 Unauthorized` immediately after switching servers     | Existing browser `localStorage` tokens were signed by the old backend's `JWT_SECRET`                                  | Have users log out and log back in (or clear site data / `localStorage`)                                                   |
