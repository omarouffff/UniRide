# UniRide Production Deploy (Railway + Vercel + Supabase)

Stack: **Next.js** (Vercel) · **Express + Prisma** (Railway Docker) · **Supabase Postgres + Auth**

---

## 1. Railway — Backend

### Service settings

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Builder | Dockerfile |
| Health check path | `/api/health` |

### Required variables

```bash
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://postgres.ssykhipljhshlvcotyjy:NEW_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require

DIRECT_DATABASE_URL=postgresql://postgres:NEW_PASSWORD@db.ssykhipljhshlvcotyjy.supabase.co:5432/postgres?sslmode=require

SUPABASE_URL=https://ssykhipljhshlvcotyjy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase Dashboard → Settings → API → service_role>
SUPABASE_ANON_KEY=<anon public key>

QR_ENCRYPTION_SECRET=<32+ random characters>

FRONTEND_URL=https://uni-ride-psi.vercel.app
ALLOWED_ORIGINS=https://uni-ride-psi.vercel.app
ALLOW_VERCEL_PREVIEWS=true

EMAIL_FROM=UniRide <noreply@uniride.app>
```

### Prisma behaviour

| URL | Used for |
|-----|----------|
| `DATABASE_URL` (pooler **6543**) | App runtime via Prisma Client |
| `DIRECT_DATABASE_URL` (`db.*.supabase.co` **5432**) | `prisma migrate deploy` only |

`DIRECT_URL` is an accepted alias for `DIRECT_DATABASE_URL`.

### Verify after deploy

```bash
curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/health
curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/ready
curl https://YOUR-RAILWAY-DOMAIN.up.railway.app/api/config
```

- `/api/health` → always **200** when server is up (`database.connected` should be `true`)
- `/api/ready` → **200** only when DB is reachable

---

## 2. Vercel — Frontend

Root Directory: **`frontend`**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ssykhipljhshlvcotyjy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>

NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app
```

Redeploy after changing any `NEXT_PUBLIC_*` variable.

---

## 3. Supabase Auth URLs

Project → Authentication → URL configuration:

- Site URL: `https://uni-ride-psi.vercel.app`
- Redirects: `https://uni-ride-psi.vercel.app/auth/reset-password`, `https://uni-ride-psi.vercel.app/auth/verify-email`

---

## 4. Deploy order

1. Set Railway backend variables → deploy → copy public Railway URL  
2. Set Vercel `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SOCKET_URL` to that Railway URL  
3. Redeploy Vercel  
4. Confirm CORS: `FRONTEND_URL` matches Vercel domain (no trailing slash)

---

## 5. Troubleshooting

| Issue | Fix |
|-------|-----|
| Migration fails on deploy | Check `DIRECT_DATABASE_URL` uses `db.ssykhipljhshlvcotyjy.supabase.co:5432`, user `postgres` |
| P1013 | Pooler URL must use username `postgres.ssykhipljhshlvcotyjy`, not `postgres` |
| CORS error | Set `FRONTEND_URL` + `ALLOWED_ORIGINS` to `https://uni-ride-psi.vercel.app` |
| Supabase not configured (frontend) | Set `NEXT_PUBLIC_SUPABASE_*` on Vercel, redeploy |
| Container restart loop | Check Railway logs; increase `MIGRATE_RETRIES`; ensure Supabase project is active |

Emergency: `SKIP_MIGRATIONS=true` on Railway (run `npx prisma migrate deploy` locally once).

---

See also: `PRODUCTION_ENV.md`, `backend/railway.env.example`, `frontend/.env.production.example`
