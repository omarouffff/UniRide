# UNI Transportation

A production-ready university transportation platform with a modern Next.js frontend and a Node.js + Express backend.

## Project structure

- `backend/` - Express server, MongoDB models, authentication, booking APIs, Cloudinary upload, Redis client.
- `frontend/` - Next.js 14 App Router, Tailwind CSS, Zustand authentication store, React Hook Form, Zod, Axios.

## Running locally

### Backend
1. Copy `backend/.env.example` to `backend/.env`.
2. Configure MongoDB, JWT secret, Cloudinary, Redis, and frontend URL.
3. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Run the backend server:
   ```bash
   npm run dev
   ```

### Frontend
1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`.
3. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Run the frontend:
   ```bash
   npm run dev
   ```

## Phase 1 completed
- Backend auth system
- MongoDB connection
- JWT authentication
- University ID upload flow
- Cloudinary image upload

## Phase 2 progress
- Next.js frontend scaffold
- Authentication pages
- Student dashboard
- Booking pages
- Profile and QR pages
- Toast notifications and protected routing

## Security and deployment hardening
- Cookie-based JWT auth with refresh token rotation and secure HttpOnly cookies
- CSRF protection plus XSS and NoSQL injection sanitization
- Redis-backed rate limiting, IP throttling, login lockout, and brute force protections
- Sentry request error tracking and centralized Winston logging
- Version mismatch detection for frontend/backend deployment skew protection
- Cloudinary upload restrictions and MIME validation
- Health, keep-alive, and readiness endpoints for production stability
