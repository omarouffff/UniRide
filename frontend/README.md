# UniRide Frontend

Next.js 14 App Router frontend for UniRide, built with TypeScript, Tailwind CSS, shadcn-style primitives, React Hook Form, Zod, Axios, and Zustand.

## Folder structure

- `app/` - route pages and root layout.
- `app/login` - login.
- `app/register` - student registration with document uploads.
- `app/dashboard` - student status and upcoming trip dashboard.
- `app/booking` - available trip booking flow.
- `app/my-bookings` - booking history and cancellation.
- `app/qr` - encrypted QR boarding pass.
- `app/admin` - admin users, trips, and analytics dashboard.
- `components/ui` - shared UI primitives.
- `components/providers` - theme, query, and toast providers.
- `lib/api.ts` - Axios API client.
- `store/useAuthStore.ts` - persisted auth store.
- `types/` - shared TypeScript models.

## Available pages

- `/`
- `/login`
- `/register`
- `/dashboard`
- `/booking`
- `/my-bookings`
- `/qr`
- `/admin`
- `/auth/login` and `/auth/register` compatibility redirects.

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env.local`:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
