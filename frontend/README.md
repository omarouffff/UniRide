# UNI Transportation Frontend

This frontend is built with Next.js 14 App Router, Tailwind CSS, TypeScript, React Hook Form, Zod, and Zustand.

## Folder structure

- `app/` - Next.js pages and route layout.
- `components/` - Reusable UI and layout components.
- `lib/` - API client and utility helpers.
- `store/` - Zustand authentication store.
- `types/` - shared TypeScript models.

## Available pages

- `/` - marketing/home page.
- `/auth/login` - login page.
- `/auth/register` - registration page.
- `/auth/verify-university-id` - upload university ID proof.
- `/dashboard` - student dashboard.
- `/bookings` - current bookings list.
- `/bookings/new` - create a new booking.
- `/profile` - student profile page.
- `/qr-code` - boarding QR page.

## Run locally

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Copy `.env.example` to `.env.local` and configure `NEXT_PUBLIC_API_BASE_URL`.
3. Start development server:
   ```bash
   npm run dev
   ```

## Integration notes

- Frontend communicates with backend via Axios using `NEXT_PUBLIC_API_BASE_URL`.
- Auth state is persisted in localStorage using Zustand.
- Protected pages redirect to `/auth/login` when the user is not authenticated.
- Toast notifications are implemented with Radix UI primitives.
