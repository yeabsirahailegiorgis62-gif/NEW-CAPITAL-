# Capital Fleet Management System — Deployment & Operations Guide

**Document Version:** 1.0.0  
**Project:** Capital Real Estate Fleet Management System  
**Date:** October 26, 2026  
**DevOps & Infrastructure Lead:** Senior Systems Engineer  

---

## 1. System Architecture & Prerequisites

### 1.1 Technical Stack Overview
- **Backend API:** NestJS 10, TypeScript 5, Node.js 20+ (current runtime v22.22.1)
- **Database Engine:** PostgreSQL 16.2 with Prisma ORM 5.11
- **Web Frontend:** Vite 5, React 18, Tailwind CSS, Lucide Icons
- **Containerization:** Docker Compose for localized PostgreSQL database

### 1.2 System Requirements
- Node.js >= 20.11.0 (tested on Node v22.22.1)
- npm >= 10.0.0
- Docker & Docker Compose (for PostgreSQL container)
- Minimum RAM: 2 GB (4 GB recommended for development with tsserver and Vite dev server)
- Network Ports:
  - Port `4100`: Backend REST API (Swagger docs at `/api/docs`)
  - Port `5173`: Frontend Web Application
  - Port `5435`: PostgreSQL 16 Database container (`capital_fleet_db`)

---

## 2. Environment Configuration Reference

### 2.1 Backend Configuration (`apps/api/.env`)

```ini
# Environment Mode
NODE_ENV=production
PORT=4100

# Database Connection (PostgreSQL 16)
DATABASE_URL="postgresql://fleet_user:fleet_password_2026@localhost:5435/capital_fleet_db?schema=public"

# Authentication & Cryptographic Keys
JWT_SECRET="capital_real_estate_fleet_super_secret_jwt_key_2026_production"
JWT_EXPIRES_IN="8h"

# Application Metadata
APP_NAME="Capital Real Estate Fleet Management"
CORS_ORIGIN="http://localhost:5173,http://localhost:4100"

# Optional External Integrations (Fallback to In-App notifications if unconfigured)
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMS_GATEWAY_API_KEY=""
```

### 2.2 Frontend Configuration (`apps/web/.env`)

```ini
VITE_API_BASE_URL="http://localhost:4100/api"
VITE_APP_TITLE="Capital Fleet Management"
```

---

## 3. Safe Database Migration Policy

> [!IMPORTANT]
> **Production Safety Rule:** Never execute `prisma db push --force-reset` or `prisma migrate reset` in staging or production environments. This will irrevocably destroy real company records, active vehicle telemetry, and user accounts.

### 3.1 Migration Workflow
1. **Generating Schema Migration:**
   ```bash
   npx prisma migrate dev --name <descriptive_name> --schema=prisma/schema.prisma
   ```
2. **Applying Migrations in Production:**
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```
3. **Database Health Verification:**
   ```bash
   curl -s http://localhost:4100/api/health
   # Expected response: {"status":"ok","timestamp":"...","uptime":...}
   ```

---

## 4. Production Deployment Checklist

### Pre-Deployment Verification:
- [x] Run `npm run lint` (Verifies TypeScript strict type check across monorepo)
- [x] Run `npm run test:api` (Verifies all 35 backend unit tests pass)
- [x] Run `npm run build:api` (Verifies clean compilation of API to `apps/api/dist`)
- [x] Run `npm run build:web` (Verifies clean Vite production bundle in `apps/web/dist`)
- [x] Verify PostgreSQL database connectivity on port 5435

### Deployment Steps:
1. **Start Database Container:**
   ```bash
   npm run db:up
   ```
2. **Apply Migrations:**
   ```bash
   npx prisma migrate deploy --schema=prisma/schema.prisma
   ```
3. **Build Monorepo Artifacts:**
   ```bash
   npm run build
   ```
4. **Launch Backend Service:**
   ```bash
   cd apps/api && node dist/main.js
   ```
5. **Serve Frontend Web Application:**
   Serve `apps/web/dist` through NGINX, Caddy, or Node static server with SPA fallback routing:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   location /api/ {
       proxy_pass http://localhost:4100/api/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

---

## 5. Documented External Service Limitations

1. **Cellular SMS Gateway:**
   - Cellular SMS dispatch to driver handsets relies on an external telecom SMS gateway aggregator. The system is designed to route notifications to the in-app notification center when cellular gateway credentials are omitted, ensuring no workflow disruptions.
2. **Corporate SMTP Email Server:**
   - Email notifications require valid SMTP server credentials. If unconfigured, the system gracefully falls back to persistent in-app notifications.
