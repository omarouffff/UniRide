# UniRide Backend

Production-oriented Express, MongoDB, Cloudinary, JWT, and role-based API for the UniRide university transportation SaaS.

## Folder structure

- `server.js` - Express and Socket.io server entry point.
- `config/db.js` - MongoDB connection logic.
- `config/cloudinary.js` - Cloudinary configuration.
- `config/redisClient.js` - optional Redis bootstrap.
- `models/User.js` - users, roles, approval lifecycle, and document URLs.
- `models/Trip.js` - scheduled trips, buses, capacity, and driver assignment.
- `models/Booking.js` - confirmed, waiting-list, and cancelled bookings.
- `routes/authRoutes.js` - register, login, profile, and document upload.
- `routes/bookingRoutes.js` - dashboard, trip discovery, booking, cancellation.
- `routes/adminRoutes.js` - users management, trips management, analytics.
- `controllers/` - request handlers for auth, bookings, admin, driver, dashboard.
- `services/cloudinaryService.js` - Cloudinary upload integration.
- `services/bookingService.js` - seat allocation and waiting-list assignment.
- `middleware/authMiddleware.js` - JWT protection, role checks, approval gate.
- `middleware/uploadMiddleware.js` - multer image validation and temp storage.
- `utils/qrPayload.js` - encrypted QR payload generation.

## APIs

- `POST /api/auth/register` - multipart registration with `idCardImage` and `paymentProofImage`.
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/verify-university-id`
- `GET /api/bookings/dashboard`
- `GET /api/bookings/trips`
- `POST /api/bookings`
- `GET /api/bookings`
- `PATCH /api/bookings/:id/cancel`
- `GET /api/admin/users?status=pending|approved|rejected`
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/trips`
- `POST /api/admin/trips`
- `GET /api/admin/analytics`

## Run locally

1. Copy `.env.example` to `.env`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```

## Notes

- Student lifecycle is `pending -> approved -> rejected`.
- University ID and payment proof uploads use Cloudinary; MongoDB stores secure URLs only.
- Approved students can book trips. Pending or rejected students can log in but cannot book.
- QR payloads are encrypted with `QR_ENCRYPTION_SECRET` and rendered as QR images.
