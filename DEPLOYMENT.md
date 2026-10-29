# VenderSathi — Deployment & Operations Guide

## 1. Pre-Deployment Checklist

1. **Secrets & Environment Variables**:
   - Copy `.env.example` to `backend/.env` (or inject via container orchestrator secrets).
   - Set `NODE_ENV=production` and generate a strong `JWT_SECRET` (`openssl rand -hex 32`).
   - Configure PostgreSQL (`DB_DIALECT=postgres`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true`).
2. **Optional Third-Party Provider Credentials**:
   - **Online Payments (Razorpay)**: Set real `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Until configured, VenderSathi automatically disables the online payment radio option and operates honestly with Cash on Delivery (`COD`) and `Pay at Pickup`.
   - **SMS OTP (Twilio)**: Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` if SMS OTP login is desired alongside mobile/email + password login.
   - **Redis**: Set `REDIS_ENABLED=true`, `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` for multi-instance session revocation and caching.

---

## 2. Docker Compose Production Stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Services started:
- `postgres`: PostgreSQL 15 database with persistent volume
- `redis`: Redis 7 cache & token revocation store
- `backend`: VenderSathi Express + Socket.io API (`:3000`)
- `ai_service`: Python demand forecasting & route optimization service (`:5000`)
- `nginx`: Reverse proxy serving built `web_customer/dist` static bundle and proxying `/api` & `/socket.io`

---

## 3. Health & Verification Endpoints

- `GET /api/v1/health`: Reports database dialect, cache backend, uptime, and boolean status of optional integrations (`onlinePayments`, `smsOtp`, `weather`, `liveMaps`).
- `GET /api-docs`: Interactive OpenAPI 3.0 documentation.
