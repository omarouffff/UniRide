# UniRide Production Deployment

## Register Debug Flow

1. Frontend page `/register` sends `multipart/form-data` to `POST /api/auth/register`.
2. Backend route `routes/authRoutes.js` receives fields:
   - `name`
   - `email`
   - `password`
   - `universityId`
   - `idCardImage`
   - `paymentProofImage`
3. `multer.memoryStorage()` validates image type and keeps image buffers in memory.
4. `authController.registerUser` validates required fields, email, university ID, and duplicate email.
5. Backend uploads both images to Cloudinary before saving the user.
6. Cloudinary returns `secure_url` values.
7. `User.create` stores only URLs in MongoDB:
   - `idCardImage`
   - `paymentProofImage`
8. `User` hashes `passwordHash` with bcrypt in `pre('save')`.
9. API returns `201` with:
   - `user`
   - `token`

If a user is not saved, check `/api/health` first. It reports MongoDB state and whether Cloudinary credentials are configured.

## Required Environment Variables

Backend:

```bash
NODE_ENV=production
PORT=4000
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/uniride?retryWrites=true&w=majority
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
QR_ENCRYPTION_SECRET=use-a-different-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=https://your-vercel-app.vercel.app
```

Frontend:

```bash
NEXT_PUBLIC_API_URL=https://your-backend-url/api
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url/api
```

## MongoDB Atlas

1. Create a MongoDB Atlas account.
2. Create a free or production cluster.
3. Create a database user with password auth.
4. Network Access:
   - for Render/Vercel testing: allow `0.0.0.0/0`
   - for stricter production: allow only backend egress IPs if your host provides them.
5. Copy the Node.js connection string.
6. Set it as `MONGO_URI` in backend production env.

## Backend on Render

1. Push the repo to GitHub.
2. Render > New > Web Service.
3. Root directory: `backend`.
4. Build command:
   ```bash
   npm install
   ```
5. Start command:
   ```bash
   npm start
   ```
6. Add backend env vars listed above.
7. Deploy.
8. Verify:
   ```bash
   curl https://your-render-service.onrender.com/api/health
   ```

## Backend on Google Cloud Run

From `backend/`:

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/uniride-backend
gcloud run deploy uniride-backend \
  --image gcr.io/PROJECT_ID/uniride-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,FRONTEND_URL=https://your-vercel-app.vercel.app
```

Add secrets such as `MONGO_URI`, `JWT_SECRET`, and Cloudinary credentials using Cloud Run environment variables or Secret Manager.

## Frontend on Vercel

1. Import the repo in Vercel.
2. Root directory: `frontend`.
3. Framework: Next.js.
4. Add env vars:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-url/api
   NEXT_PUBLIC_API_BASE_URL=https://your-backend-url/api
   ```
5. Deploy.
6. Update backend `FRONTEND_URL` to the Vercel URL and redeploy backend.

## Production Architecture

```text
User Browser
  |
  | HTTPS
  v
Vercel - Next.js Frontend
  |
  | HTTPS API calls with JWT
  v
Render or Cloud Run - Express Backend
  |
  | mongoose
  v
MongoDB Atlas
  |
  stores user, trips, bookings, Cloudinary URLs only

Express Backend
  |
  | secure image upload
  v
Cloudinary
  |
  returns secure_url
```
