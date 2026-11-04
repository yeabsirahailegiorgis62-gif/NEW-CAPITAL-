# Capital Fleet — Backend Documentation

## 1. Technology stack

| Technology | Role |
| --- | --- |
| NestJS 10 | HTTP framework (modules, DI, controllers) |
| Express (via `@nestjs/platform-express`) | Underlying HTTP server |
| Prisma 5 | ORM to PostgreSQL |
| Passport + passport-jwt | JWT authentication strategy |
| `@nestjs/jwt` | Sign/verify tokens |
| bcrypt | Password hashing (`AuthService`, `UsersService`) |
| class-validator / class-transformer | DTO validation |
| `@nestjs/swagger` | OpenAPI at `/api/docs` |
| nodemailer | Password-reset email (`MailService`) |
| Jest | Unit tests (`*.spec.ts`) |

Entry: `apps/api/src/main.ts` → `NestFactory.create(AppModule)` → listen `process.env.PORT || 4100`.

## 2. Bootstrap (`main.ts`)

1. Load `.env` (`dotenv/config`).
2. Global prefix `api`.
3. JSON body limit 10mb (photos/avatars).
4. Security header middleware: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`.
5. `AllExceptionsFilter` globally.
6. `ValidationPipe` (`whitelist`, `transform`).
7. CORS for `localhost:5173`, `127.0.0.1:5173`, `localhost:3000` with `credentials: true`.
8. Swagger `DocumentBuilder` + Bearer auth.

## 3. Module map (`AppModule`)

Imported in `apps/api/src/app.module.ts`:

`PrismaModule`, `AuthModule`, `UsersModule`, `DepartmentsModule`, `VehiclesModule`, `BookingsModule`, `IssuesModule`, `NotificationsModule`, `AuditModule`, `HealthModule`, `SettingsModule`, `MaintenanceModule`, `FuelModule`.

`MailModule` is imported by `AuthModule` (not listed directly in `AppModule`).

Pattern for a feature:

```
modules/<name>/
  <name>.module.ts
  <name>.controller.ts
  <name>.service.ts
  <name>.dto.ts          (most modules)
  <name>.service.spec.ts (auth, bookings, settings)
```

## 4. Cross-cutting building blocks

| File | Concept | Behaviour |
| --- | --- | --- |
| `common/guards/jwt-auth.guard.ts` | Guard | JWT required unless `@Public()` |
| `common/guards/roles.guard.ts` | Guard | `@Roles(...)`; `SYSTEM_ADMIN` always passes |
| `modules/auth/jwt.strategy.ts` | JWT | Bearer token → load `User` by `sub` |
| `common/decorators/public.decorator.ts` | Metadata | Skip auth |
| `common/decorators/roles.decorator.ts` | Metadata | Required `UserRole[]` |
| `common/decorators/current-user.decorator.ts` | Param | Injects `request.user` |
| `common/filters/http-exception.filter.ts` | Exception handling | Uniform JSON errors |
| `prisma/prisma.service.ts` | ORM | Connect/disconnect Prisma Client |

**Dependency injection:** constructors receive `PrismaService`, `JwtService`, `MailService`, etc. Nest instantiates them from module `providers`.

## 5. Authentication (`AuthModule`)

**Controller:** `AuthController` (`/api/auth`)

| Method | Path | Auth | Service method |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | `login` |
| POST | `/auth/forgot-password` | Public | `forgotPassword` |
| POST | `/auth/reset-password` | Public | `resetPassword` |
| POST | `/auth/change-password` | JWT | `changePassword` |
| GET | `/auth/me` | JWT | returns `CurrentUser` |
| POST | `/auth/logout` | — | returns message; client drops token |
| GET | `/auth/admin/reset-requests` | SYSTEM_ADMIN | `getResetRequests` |
| POST | `/auth/admin/reset-requests/:id/approve` | SYSTEM_ADMIN | `approveResetRequest` |
| POST | `/auth/admin/reset-requests/:id/resend` | SYSTEM_ADMIN | `resendResetPassphrase` |
| POST | `/auth/admin/reset-requests/:id/reject` | SYSTEM_ADMIN | `rejectResetRequest` |
| POST | `/auth/admin/reset-password/:userId` | SYSTEM_ADMIN | `adminInitiatePasswordReset` |

**Login business logic (`AuthService.validateUser` / `login`)**

- Identifier matches `email` or `employeeId` (case-insensitive).
- Inactive users rejected.
- `lockedUntil` lockout after 5 failed bcrypt compares (15 minutes).
- Success resets `failedLoginAttempts`.
- JWT payload `sub` = `user.id`.

**Password reset (Capital Fleet specific)**

This is **not** a self-service email-link reset. Flow:

1. User `forgotPassword` → `PasswordResetRequest` status `PENDING`; admins get in-app `Notification`.
2. Admin `approveResetRequest` generates passphrase `CPTL-XXXX-XXXX`, stores **SHA-256 hash** in `PasswordResetToken.token` and `passphraseHash`, emails the raw passphrase via `MailService`.
3. User `resetPassword` hashes the passphrase, looks up the token, bcrypt-hashes the new password.

DTOs: `auth.dto.ts` (`LoginDto`, `ForgotPasswordDto`, …).

## 6. Bookings (`BookingsModule`) — core domain

**Controller:** `BookingsController` (`/api/bookings`), class-level `JwtAuthGuard` + `RolesGuard`.

Public:

- `GET /bookings/verify/:reference`
- `GET /bookings/verify-token/:token`

Authenticated lifecycle (see `PROJECT_EXECUTION_FLOW.md` for the story):

| HTTP | Path | Roles | Service |
| --- | --- | --- | --- |
| POST | `/bookings` | any logged-in | `create` |
| POST | `/bookings/check-duplicate` | any | `checkDuplicate` |
| GET | `/bookings` | scoped by role | `findAll` |
| GET | `/bookings/stats` | LOGISTICS + SYSTEM | `getDashboardStats` |
| GET | `/bookings/:id` | scoped | `findOne` |
| POST/PATCH | `/bookings/:id/cancel` | owner or staff | `cancel` |
| POST | `/bookings/:id/approve` | LOGISTICS + SYSTEM | `approve` |
| POST | `/bookings/:id/reject` | LOGISTICS + SYSTEM | `reject` |
| POST | `/bookings/:id/assign` | LOGISTICS + SYSTEM | `assignVehicle` |
| POST | `/bookings/:id/auto-assign` | LOGISTICS + SYSTEM | `autoAssign` |
| POST | `/bookings/:id/confirm-assignment` and `/bookings/assignments/:id/confirm` | DRIVER + admins | `confirmAssignment` |
| POST | decline aliases | DRIVER + admins | `declineAssignment` |
| POST | `/bookings/:id/start` and `/start-trip` | DRIVER + admins | `startTrip` |
| POST | `/bookings/:id/mark-arrival` | DRIVER + admins | `markArrival` |
| POST | `/bookings/:id/report-delay` | DRIVER + admins | `reportDelay` |
| POST | `/bookings/:id/complete` and `/complete-trip` | DRIVER + admins | `completeTrip` |
| PATCH | `/bookings/days/:dayId` | LOGISTICS + SYSTEM | `updateBookingDay` |

**`create` policy (reads `SystemSetting`):** minimum notice hours, same-day, weekend, max passenger capacity. Generates `bookingReference` like `CR-2026-0042` and `verificationToken` UUID. Status starts `PENDING_APPROVAL`. Notifies logistics/system admins. Writes `AuditLog` action `SUBMIT_REQUEST`.

**`findAll` scoping:** employees see `requesterId = self`; drivers see assignments / booking days for themselves; logistics/admin see all.

**`assignVehicle`:** Prisma transaction, `SELECT … FOR UPDATE` on vehicle (and driver), requires status `APPROVED` or `ASSIGNED`, vehicle `ACTIVE`, overlap checks via helpers exported from `vehicles.service.ts` (`intervalsOverlap`, `doesAssignmentConflict`, `doesBookingDayConflict`). Creates `VehicleAssignment`, sets booking `ASSIGNED`.

**`completeTrip`:** requires `IN_PROGRESS`; sets `COMPLETED`; sets `unassignedAt` on assignments; may bump `Vehicle.mileage`; can create a `VehicleIssue` if `reportedProblem` is sent.

DTOs: `bookings.dto.ts`.

## 7. Vehicles (`VehiclesModule`)

`VehiclesController` (`/api/vehicles`):

- `GET /` list (search/category/status)
- `GET /availability` interval availability
- `GET /recommendations` and `GET /recommendations/:bookingId`
- `GET /drivers/recommendations` and `GET /driver-recommendations/:bookingId`
- `GET /:id`
- `POST /` `PATCH /:id` — LOGISTICS + SYSTEM

`getSlotInterval` maps weekly `MORNING` (08:00–12:30) and `AFTERNOON` (13:00–18:00) for conflict detection.

## 8. Other HTTP modules

**Users** (`/api/users`): `GET/PATCH profile/me`; list (logistics+admin); create/update (SYSTEM_ADMIN). Passwords hashed with bcrypt; `passwordHash` stripped from responses.

**Departments** (`/api/departments`): list all authenticated; mutate SYSTEM_ADMIN. Delete blocked if users remain (`DepartmentsService.remove`).

**Issues** (`/api/vehicle-issues`): report (any auth user); patch status LOGISTICS+SYSTEM.

**Maintenance** (`/api/maintenance`): logistics+admin CRUD + `GET /overview`.

**Fuel** (`/api/fuel`): list/stats logistics+admin; `POST` also DRIVER (defaults `driverId` to self).

**Notifications** (`/api/notifications`): current user’s inbox; mark read / read-all.

**Audit** (`/api/audit-logs`): LOGISTICS + SYSTEM, query by `entityType` / `entityId`.

**Settings** (`/api/settings`): GET all; PATCH SYSTEM_ADMIN; `POST /settings/danger/purge-operations` re-auth with admin password + confirmation phrase.

**Health** (`GET /api/health`): `SELECT 1` via Prisma; used by `start.sh`.

## 9. REST conventions in this codebase

- Resource URLs under `/api/...`
- JSON bodies; DTOs + `ValidationPipe`
- Mutations that change booking state are mostly **POST** (`/approve`, `/assign`) rather than PATCH of a generic status field — this makes each transition an explicit use case.
- Some **aliases** exist (`/start` and `/start-trip`) so older frontend calls still work.

## 10. Error handling

Services throw Nest HTTP exceptions (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`). `AllExceptionsFilter` maps them to:

```json
{
  "statusCode": 400,
  "timestamp": "...",
  "path": "/api/bookings",
  "method": "POST",
  "error": "Bad Request",
  "message": "Departure time cannot be in the past"
}
```

`ApiClient` surfaces `message` to toasts.

## 11. Tests

Jest config is in `apps/api/package.json`. Specs:

- `auth.service.spec.ts`
- `bookings.service.spec.ts`
- `settings.service.spec.ts`

Root `npm run test:api` runs workspace tests. Additional ad-hoc scripts exist at repo root (`verify_e2e_workflow.js`, `test_logistics_workflow.js`, …) and are not the Jest suite.

## 12. Examiner talking points

- “Controllers do not contain SQL; `BookingsService` owns status transitions.”
- “Guards run before the handler: JWT then roles.”
- “Assignment is concurrency-safe with a transaction and row locks.”
- “Password reset is admin-mediated; the database stores hashes only.”
