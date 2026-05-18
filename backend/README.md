# UNI Transportation Backend

Phase 1 backend initialization for the UNI Transportation project.

## Folder structure

- `server.js` - Express server entry point.
- `config/db.js` - MongoDB connection logic.
- `config/cloudinary.js` - Cloudinary configuration.
- `config/redisClient.js` - Redis client bootstrap.
- `models/User.js` - User schema and authentication fields.
- `models/UniversityVerification.js` - University ID verification audit records.
- `routes/authRoutes.js` - Authentication and verification routes.
- `controllers/authController.js` - Register, login, profile, and verification logic.
- `services/authService.js` - validation helpers.
- `services/cloudinaryService.js` - image upload integration.
- `middleware/authMiddleware.js` - JWT protection and role checks.
- `middleware/uploadMiddleware.js` - multer image upload handling.
- `middleware/errorHandler.js` - 404 and error middleware.
- `utils/jwt.js` - token generation helper.

## Run locally

1. Copy `.env.example` to `.env`.
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```

## APIs created in Phase 1

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/verify-university-id`

## Booking APIs added in Phase 2

- `POST /api/bookings` — create a new ride booking
- `GET /api/bookings` — fetch current user bookings
- `GET /api/bookings/:id` — get booking detail

## Notes

- The project uses JWT authentication.
- University ID image upload uses Cloudinary.
- MongoDB connection uses `MONGODB_URI`.
- Redis is initialized if `REDIS_URL` is provided.
