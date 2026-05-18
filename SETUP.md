# UniRide - Complete Project Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account
- Cloudinary account
- Redis instance (or use Upstash)
- Paymob/Fawry developer accounts (optional)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Backend Setup

```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:5000
```

## 📁 Project Structure

### Frontend (`/frontend`)
```
app/
  ├── (auth)/
  │   ├── login/
  │   ├── register/
  │   └── verify-university-id/
  ├── dashboard/
  ├── bookings/
  ├── admin/
  │   ├── dashboard/
  │   ├── users/
  │   └── analytics/
  ├── driver/
  │   └── dashboard/
  └── payment/
components/
  ├── ui/
  └── providers/
store/
  └── (Zustand stores)
lib/
  ├── api.ts
  └── utils.ts
```

### Backend (`/backend`)
```
models/
  ├── User.js
  ├── Trip.js
  ├── Booking.js
  ├── Bus.js
  ├── Payment.js
  ├── Analytics.js
  └── UniversityVerification.js
routes/
  ├── auth/
  ├── bookings/
  ├── admin/
  └── driver/
controllers/
services/
  ├── authService.js
  ├── bookingService.js
  └── cloudinaryService.js
middleware/
  ├── authMiddleware.js
  ├── errorHandler.js
  └── uploadMiddleware.js
config/
  ├── db.js
  ├── cloudinary.js
  └── redisClient.js
```

## 🔐 Environment Variables

### Backend (`.env`)
```
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/uniride
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@uniride.com

# Payments
PAYMOB_API_KEY=your-paymob-api-key
FAWRY_MERCHANT_CODE=your-fawry-code
FAWRY_SECURITY_KEY=your-fawry-key
STRIPE_SECRET_KEY=your-stripe-key

# Frontend
FRONTEND_URL=http://localhost:3000
FRONTEND_PROD_URL=https://yourdomain.com

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## 🗄️ Database Schema

### Core Collections
- **Users**: Accounts with roles (student, driver, admin, super_admin)
- **Trips**: Route schedules with capacity
- **Bookings**: Student seat reservations
- **Buses**: Vehicle inventory
- **Payments**: Transaction records
- **Analytics**: System metrics
- **UniversityVerification**: Document approvals

## 🔑 Key Features

### Authentication
- Email/Password registration
- University ID verification
- JWT tokens
- Role-based access control

### Student Features
- Browse available trips
- Book/cancel seats
- Waiting list management
- QR code generation
- Payment tracking
- Trip history

### Driver Features
- View assigned trips
- Manage passenger list
- QR code scanning
- Earnings dashboard
- Real-time notifications

### Admin Features
- User management & approval
- Trip scheduling
- Bus inventory
- Financial reports
- Analytics dashboard
- System settings

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Connect your GitHub repo to Vercel
# Push to main branch for auto-deployment
git push origin main
```

### Backend (Render)
```bash
# Create new Web Service on Render
# Connect GitHub repo
# Set environment variables
# Deploy from main branch
```

### Database (MongoDB Atlas)
```bash
# Create cluster at mongodb.com
# Get connection string
# Add to MONGODB_URI
```

### Images (Cloudinary)
```bash
# Sign up at cloudinary.com
# Get API credentials
# Add to env variables
```

## 📊 Admin Dashboard

### User Management
- View all users with filters
- Approve/reject registrations
- Ban accounts
- View uploaded documents
- Search and analytics

### Trip Management
- Create new trips
- Assign drivers and buses
- Set pricing and capacity
- Schedule recurring trips

### Financial Management
- Revenue tracking
- Payment methods analysis
- Expense logging
- Profit calculations
- Export reports (PDF/CSV)

### Analytics
- Booking trends
- User growth
- Trip occupancy rates
- No-show analytics
- Peak booking times
- Revenue forecasting

## 🔒 Security Features

- Helmet.js for HTTP headers
- Rate limiting
- Input validation with Zod
- Password hashing (bcryptjs)
- JWT authentication
- CORS configuration
- Environment variables
- NoSQL injection protection
- XSS prevention

## 📱 Real-time Features

Using Socket.io for:
- Live seat updates
- Booking notifications
- Driver location tracking
- Admin notifications
- Payment confirmations

## 🧪 Testing

```bash
# Backend
npm test

# Frontend
npm run test
```

## 📞 Support

For issues and questions:
- GitHub Issues: [project-repo/issues](https://github.com)
- Email: support@uniride.com
- Documentation: [docs.uniride.com](https://docs.uniride.com)

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ for modern university transportation**
