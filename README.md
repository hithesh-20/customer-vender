# VenderSathi (ವೆಂಡರ್ ಸಾಥಿ)

**VenderSathi** is a neighborhood shopping and delivery web & backend platform connecting customers directly with nearby street vendors and small local sellers — pushcart/street cart vendors, bicycle vendors, two-wheeler vendors, street stalls, and neighborhood grocery shops — for fresh vegetables, fruits, leafy greens, spices/masalas, and daily essentials.

---

## Core Architecture

- **Frontend (`web_customer/`)**: React 18, React Router v6, Vite 5, Tailwind CSS, `socket.io-client`, Lucide icons, with built-in **English (`en`)** and **Kannada (`kn`)** localization.
- **Backend (`backend/`)**: Node.js, Express 4, Sequelize 6 (supports **PostgreSQL** and local file **SQLite**), `bcryptjs`, `jsonwebtoken` (with session token revocation on logout), `socket.io` real-time order rooms, and OpenAPI `/api-docs`.
- **Optional AI/Analytics Service (`ai_models/`)**: Python microservice (`scikit-learn` + `NumPy`) for vendor demand forecasting and TSP delivery route optimization.

---

## Zero-Mock Data & Integrity Guarantees

1. **No Pre-Seeded Fake Entities**: Runtime startup creates only empty database tables and configurable product category taxonomy (`Vegetables`, `Fruits`, `Leafy Greens`, `Spices & Masalas`, `Grocery Essentials`, `Dairy & Fresh`, `Flowers & Local Items`). All vendors, products, stock counts, addresses, carts, orders, reviews, and support tickets come exclusively from real user actions.
2. **Server-Authoritative Checkout & Idempotency**:
   - Item prices, stock limits, minimum order quantities, delivery fees, free-delivery thresholds, and serviceability are validated on the server inside database transactions.
   - If a vendor updates an item’s price while it sits in a customer’s cart, checkout halts with `409 PRICE_CHANGED` so totals are never silently changed.
   - Duplicate submissions are prevented via `X-Idempotency-Key`.
3. **Honest Availability, Ratings, Tracking & Payments**:
   - Vendors start `isOnline: false` with `rating: null` (`reviewCount: 0`). Ratings are computed strictly from verified `Delivered` orders.
   - Order tracking uses real timestamped status transitions (`Placed -> Accepted -> Preparing -> Out for Delivery -> Delivered` / `Cancelled`) plus real-time customer–vendor chat (`Socket.io`) rather than simulated GPS animations.
   - Orders start with `paymentStatus: 'Pending'`. Orders are marked `'Paid'` **only** after cryptographic Razorpay HMAC-SHA256 signature verification or explicit vendor cash/handover confirmation.

---

## Quick Start (Local Development)

### 1. Backend API (`backend/`)
```bash
cd backend
cp ../.env.example .env   # Review JWT_SECRET & optional provider credentials
npm install
npm start                 # Starts on http://127.0.0.1:3000 (SQLite persisted at ./data/vendersathi.sqlite)
```

### 2. Customer & Vendor Web Application (`web_customer/`)
```bash
cd web_customer
npm install
npm run dev               # Starts on http://0.0.0.0:8080 (proxies /api and /socket.io to backend)
```

### 3. Automated Tests & Production Build
```bash
# Isolated in-memory SQLite integration suite (16 scenarios)
cd backend && npm test

# Production frontend bundle
cd web_customer && npm run build
```

---

## Environment Configuration & External Integrations

| Variable | Required? | Purpose & Behavior When Unset |
|---|---|---|
| `JWT_SECRET` | Required in prod (32+ chars) | Signs access/refresh tokens; server refuses to boot in `NODE_ENV=production` without a 32+ char secret. |
| `DB_DIALECT` / `DB_STORAGE` | Default `sqlite` | Uses persistent file SQLite locally or PostgreSQL (`DB_DIALECT=postgres` with `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`). |
| `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` | Optional | Enables live Razorpay online payment order creation and HMAC-SHA256 verification. When unset, online checkout is honestly disabled and Cash on Delivery / Pay at Pickup remain active. |
| `RAZORPAY_WEBHOOK_SECRET` | Optional | Verifies incoming `/api/v1/webhooks/razorpay` signatures. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Optional | Enables SMS OTP dispatch (`/api/v1/auth/send-otp`). When unset, phone/email + bcrypt password authentication is used. |
| `REDIS_ENABLED` & `REDIS_HOST` | Optional | Uses Redis for cache/revoked-session storage when `true`; falls back to in-memory TTL store otherwise. |
| `WEATHER_API_KEY` | Optional | Queries live OpenWeatherMap data; returns `503 WEATHER_NOT_CONFIGURED` when unset. |
