# UniRide Production Setup Guide

## 1. Generate secrets (never commit real values)

```bash
cd backend
node scripts/generateSecrets.js
```

Copy output into your hosting provider's environment variables:

- `JWT_SECRET` — access tokens (64+ chars)
- `JWT_REFRESH_SECRET` — refresh tokens (separate secret)
- `QR_ENCRYPTION_SECRET` — boarding QR encryption (separate secret)

## 2. MongoDB Atlas

1. Create cluster and database user.
2. Network Access: allow Render/Railway IPs or `0.0.0.0/0` for initial setup.
3. Set `MONGO_URI` on backend — **rotate any password that was ever committed to git**.

## 3. Cloudinary

Set in backend environment:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Uploads return `secure_url` for university IDs and payment proofs.

## 4. Resend (email)

```env
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM=UniRide <noreply@yourdomain.com>
```

Flows: verification, password reset, booking/payment notifications.

## 5. Backend (Render)

| Variable | Required |
|----------|----------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Yes |
| `JWT_SECRET` | Yes |
| `JWT_REFRESH_SECRET` | Yes |
| `QR_ENCRYPTION_SECRET` | Yes |
| `RESEND_API_KEY` | Yes |
| `EMAIL_FROM` | Yes |
| `FRONTEND_URL` | Yes (Vercel URL) |
| `ALLOWED_ORIGINS` | Yes |
| `CLOUDINARY_*` | Yes for uploads |
| `REDIS_URL` | Recommended (Upstash) |

Health check: `GET /api/health`

## 6. Frontend (Vercel)

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://your-backend.onrender.com
```

Redeploy after changing `NEXT_PUBLIC_*` variables.

## 7. Fawry

- **Development:** sandbox at `https://atfawry.fawrystaging.com` (automatic when `NODE_ENV !== production`)
- **Production:** `https://www.atfawry.com`
- Webhook: `POST /api/payments/fawry/webhook`

## 8. Admin account

```bash
cd backend
ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=YourSecurePassword npm run seed:admin
```

## 9. Security checklist

- [ ] No `.env` files in git
- [ ] All placeholder secrets replaced
- [ ] MongoDB password rotated if exposed
- [ ] CORS lists exact Vercel URL
- [ ] HTTPS only in production
