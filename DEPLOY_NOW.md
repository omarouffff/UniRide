# Deploy UniRide Online - Free Tier

## 1. Backend on Render

1. Push this repo to GitHub.
2. Open Render > New > Blueprint.
3. Select the GitHub repo.
4. Render will read `render.yaml`.
5. Add the required secret env vars:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `QR_ENCRYPTION_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `FRONTEND_URL`
6. Deploy and copy the backend URL.
7. Test:
   ```bash
   https://YOUR-BACKEND.onrender.com/api/health
   ```

## 2. Frontend on Vercel

1. Open Vercel > Add New Project.
2. Import the same GitHub repo.
3. Set Root Directory to `frontend`.
4. Add env vars:
   - `NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.onrender.com/api`
   - `NEXT_PUBLIC_API_BASE_URL=https://YOUR-BACKEND.onrender.com/api`
5. Deploy.
6. Copy the Vercel URL.
7. Go back to Render and set:
   - `FRONTEND_URL=https://YOUR-FRONTEND.vercel.app`
8. Redeploy backend.

## 3. Final URLs

- Frontend: `https://YOUR-FRONTEND.vercel.app`
- Backend: `https://YOUR-BACKEND.onrender.com`
- Health check: `https://YOUR-BACKEND.onrender.com/api/health`

## Important

Cloudinary must be configured before student registration works online.
