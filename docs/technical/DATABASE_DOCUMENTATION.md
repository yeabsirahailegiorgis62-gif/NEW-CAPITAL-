# Capital Fleet — Database Documentation

## 1. Database and ORM

- **Database:** PostgreSQL 16 (Docker image `postgres:16-alpine`, service `postgres` in `docker-compose.yml`).
- **Database name:** `capital_fleet_db` (default).
- **Host port:** `5435` → container `5432`.
- **ORM:** Prisma. Schema file: `prisma/schema.prisma`.
- **Client:** `@prisma/client` used as `PrismaService` in NestJS.
- **Timezone:** container `TZ=Africa/Addis_Ababa`.

Prisma **models** are the entities; `@@map("table_name")` is the physical **table**.

There is **no `prisma/migrations` folder** in the repository. Schema is applied with:

- `npm run prisma:migrate --workspace=apps/api` (Prisma Migrate)
- `npm run prisma:push --workspace=apps/api` (push schema without migration history)

Seed: `prisma/seed.ts` (bcrypt-hashed demo users, departments, vehicles).

Connection: environment variable `DATABASE_URL` (see `.env.example`).

## 2. Enumerations (constrained columns)

| Enum | Values | Used on |
| --- | --- | --- |
| `UserRole` | EMPLOYEE, DRIVER, LOGISTICS_ADMIN, SYSTEM_ADMIN | `User.role` |
| `VehicleCategory` | SEDAN, SUV, PICKUP, MINIBUS, OTHER | `Vehicle.category` |
| `VehicleOperationalStatus` | ACTIVE, MAINTENANCE, OUT_OF_SERVICE, INACTIVE | `Vehicle.operationalStatus` |
| `BookingStatus` | PENDING_APPROVAL, APPROVED, REJECTED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED | `Booking.status`, `BookingDay.status` |
| `IssueSeverity` | LOW, MEDIUM, HIGH, CRITICAL | `VehicleIssue.severity` |
| `IssueStatus` | OPEN, IN_REVIEW, RESOLVED | `VehicleIssue.status` |
| `PasswordResetRequestStatus` | PENDING, APPROVED, REJECTED, COMPLETED, EXPIRED, FAILED | `PasswordResetRequest.status` |
| `EmailDeliveryStatus` | PENDING, SENT, FAILED | `PasswordResetRequest.emailDeliveryStatus` |

Some statuses are **strings** in the schema, not enums: `VehicleAssignment.status` (`PENDING_CONFIRMATION` \| `CONFIRMED` \| `DECLINED`), `VehicleMaintenance.status`, fuel-related free text fields, `Booking.priority`, `Booking.requestType`.

## 3. Tables / models

### 3.1 `departments` (`Department`)

| Column | Notes |
| --- | --- |
| `id` | UUID **primary key** |
| `code` | unique optional |
| `name` | unique |
| `headId` | **foreign key** → `users.id` (optional head) |
| `isActive` | default true |

**Relationships:** one department has many users (`DepartmentMembers`). Optional head (`DepartmentHead`).

### 3.2 `users` (`User`)

| Column | Notes |
| --- | --- |
| `id` | UUID PK |
| `employeeId` | unique, login identifier |
| `email` | unique, login identifier |
| `passwordHash` | bcrypt hash only |
| `role` | `UserRole` |
| `departmentId` | FK → `departments.id` |
| `mustChangePassword` | after admin reset |
| `failedLoginAttempts`, `lockedUntil` | lockout |
| `licenseNumber` | used for drivers |
| `isActive` | login blocked if false |

**Relationships (one user can participate in many ways):**

- requester of many `Booking`
- logistics officer on many `VehicleAssignment` (`AssignedByLogistics`)
- driver on many `VehicleAssignment` (`DriverAssignments`)
- driver on `BookingDay`, `FuelRecord`
- reporter of `VehicleIssue`
- recipient of `Notification`
- password reset tokens/requests

### 3.3 `vehicles` (`Vehicle`)

PK `id`. Unique `registrationNumber`. Operational fields: capacity, fuel, mileage, insurance/inspection/registration expiry, maintenance dates.

**Indexes:** `operationalStatus`, `registrationNumber`.

**Relationships:** assignments, booking days, issues, maintenances, fuel records, preferred-in-bookings.

Only `ACTIVE` vehicles can be assigned (`BookingsService.assignVehicle`).

### 3.4 `bookings` (`Booking`)

PK `id`. Unique `bookingReference` (human, e.g. `CR-2026-0042`). Unique `verificationToken` (UUID for QR).

Important columns:

- `requesterId` FK → `users.id`
- `preferredVehicleId` optional FK → `vehicles.id`
- `destination`, `purpose`, `departureAt`, `expectedReturnAt`
- `actualDepartureAt`, `actualReturnAt`, `arrivedAt`, odometers
- `requestType` DAILY \| WEEKLY
- `status` `BookingStatus`
- `rejectionReason`, `cancellationReason`, `delayReason`

**Indexes:** `status`, `requesterId`, `(departureAt, expectedReturnAt)`, `requestType`.

**Relationships:** requester (many bookings per employee), optional preferred vehicle, many assignments, many notifications, many booking days.

### 3.5 `vehicle_assignments` (`VehicleAssignment`)

Links a **booking**, a **vehicle**, the **logistics user who assigned**, and an optional **driver**.

| Column | Notes |
| --- | --- |
| `bookingId` | FK → bookings, `onDelete: Cascade` |
| `vehicleId` | FK → vehicles |
| `assignedById` | FK → users |
| `driverId` | optional FK → users |
| `unassignedAt` | null = currently allocated |
| `status` | PENDING_CONFIRMATION / CONFIRMED / DECLINED |

**Indexes:** `(vehicleId, assignedAt, unassignedAt)`, `driverId`, `bookingId`.

Double-booking is prevented in **application logic** by querying overlapping assignments where `unassignedAt` is null and booking status is `ASSIGNED` or `IN_PROGRESS`.

### 3.6 `booking_days` (`BookingDay`)

Child rows for **WEEKLY** requests. FK `bookingId` cascade delete. Optional `vehicleId`, `driverId` per day. `timeSlot` MORNING/AFTERNOON. Indexes on `bookingId`, `tripDate`.

### 3.7 `vehicle_issues` (`VehicleIssue`)

FK `vehicleId`, `reportedById`. Severity/status enums. Indexes on vehicle and status.

### 3.8 `vehicle_maintenances` (`VehicleMaintenance`)

FK `vehicleId` cascade. Workshop jobs (preventive, repair, …).

### 3.9 `fuel_records` (`FuelRecord`)

FK `vehicleId` cascade; optional `driverId`. Quantity (liters), unit price, total cost (Birr).

### 3.10 `notifications` (`Notification`)

FK `recipientId` cascade; optional `bookingId` SetNull. Index `(recipientId, readAt)` for unread queries.

### 3.11 `audit_logs` (`AuditLog`)

No FK constraint to users (stores `actorId` / `actorName` snapshots). JSON `previousValues` / `newValues`. Indexes `(entityType, entityId)`, `actorId`.

### 3.12 `system_settings` (`SystemSetting`)

Unique `key`, string `value` (JSON or primitive as string). Read by `BookingsService.create` and `AuthService.validatePasswordPolicy`.

### 3.13 Password reset

`password_reset_requests` — admin workflow; `passphraseHash` is SHA-256, never the passphrase.

`password_reset_tokens` — unique hashed token, `expiresAt`, `usedAt`, `failedAttempts`.

## 4. Relationship diagram (logical)

```
Department 1 ────── * User
User (requester) 1 ────── * Booking
Booking 1 ────── * VehicleAssignment
Vehicle 1 ────── * VehicleAssignment
User (driver) 0..1 ── * VehicleAssignment
User (logistics) 1 ── * VehicleAssignment
Booking 1 ────── * BookingDay
BookingDay * ── 0..1 Vehicle
BookingDay * ── 0..1 User (driver)
Vehicle 1 ────── * VehicleIssue / VehicleMaintenance / FuelRecord
User 1 ────── * Notification
Booking 0..1 ── * Notification
```

**One-to-many examples in this project**

- One `User` (employee) has many `Booking` rows (`RequesterBookings`).
- One `Booking` has many `VehicleAssignment` rows (reassignment history; current ones have `unassignedAt = null`).
- One `Vehicle` has many assignments over time.

There is no Prisma `implicit many-to-many` join table between User and Vehicle; the join entity is `VehicleAssignment`.

## 5. Constraints and integrity

- Unique: emails, employee IDs, registration numbers, booking references, verification tokens, department names.
- Cascade: deleting a booking removes its assignments and booking days.
- Passwords and reset passphrases: hashed (bcrypt / SHA-256).
- Business rules **not** fully expressed as SQL CHECK constraints (status machine, overlap) — they live in `BookingsService` / `VehiclesService`.

## 6. How the frontend types relate

`apps/web/src/types/index.ts` duplicates the JSON shape (TypeScript `interface Booking`, `User`, …). It is **not** generated from Prisma in this repo; keep them conceptually aligned when explaining the system.

## 7. Examiner talking points

- “Prisma models map 1:1 to Postgres tables via `@@map`.”
- “The booking workflow is a status enum plus child assignment rows.”
- “Weekly trips are `Booking` + many `BookingDay` rows.”
- “Overlap is detected in the service using assignment time windows, not a SQL exclusion constraint.”
