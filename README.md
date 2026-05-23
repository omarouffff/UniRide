# UniRide

Production-grade campus transportation platform — book seats, pay online, scan QR boarding passes, and manage operations from an admin dashboard.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind, Framer Motion, React Query |
| Backend | Express, Prisma, PostgreSQL |
| Auth | Supabase Auth (JWT) synced to Prisma users |
| Realtime | Socket.io + Redis |
| Payments | Paymob, Fawry, Stripe, manual screenshot verification |
| Media | Cloudinary |

## Project structure

```
backend/
  controllers/   # HTTP handlers
  services/      # Business logic
  repositories/  # Prisma data access
  middleware/    # Auth, validation, uploads
  prisma/        # Schema & migrations
  routes/
  jobs/

frontend/
  app/           # App Router pages
  components/    # UI & layout
  features/      # Feature modules (extend here)
  hooks/
  lib/
  messages/      # i18n (en, ar)
```

## Quick start

### 1. Database & Redis

```bash
docker compose up -d postgres redis
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Set DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, QR_ENCRYPTION_SECRET
npm install
npx prisma migrate deploy
npm run seed:admin
npm run dev
```

### 3. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_API_URL
npm install
npm run dev
```

## Deployment

- **Backend (Render):** see `render.yaml` — requires `DATABASE_URL` (PostgreSQL) and Supabase service role key.
- **Frontend (Vercel):** set `NEXT_PUBLIC_API_URL` to your Render API URL.

## API highlights

- `GET /api/bookings/public/trips` — public trip listing (homepage)
- `POST /api/auth/sync` — sync Supabase user to PostgreSQL
- `GET /api/auth/me` — profile (Supabase JWT required)
- Admin: users, trips, routes, buses, payments, complaints, analytics

## Security

Helmet, rate limiting, CSRF, XSS sanitization, encrypted QR payloads, Supabase JWT verification, audit logging.
