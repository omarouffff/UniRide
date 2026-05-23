# UniRide Production Environment Guide

## 1. Root causes (what was breaking)

| Symptom | Root cause |
|---------|------------|
| **P1001** | Wrong host, Supabase paused, or IPv4-only direct URL from a network without IPv4 |
| **P1013** | Pooler URL with username `postgres` instead of `postgres.<project-ref>` |
| **Prisma migrate fails in Docker** | `DATABASE_URL` pointed at pooler (6543) without `DIRECT_DATABASE_URL` |
| **Backend exit on boot** | Missing `DATABASE_URL`, `SUPABASE_*`, or `QR_ENCRYPTION_SECRET` in production |
| **Frontend 404 on `/api`** | `NEXT_PUBLIC_API_URL` not set on Vercel → browser called Vercel, not Railway/Render |
| **CORS errors** | `FRONTEND_URL` / `ALLOWED_ORIGINS` missing production Vercel domain |
| **Railway health check fail** | Server not on `0.0.0.0`, wrong `PORT`, or DB not connected |

---

## 2. Correct `DATABASE_URL` (copy from Supabase)

Supabase Dashboard → **Project Settings** → **Database** → **Connection string** → **URI**.

### Option A — Direct (recommended for Railway)

Use for **both** `DATABASE_URL` and `DIRECT_DATABASE_URL`:

```bash
postgresql://postgres:[URL-ENCODED-PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

Example (replace values):

```bash
DATABASE_URL=postgresql://postgres:MyP%40ssw0rd@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres:MyP%40ssw0rd@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
```

### Option B — Transaction pooler + direct migrations

**App (pooler, port 6543):**

```bash
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[URL-ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

**Migrations (direct, port 5432):**

```bash
DIRECT_DATABASE_URL=postgresql://postgres:[URL-ENCODED-PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

> Username on pooler **must** be `postgres.abcdefghijklmnop`, not `postgres`.

### Password rules

- Special characters (`@`, `#`, `%`, etc.) **must be URL-encoded** in the connection string.
- Reset password in Supabase if unsure.

---

## 3. Final environment variables

### Railway (backend) — Root Directory: `backend`

```bash
NODE_ENV=production
PORT=5000

# Database (Option A — direct)
DATABASE_URL=postgresql://postgres:YOUR_ENCODED_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
DIRECT_DATABASE_URL=postgresql://postgres:YOUR_ENCODED_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require

# Supabase Auth
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# Security
QR_ENCRYPTION_SECRET=your-32-plus-character-random-string

# CORS
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app
ALLOW_VERCEL_PREVIEWS=true

# Optional
REDIS_URL=rediss://default:...@upstash.io:6379
SENTRY_DSN=
```

### Vercel (frontend)

```bash
NEXT_PUBLIC_API_URL=https://your-service.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-service.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

> `NEXT_PUBLIC_API_URL` **must end with `/api`** (or the app normalizes it automatically).

### Supabase Auth redirect URLs

Authentication → URL configuration:

- `https://your-app.vercel.app/auth/reset-password`
- `https://your-app.vercel.app/auth/verify-email`
- `http://localhost:3000/auth/reset-password` (local)

---

## 4. Deployment checklist

### Railway

- [ ] New service → **Root Directory** = `backend`
- [ ] Deploy from Dockerfile (or connect repo; `railway.toml` points to `backend/Dockerfile`)
- [ ] Set all variables in section 3
- [ ] Generate domain → use as `NEXT_PUBLIC_API_URL` base (with `/api`)
- [ ] Logs show: `PostgreSQL connected successfully via Prisma`
- [ ] `GET https://<railway>/api/health` → `"database": { "connected": true }`

### Vercel

- [ ] Set all `NEXT_PUBLIC_*` variables for Production + Preview
- [ ] Redeploy after env changes
- [ ] Network tab: API calls go to Railway, not `*.vercel.app/api`

### Prisma (first deploy)

```bash
cd backend
npx prisma migrate deploy
```

Docker/Railway entrypoint runs this automatically.

---

## 5. Verify production

```bash
curl https://YOUR-BACKEND/api/health
curl https://YOUR-BACKEND/api/config
curl https://YOUR-BACKEND/api/bookings/public/trips
```

---

## 6. Local development

```bash
# Terminal 1
cd backend && cp .env.example .env   # fill DATABASE_URL from Supabase
npm install && npx prisma migrate deploy && npm run dev

# Terminal 2
cd frontend && cp .env.production.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm run dev
```
