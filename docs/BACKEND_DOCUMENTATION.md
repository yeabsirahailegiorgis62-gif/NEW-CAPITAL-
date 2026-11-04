# Capital Fleet — Backend Architecture & Service Guide

**Target Application:** `apps/api` (@capital-fleet/api)  
**Framework:** NestJS 10 running on Node.js (Express engine)  
**Language:** TypeScript (target ES2021, CommonJS output in `dist/`)  
**Document Version:** 2.0  

---

## 1. NestJS Architecture Overview

The backend uses standard NestJS modular patterns:
- **Modules (`*.module.ts`):** Encapsulate closely related controllers, providers, and dependencies.
- **Controllers (`*.controller.ts`):** Handle HTTP requests, parse query/body inputs, apply guards, and return responses.
- **Services (`*.service.ts`):** Injectable providers executing business logic, validation algorithms, and Prisma database calls.
- **Data Transfer Objects (`*.dto.ts`):** Define input schemas validated with `class-validator`.
- **Guards (`*.guard.ts`):** Execute authorization checks before controller methods run.
- **Filters (`*.filter.ts`):** Intercept and format HTTP exceptions.

---

## 2. Directory Layout & Module Structure

```
apps/api/src/
├── main.ts                          # Bootstrap: Express limits, CORS, prefix /api, Swagger
├── app.module.ts                    # Root module registering all feature modules
├── prisma/
│   ├── prisma.module.ts             # Global PrismaModule
│   └── prisma.service.ts            # PrismaClient lifecycle (connect, enableShutdownHooks)
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts # Injects req.user from JWT payload
│   │   ├── public.decorator.ts      # Marks endpoints unauthenticated
│   │   └── roles.decorator.ts       # Specifies required UserRole permissions
│   ├── filters/
│   │   └── http-exception.filter.ts # AllExceptionsFilter converting errors to JSON
│   └── guards/
│       ├── jwt-auth.guard.ts        # Enforces valid Bearer JWT
│       └── roles.guard.ts           # Enforces RBAC permissions
└── modules/                         # 13 SYNCHRONIZED BACKEND DOMAIN MODULES
    ├── audit/                       # AuditModule, AuditController, AuditService
    ├── auth/                        # AuthModule, AuthController, AuthService, JwtStrategy, spec
    ├── bookings/                    # BookingsModule, BookingsController, BookingsService, spec
    ├── departments/                 # DepartmentsModule, DepartmentsController, DepartmentsService, spec
    ├── fuel/                        # FuelModule, FuelController, FuelService
    ├── health/                      # HealthModule, HealthController (liveness check)
    ├── issues/                      # IssuesModule, IssuesController, IssuesService
    ├── mail/                        # MailModule, MailService (Nodemailer SMTP integration)
    ├── maintenance/                 # MaintenanceModule, MaintenanceController, MaintenanceService, spec
    ├── notifications/               # NotificationsModule, NotificationsController, NotificationsService
    ├── settings/                    # SettingsModule, SettingsController, SettingsService, spec
    ├── users/                       # UsersModule, UsersController, UsersService, spec
    └── vehicles/                    # VehiclesModule, VehiclesController, VehiclesService, spec
```

---

## 3. Global Request Pipeline

Every incoming HTTP request undergoes the following lifecycle:

1. **Security Headers Middleware (`main.ts`):** Attaches `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`.
2. **Body Parsers (`main.ts`):** Express JSON & URL-encoded parsers with 10MB limits to accommodate vehicle incident photos.
3. **`AllExceptionsFilter` (`common/filters/http-exception.filter.ts`):** Global exception catcher formatting errors into:
   ```json
   {
     "statusCode": 400,
     "message": "Departure time must be at least 24 hours in advance.",
     "timestamp": "2026-11-04T19:30:00.000Z",
     "path": "/api/bookings"
   }
   ```
4. **`ValidationPipe` (`main.ts`):**
   - `whitelist: true`: Strips unknown properties.
   - `transform: true`: Automatically coerces primitives to DTO types.
5. **`JwtAuthGuard`:**
   - Checks if route has `@Public()` decorator. If so, skips authentication.
   - Otherwise, validates `Authorization: Bearer <token>` and attaches user payload.
6. **`RolesGuard`:**
   - Reads `@Roles(...)` metadata.
   - Compares user's `role` against required roles.

---

## 4. Key Business Logic Services

### `BookingsService` (`modules/bookings/bookings.service.ts`)
- **Finite State Machine:** Enforces valid state transitions:
  `PENDING_APPROVAL` $\rightarrow$ `APPROVED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`.
- **Notice Period Enforcement:** Queries dynamic setting `minimumNoticeHours` and rejects bookings failing the advance notice rule.
- **Cryptographic Token Issuance:** Generates unique `verificationToken` for gate QR validation.
- **Double-Booking Shield:** Coordinates with `VehiclesService` to prevent double allocations.

### `VehiclesService` (`modules/vehicles/vehicles.service.ts`)
- **Overlap Detection:** `doesAssignmentConflict()` checks mathematical interval intersections across regular and weekly slot bookings.
- **Smart Recommendations:** `getRecommendations()` ranks available vehicles by passenger capacity proximity and maintenance health.

### `SettingsService` (`modules/settings/settings.service.ts`)
- **In-Memory Policy Caching:** Stores operational parameters in an in-memory map to optimize read performance; invalidates cache immediately on PATCH.

---

## 5. Automated Unit Test Coverage (72 Tests)

The backend features 7 automated test suites executed via Jest (`npm run test:api`):
1. `auth.service.spec.ts`: Tests login validation, password hashing, and token issuance.
2. `bookings.service.spec.ts`: 14 tests covering booking submission, notice validation, status transitions, and cancellation guards.
3. `settings.service.spec.ts`: Tests policy caching and administrative purge protections.
4. `departments.service.spec.ts`: Tests department CRUD and active staff deletion guards.
5. `users.service.spec.ts`: Tests user onboarding, password stripping, and unique employee ID checks.
6. `vehicles.service.spec.ts`: Tests availability intervals and overlap detection algorithms.
7. `maintenance.service.spec.ts`: Tests workshop scheduling and audit log records.

