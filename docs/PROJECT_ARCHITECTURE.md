# Capital Fleet — Comprehensive Project Architecture

**System Name:** Capital Fleet Management System  
**Client Organization:** Capital Real Estate  
**Architecture Style:** Feature-First Modular Business Portals over Monorepo Workspace  
**Document Version:** 2.0  

---

## 1. System Overview & Business Context

Capital Fleet is an enterprise-grade vehicle allocation, chauffeur dispatch, booking lifecycle, and fleet telematics platform designed for Capital Real Estate. It streamlines operational transport logistics: staff request vehicles, logistics officers review and assign cars and drivers, certified chauffeurs execute trips with live odometer tracking, and system administrators manage accounts, departments, and fleet policies.

The system is architected as a **client–server web platform**:
1. **Frontend:** React 18 Single-Page Application (SPA) bundled with Vite 5.
2. **Backend:** NestJS 10 RESTful API running on Node.js (Express engine).
3. **Database:** PostgreSQL 16 relational database accessed through Prisma ORM.

---

## 2. Monorepo & Feature-First Dual Architecture

To reconcile the need for an intuitive, business-oriented directory layout with the build constraints of modern web bundlers and Node.js compilers, Capital Fleet employs a **Dual-Layer Feature-First Architecture**:

```
Capital Fleet/
├── modules/                         # 13 BUSINESS DOMAIN PORTALS (EVALUATOR ENTRY)
│   ├── 01-authentication-security/
│   │   ├── README.md                # Architectural spec & evaluator Q&A
│   │   ├── frontend/                # Symlink -> apps/web/src/features/auth/
│   │   ├── backend/                 # Symlink -> apps/api/src/modules/auth/
│   │   ├── database/                # Schema definitions & relationships
│   │   └── tests/                   # Automated unit test specs
│   ├── 02-employee-department-management/
│   ├── 03-booking-management/
│   ├── 04-vehicle-management/
│   ├── 05-driver-management/
│   ├── 06-assignment-dispatch/
│   ├── 07-trip-execution/
│   ├── 08-digital-receipts-verification/
│   ├── 09-maintenance-issues/
│   ├── 10-fuel-management/
│   ├── 11-notification-system/
│   ├── 12-audit-reporting-analytics/
│   └── 13-system-settings-policies/
├── apps/                            # PHYSICAL APPLICATION RUNTIMES (PRESERVED)
│   ├── api/                         # NestJS REST API (:4100)
│   └── web/                         # React + Vite SPA (:5173)
├── prisma/                          # POSTGRESQL DATA ARCHITECTURE
│   ├── schema.prisma                # Relational schema (single source of truth)
│   └── seed.ts                      # Realistic enterprise database seeder
├── docs/                            # EVALUATION & TECHNICAL DOCUMENTATION SUITE
│   ├── PROJECT_ARCHITECTURE.md
│   ├── MODULE_DIRECTORY_GUIDE.md
│   ├── FRONTEND_DOCUMENTATION.md
│   ├── BACKEND_DOCUMENTATION.md
│   ├── DATABASE_DOCUMENTATION.md
│   ├── TECHNICAL_GLOSSARY.md
│   ├── PROJECT_EXECUTION_FLOW.md
│   └── EVALUATOR_PRESENTATION_GUIDE.md
├── package.json                     # Monorepo workspaces & centralized scripts
└── docker-compose.yml               # PostgreSQL 16 container definition
```

### Why Application Boundaries are Preserved:
1. **NestJS (`apps/api`)** compiles via `tsc -p tsconfig.build.json` targeting Node.js CommonJS/ES2021. Placing frontend React/JSX files inside the Nest compilation root causes TypeScript compile failures.
2. **Vite (`apps/web`)** compiles browser ESM bundles. Backend packages (`@nestjs/common`, `bcrypt`, `prisma`, `fs`) cannot be bundled into client browsers.
3. **Prisma 5 (`prisma/schema.prisma`)** requires a single canonical schema to resolve cross-entity foreign keys and generate client types.

---

## 3. Technology Stack Summary

| Layer | Technology | Version | Purpose in Capital Fleet |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 18.2.0 | Reactive component rendering and DOM reconciliation |
| **Frontend Tooling** | Vite | 5.4.21 | Hot module replacement (HMR), production bundling, API proxy |
| **Styling & Theme** | Tailwind CSS | 3.4.1 | Utility-first responsive design, dark/light theme switching |
| **Icons & UI** | Lucide React | 0.344.0 | Automotive and navigation SVG icon set |
| **Backend Framework** | NestJS | 10.3.3 | Enterprise dependency injection, routing, validation, guards |
| **Language Runtime** | Node.js | v20+ | Server-side JavaScript/TypeScript execution environment |
| **ORM & Data Client** | Prisma ORM | 5.11.0 | Type-safe SQL generation, schema migrations, seeder |
| **Database** | PostgreSQL | 16-alpine | ACID-compliant relational data persistence in Docker container |
| **Authentication** | Passport & JWT | 10.2.0 | Stateless Bearer token issuance and signature verification |
| **Password Security** | bcrypt | 5.1.1 | Salted cryptographic password hashing (cost factor 10) |
| **Validation** | class-validator | 0.14.1 | Decorator-based input validation and payload sanitization |
| **Testing Engine** | Jest & ts-jest | 29.7.0 | Automated unit test runner with mock providers (72 tests) |

---

## 4. Network & Process Topology

```
[ Web Browser ]
      │
      │  HTTP Requests (/api/...)
      ▼
[ Vite Dev Proxy / Port 5173 ]
      │
      │  Proxy forwarding
      ▼
[ NestJS API Server / Port 4100 ]
      │
      │  Prisma TCP Connection (Host Port 5435 → Container 5432)
      ▼
[ PostgreSQL 16 Container ] (Database: capital_fleet_db)
```

- In development, `ApiClient` calls `/api/...`. Vite proxies this directly to `http://localhost:4100`.
- NestJS prefixes all routes with `api` via `app.setGlobalPrefix('api')`.
- Swagger OpenAPI interactive API explorer is automatically generated at `http://localhost:4100/api/docs`.

---

## 5. Security & Architectural Decisions

1. **Stateless JWT Authentication:**
   No session state is stored in memory or in a server session table. Requests carry `Authorization: Bearer <token>`. The server mathematically verifies the signature using `JWT_SECRET`.
2. **Defensive Input Validation:**
   NestJS `ValidationPipe` with `whitelist: true` automatically rejects or strips unknown properties, preventing mass-assignment security vulnerabilities.
3. **Auditability by Design:**
   Mutations across the system (booking creation, approvals, rejections, vehicle assignments, and trip completions) automatically write structured event rows to `AuditLog`.
4. **Resilient Error Filtering:**
   `AllExceptionsFilter` catches uncaught database or server errors and maps them to clean JSON responses (`{ statusCode, message, timestamp, path }`), hiding sensitive PostgreSQL internals from clients.

