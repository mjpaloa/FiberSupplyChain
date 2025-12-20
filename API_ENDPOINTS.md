# 📡 API Endpoints Documentation

## Base URL
- **Local**: `http://localhost:3001`
- **Production**: `https://your-backend-api.vercel.app`

All endpoints are prefixed with `/api` (e.g., `/api/auth/login`)

---

## 🔐 Authentication Routes (`/api/auth`)
- `POST /login` - User login
- `POST /refresh` - Refresh access token
- `POST /logout` - User logout

## 👤 User Routes (`/api/users`)
- User management endpoints

## 🏢 MAO Routes (`/api/mao`)
- MAO officer management

## 🛒 Buyers Routes (`/api/buyers`)
- Buyer management and operations

## 👨‍🌾 Farmers Routes (`/api/farmers`)
- Farmer management and operations

## 👑 Admin Routes (`/api/admin`)
- Administrative functions
- User management
- System configuration

## 🔧 Maintenance Routes (`/api/maintenance`)
- System maintenance controls
- Maintenance mode toggle

## 🌱 Seedling Routes (`/api/seedlings`)
- Seedling inventory management
- Distribution tracking

## 🏛️ Association Seedling Routes (`/api/association-seedlings`)
- Association-level seedling management

## 📰 Articles Routes (`/api/articles`)
- Content management
- News and updates

## 👥 Team Routes (`/api/team`)
- Team member management

## 🌾 Harvest Routes (`/api/harvests`)
- Harvest tracking
- Yield management

## 📦 Inventory Routes (`/api/inventory`)
- Inventory management
- Stock tracking

## 💰 Sales Routes (`/api/sales`)
- Sales reports
- Transaction management
- Report verification

## 🏪 CUSAFA Inventory Routes (`/api/cusafa-inventory`)
- CUSAFA-specific inventory

## 🛍️ Buyer Purchases Routes (`/api/buyer-purchases`)
- Purchase order management
- Transaction history

## 📋 Buyer Listings Routes (`/api/buyer-listings`)
- Product listings for buyers

## 🚚 Fiber Delivery Routes (`/api/fiber-deliveries`)
- Delivery tracking
- Logistics management

## 📊 Activity Logs Routes (`/api/activity-logs`)
- System activity tracking
- User action logs
- IP/MAC blocking

---

## 🔒 Authentication

Most endpoints require a Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens expire after 30 minutes. Use the refresh token endpoint to get a new access token.

---

## 🌐 CORS Configuration

The backend accepts requests from:
- `http://localhost:5173` (development)
- `https://easyabaca.site` (production)

Configure `FRONTEND_URL` environment variable accordingly.
