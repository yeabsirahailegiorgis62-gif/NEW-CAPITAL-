# Capital Fleet — Vehicle Booking & Logistics Management System

> **Enterprise Vehicle Booking and Fleet Coordination System for Capital Real Estate**  
> Operational Headquarters: Addis Ababa, Ethiopia (`Africa/Addis_Ababa`, UTC+3)

---

## 🏢 Executive Overview

**Capital Fleet** is an internal enterprise web application tailored for **Capital Real Estate** to streamline vehicle reservation workflows, eliminate administrative bottlenecks, prevent fleet scheduling conflicts, and track vehicle telemetry and maintenance in real time.

Built with a modular TypeScript architecture, strict role-based access control (RBAC), and transactional database concurrency guarantees, Capital Fleet connects company employees with the Logistics Department to ensure optimal corporate transport coordination.

---

## ⚡ Key Highlights & Core Capabilities

1. **Guided Employee Booking Workflow**:
   - 3-step structured booking request (Trip Overview, Scheduling & Capacity, Vehicle Preferences).
   - Validation against past dates and working duration.
   - Automated request tracking with status badges (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).

2. **Logistics Review & Approval Engine**:
   - Centralized review queue for pending transport requests.
   - Instant approval or mandatory rejection justification.
   - Direct link to real-time fleet availability for conflict-free vehicle assignment.

3. **Fleet Availability Calendar**:
   - Visual timeline matrix displaying vehicle availability across days and hours.
   - Half-open interval conflict prevention formula: `[departureAt, expectedReturnAt)`:
     $$\text{Conflict} \iff \text{Start}_A < \text{End}_B \land \text{End}_A > \text{Start}_B$$
   - Color-coded status bands with passenger capacity and driver requirement indicators.

4. **Atomic Vehicle Assignment & Concurrency Safety**:
   - Concurrency-safe database transactions preventing double-booking race conditions.
   - Strict operational verification ensuring assigned vehicles are `ACTIVE` and meet passenger headcount.
   - Driver assignment tracking (`COMPANY_DRIVER` or authorized `SELF_DRIVE`).

5. **Trip Execution & Telemetry Logging**:
   - **Departure Dispatch**: Records actual departure timestamp and starting odometer.
   - **Return Check-in**: Records return timestamp, ending odometer, total distance traveled, and fuel/condition notes.
   - **Odometer Progression Enforcement**: Ensures ending mileage is greater than or equal to starting mileage.

6. **Automated Defect & Maintenance Management**:
   - Return defects automatically generate `OPEN` vehicle issue tickets.
   - Vehicles under `MAINTENANCE` status cannot be assigned to new trips.
   - Proactive warnings on pending bookings if an assigned vehicle is scheduled for maintenance.

7. **Role-Based Access Control (RBAC) & Governance**:
   - 3 clearly delineated roles:
     - **Employee** (`EMPLOYEE`): Create/view bookings, cancel pending/approved trips, in-app notifications.
     - **Logistics Admin** (`LOGISTICS_ADMIN`): Review queue, calendar, vehicle assignment, trip dispatch/return, maintenance.
     - **System Admin** (`SYSTEM_ADMIN`): User management, vehicle master catalog, immutable audit trail.
   - Audit trail automatically records actor ID, target entity, timestamp, and metadata diffs for all critical actions.

---

## 🏗️ Architecture & Technology Stack

```
capital-fleet/
├── apps/
│   ├── api/                    # NestJS modular backend API
│   │   ├── src/
│   │   │   ├── modules/        # Domain modules (Auth, Bookings, Vehicles, Issues, etc.)
│   │   │   ├── common/         # Guards, Decorators, Filters, Interceptors
│   │   │   └── main.ts         # Server bootstrap & OpenAPI/Swagger documentation
│   │   └── test/               # Unit and integration test suites
│   └── web/                    # React 18 + Vite frontend
│       ├── src/
│       │   ├── components/ui/  # Reusable enterprise design system primitives
│       │   ├── features/       # Feature views (dashboard, bookings, calendar, admin)
│       │   ├── lib/            # Typed API client, session management, formatters
│       │   └── App.tsx         # Routing and global application shell
└── prisma/
    ├── schema.prisma           # Relational schema (8 models, enums, indices)
    └── seed.ts                 # Database seeder with realistic test fixtures
```

### Backend & Database
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: [NestJS 10](https://nestjs.com/) (Modular, Dependency Injection, Validation Pipes)
- **ORM**: [Prisma 5](https://www.prisma.io/)
- **Database**: PostgreSQL 16
- **Security**: Argon2/bcrypt password hashing, JWT stateless authentication, RBAC `RolesGuard`
- **Documentation**: Swagger / OpenAPI 3.0 at `/api/docs`

### Frontend & UI System
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with custom corporate design tokens (Navy `#0A192F`, Amber `#D97706`, Slate `#475569`)
- **Icons**: Lucide Icons
- **Accessibility**: ARIA labels, semantic markup, high-contrast badges, keyboard navigable modals

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker & Docker Compose**: For local PostgreSQL container

### 2. Environment Setup
Copy the environment example file:
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

### 3. Start Database
```bash
docker compose up -d
```
*(PostgreSQL container runs on port `5435` with database `capital_fleet_db`)*

### 4. Run Migrations & Seed Data
```bash
npx prisma db push
npx prisma db seed
```

### 5. Start Development Servers
In two separate terminals:

**Backend API (Port 4100):**
```bash
npm run start:dev --workspace=apps/api
```

**Frontend Web (Port 5173):**
```bash
npm run dev --workspace=apps/web
```

Access the application in your browser at:  
👉 **`http://localhost:5173`**

Interactive Swagger API Documentation:  
👉 **`http://localhost:4100/api/docs`**

---

## 👥 Seeded Demonstration Accounts

All accounts share the secure default password: **`CapitalFleet2026!`**

| Role | Name | Email / Login | Department | Employee ID |
| :--- | :--- | :--- | :--- | :--- |
| **System Admin** | Dawit Tadesse | `admin@capitalre.com` | Executive / IT | `SYS-001` |
| **Logistics Admin** | Almaz Bekele | `logistics@capitalre.com` | Logistics & Fleet | `LOG-201` |
| **Employee** | Abebe Girma | `employee@capitalre.com` | Sales & Marketing | `EMP-101` |

---

## 🧪 Testing & Verification

### Unit Tests
Run backend Jest unit tests:
```bash
npm test --workspace=apps/api
```

### Production Build Verification
Verify type safety and production asset compilation:
```bash
npm run build --workspace=apps/web
npm run build --workspace=apps/api
```

### End-to-End Workflow Verification
The test suite validates:
1. Employee login & JWT token issuance.
2. Trip request creation with validation.
3. Logistics Admin approval.
4. Fleet availability matrix check.
5. Concurrency-safe atomic vehicle assignment.
6. Rejection of overlapping conflicting assignments.
7. Trip dispatch (odometer logging) & completion.
8. Automatic vehicle defect ticket generation and audit trail verification.

---

## 📄 License
Proprietary & Confidential — Internal Software for **Capital Real Estate**, Addis Ababa, Ethiopia.
