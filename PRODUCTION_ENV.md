# UniRide Production Environment Checklist

## Root cause of 404 errors

Vercel hosts **only the Next.js frontend**. API routes live on **Render** (`/api/*`).

If `NEXT_PUBLIC_API_URL` is missing, the browser used to call `https://your-app.vercel.app/api/...` → **404**.

## Vercel (frontend)

Set for **Production**, **Preview**, and **Development**:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `https://uniride-api.onrender.com/api` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://uniride-api.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` |

Redeploy after saving variables.

### Verify

1. Open `https://YOUR-VERCEL-APP.vercel.app` — no config error screen.
2. Browser Network tab: requests go to `onrender.com/api/...`, not `vercel.app/api/...`.
3. `GET https://YOUR-RENDER-APP.onrender.com/api/health` → `{ "success": true }`.
4. `GET https://YOUR-RENDER-APP.onrender.com/api/csrf-token` → `{ "csrfToken": "..." }`.
5. `GET https://YOUR-RENDER-APP.onrender.com/api/bookings/public/trips` → `{ "trips": [...] }`.

## Render (backend)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Same project as frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only — never expose to browser |
| `SUPABASE_ANON_KEY` | For `/api/auth/login` and `/api/auth/register` |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` (comma-separated for multiple) |
| `ALLOW_VERCEL_PREVIEWS` | `true` (allows `*.vercel.app`) |
| `REDIS_URL` | Optional; Upstash recommended |
| `QR_ENCRYPTION_SECRET` | 32+ random characters |

### CORS

- Production Vercel domain must be in `FRONTEND_URL` or `ALLOWED_ORIGINS`.
- Preview deployments (`*.vercel.app`) are allowed when `ALLOW_VERCEL_PREVIEWS` is not `false`.

## API routes (Render)

| Method | Path |
|--------|------|
| GET | `/api/health` |
| GET | `/api/config` |
| GET | `/api/csrf-token` |
| GET | `/api/bookings/public/trips` |
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
| GET | `/api/auth/me` (Bearer Supabase JWT) |
| POST | `/api/auth/sync` (Bearer Supabase JWT) |

## Optional Vercel proxy

When `NEXT_PUBLIC_API_URL` is set at **build time**, `next.config.mjs` also proxies `/api/*` on Vercel to your Render backend. The app still uses the explicit API URL from env (recommended).
