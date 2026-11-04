# Capital Fleet — Vehicle Booking & Logistics Management System

> **Enterprise Vehicle Booking, Dispatch Coordination & Fleet Telematics Platform for Capital Real Estate**  
> Operational Headquarters: Addis Ababa, Ethiopia (`Africa/Addis_Ababa`, UTC+3)  
> Architectural Paradigm: **Feature-First Modular Architecture**

---

## 🏛️ Feature-First Modular Architecture

Capital Fleet is organized around its **13 core business capabilities** rather than isolated technical silos. Evaluators and engineers can immediately locate the frontend implementation, backend API, business logic, database models, and automated tests for any feature:

| # | Business Domain Module | What it does | Key Entities | Portal Link |
| :-: | :--- | :--- | :--- | :--- |
| **01** | **Authentication & Security** | JWT stateless auth, Passport strategy, RBAC authorization, password resets. | `User`, `PasswordResetToken` | [`modules/01-authentication-security/`](./modules/01-authentication-security/) |
| **02** | **Employee & Departments** | Staff directory, department organization, self-service profile settings. | `User`, `Department` | [`modules/02-employee-department-management/`](./modules/02-employee-department-management/) |
| **03** | **Booking Lifecycle** | Transport bookings (daily & weekly), notice validation, timeline tracking. | `Booking`, `BookingDay` | [`modules/03-booking-management/`](./modules/03-booking-management/) |
| **04** | **Vehicle Fleet Inventory** | Asset management, plate numbers, categories, seating capacity, readiness. | `Vehicle` | [`modules/04-vehicle-management/`](./modules/04-vehicle-management/) |
| **05** | **Driver Portal & Roster** | Certified chauffeurs, license tracking, trip acceptance/decline, mobile portal. | `User` (DRIVER), `VehicleAssignment` | [`modules/05-driver-management/`](./modules/05-driver-management/) |
| **06** | **Dispatch & Assignment** | Review queue, intelligent vehicle & chauffeur allocation algorithms. | `VehicleAssignment`, `Booking` | [`modules/06-assignment-dispatch/`](./modules/06-assignment-dispatch/) |
| **07** | **Trip Execution** | Departure odometer, live route telematics, delay reporting, completion delta. | `Booking` (Odometers) | [`modules/07-trip-execution/`](./modules/07-trip-execution/) |
| **08** | **Digital Receipts & QR** | Cryptographic transport vouchers, printable gate passes, public QR audit. | `Booking` (`verificationToken`) | [`modules/08-digital-receipts-verification/`](./modules/08-digital-receipts-verification/) |
| **09** | **Maintenance & Issues** | Workshop servicing scheduler, service costs, defect reporting with photos. | `VehicleMaintenance`, `VehicleIssue` | [`modules/09-maintenance-issues/`](./modules/09-maintenance-issues/) |
| **10** | **Fuel Management** | Driver refueling logs, fuel station receipts, cost per liter, fuel economy. | `FuelRecord` | [`modules/10-fuel-management/`](./modules/10-fuel-management/) |
| **11** | **Notification System** | Event-driven in-app alerts for booking approvals, rejections, and assignments. | `Notification` | [`modules/11-notification-system/`](./modules/11-notification-system/) |
| **12** | **Audit & Analytics** | Immutable change logs, CSV report downloads, executive analytics charts. | `AuditLog` | [`modules/12-audit-reporting-analytics/`](./modules/12-audit-reporting-analytics/) |
| **13** | **System Settings** | Dynamic business policies (notice hours, auto-approvals, data purge). | `SystemSetting` | [`modules/13-system-settings-policies/`](./modules/13-system-settings-policies/) |

---

## 📚 Technical Documentation Suite

The project includes an 8-part documentation suite designed for software evaluators and academic assessors:

1. 🏛️ [`PROJECT_ARCHITECTURE.md`](./docs/PROJECT_ARCHITECTURE.md): High-level system design, monorepo layout, and architectural decisions.
2. 🗺️ [`MODULE_DIRECTORY_GUIDE.md`](./docs/MODULE_DIRECTORY_GUIDE.md): Exact file locations mapping every module to frontend, backend, database, and tests.
3. ⚛️ [`FRONTEND_DOCUMENTATION.md`](./docs/FRONTEND_DOCUMENTATION.md): React 18, Vite 5, Tailwind CSS, component hierarchy, and state lifecycle.
4. ⚙️ [`BACKEND_DOCUMENTATION.md`](./docs/BACKEND_DOCUMENTATION.md): NestJS architecture, controllers, services, DTOs, guards, and filters.
5. 🗄️ [`DATABASE_DOCUMENTATION.md`](./docs/DATABASE_DOCUMENTATION.md): PostgreSQL 16 schema, Prisma ORM, ER diagrams, foreign keys, and indexes.
6. 📖 [`TECHNICAL_GLOSSARY.md`](./docs/TECHNICAL_GLOSSARY.md): Definitions and practical codebase examples of 30+ engineering terms.
7. 🔄 [`PROJECT_EXECUTION_FLOW.md`](./docs/PROJECT_EXECUTION_FLOW.md): Step-by-step sequence diagrams and narrative walkthroughs of request lifecycles.
8. 🎓 [`EVALUATOR_PRESENTATION_GUIDE.md`](./docs/EVALUATOR_PRESENTATION_GUIDE.md): University evaluation preparation guide, demo script, and oral defense Q&A.

---

## ⚡ Technology Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, Lucide Icons, Canvas QR Code.
- **Backend:** NestJS 10, Node.js v20+, Passport JWT, class-validator, Swagger OpenAPI (`/api/docs`).
- **Database:** PostgreSQL 16 (Alpine Docker container), Prisma ORM 5.11.0.
- **Testing:** Jest with ts-jest (7 test suites, 72 unit tests passing).

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **Docker**: For local PostgreSQL container

### 2. Environment Setup
```bash
cp .env.example .env
```

Ensure your `.env` contains:
```env
PORT=4100
DATABASE_URL="postgresql://postgres:postgres@localhost:5435/capital_fleet_db?schema=public"
JWT_SECRET="capital_fleet_jwt_super_secret_enterprise_key_2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:5173"
TZ="Africa/Addis_Ababa"
```

### 3. Start Database & Development Environment
The automated startup script starts Docker, runs Prisma migrations, seeds mock data, compiles the backend, and launches Vite:
```bash
bash start.sh
```
Or start manually:
```bash
docker compose up -d postgres
npm run prisma:generate --workspace=apps/api
npm run prisma:push --workspace=apps/api
npm run prisma:seed --workspace=apps/api
npm run dev
```

- **Frontend Web Application:** [`http://localhost:5173`](http://localhost:5173)
- **Backend REST API:** [`http://localhost:4100/api`](http://localhost:4100/api)
- **Interactive Swagger Documentation:** [`http://localhost:4100/api/docs`](http://localhost:4100/api/docs)

---

## 👥 Seeded Demonstration Accounts

All accounts share the secure default password: **`CapitalFleet2026!`**

| Role | Name | Email | Permissions |
| :--- | :--- | :--- | :--- |
| **System Admin** | Dawit Tadesse | `admin@capitalre.com` | Full administrative control, user & department CRUD, audit logs. |
| **Logistics Admin** | Almaz Bekele | `logistics@capitalre.com` | Booking review queue, vehicle assignment, fleet maintenance. |
| **Driver (Chauffeur)** | Kassahun Desta | `driver@capitalre.com` | Driver dashboard, dispatch confirm/decline, trip execution, fuel logs. |
| **Employee** | Abebe Girma | `employee@capitalre.com` | Submit transport requests, view availability, cancel pending bookings. |

---

## 🧪 Testing & Verification Commands

```bash
# Static TypeScript typecheck across apps/api and apps/web (0 errors)
npm run typecheck

# Execute backend Jest unit test suites (7 suites, 72 tests)
npm run test:api

# Full production build verification
npm run build
```
