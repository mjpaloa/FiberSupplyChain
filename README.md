# 🧶 EasyAbaca: Fiber Supply Chain Management System

EasyAbaca is a comprehensive, modern supply chain management system designed to digitize and optimize the Abaca fiber industry in Culiram. It connects Farmers, Associations (CUSAFA), Buyers, and the Municipal Agriculture Office (MAO) into a unified, real-time platform.

## 🚀 Live Demo
- **Frontend URL:** [https://easyabaca.site](https://easyabaca.site)
- **API URL:** [https://easyabaca-api.vercel.app](https://easyabaca-api.vercel.app)

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Modern UI, Glassmorphism, Responsive Design)
- **Icons:** Lucide React
- **Charts:** Recharts (Interactive Data Visualization)
- **State Management:** React Hooks (useState, useEffect, useMemo)

### Backend
- **Runtime:** Node.js
- **Server:** Express.js (TypeScript)
- **Authentication:** JWT (JSON Web Tokens) & Bcrypt for password hashing
- **Integration:** Google reCAPTCHA v2 (Security)

### Database & Hosting
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (CI/CD via GitHub Integration)

---

## 👥 User Roles & Features

### 👨‍🌾 Farmer Dashboard
- **Analytics:** View total sales, fiber harvested, and seedling trends.
- **Monitoring:** Log farm health status and growth progress.
- **Deliveries:** Track fiber deliveries from farm to buyer.
- **Reports:** Submit and view personal sales reports.

### 🏢 Association (CUSAFA)
- **Inventory Management:** Manage collected fiber from various farmers.
- **Distribution:** Oversee the distribution of seedlings provided by MAO.
- **Member Oversight:** Monitor active farmers and their production output.

### 💰 Buyer Portal
- **Price Listings:** Post real-time buying prices for different fiber grades.
- **Purchase Tracking:** Manage and track purchased fiber batches.
- **Digital Receipts:** Generate digital transaction records.

### 🏛️ Municipal Agriculture Office (MAO)
- **Verification:** Review and approve/reject sales reports for auditing.
- **Policy Making:** Access municipality-wide analytics for better agricultural planning.
- **Seedling Log:** Track the lifecycle of distributed seedlings.

---

## 📦 Local Development

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Git

### Initial Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/mjdesu1/FiberSupplyChain-v2.git
   cd FiberSupplyChain-v2
   ```

2. **Frontend Installation:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Backend Installation:**
   ```bash
   cd ../backend
   npm install
   npm run dev
   ```

### Environment Variables
Configure your `.env` files in both `frontend/` and `backend/` directories based on the provided deployment guides.

---

## 🚢 Deployment Guide

The project is optimized for deployment on **Vercel**.

1. **Connect GitHub:** Link your repository to Vercel.
2. **Configure Root Directory:** Deploy the `backend` and `frontend` as separate projects or a monorepo.
3. **Set Environment Variables:** Ensure `SUPABASE_URL`, `SUPABASE_KEY`, and `JWT_SECRET` are correctly set in the Vercel dashboard.
4. **CI/CD:** Any push to the `main` branch automatically triggers a new deployment.

---

## ⚖️ Localization
This system is specifically localized for the Philippines:
- **Currency:** Philippine Peso (₱)
- **Measurement:** Kilograms (kg)
- **Language:** English/Tagalog support

---

## 📧 Contact
For system issues or agricultural inquiries, please contact the **Municipal Agriculture Office (MAO) Culiram**.
