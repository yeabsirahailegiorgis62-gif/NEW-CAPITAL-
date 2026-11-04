# Capital Fleet — Evaluator Presentation & Oral Defense Guide

**Purpose:** Comprehensive academic defense preparation guide for university evaluators, academic reviewers, and technical assessors reviewing the **Capital Fleet Management System**.

---

## 1. Quick Navigation: Where is Key Functionality Located?

| Question: Where is... | Frontend Component | Backend Controller | Business Logic Service | Database Model |
| :--- | :--- | :--- | :--- | :--- |
| **Booking Creation & Form?** | `apps/web/src/features/bookings/BookingRequestForm.tsx` | `apps/api/src/modules/bookings/bookings.controller.ts` (`POST /api/bookings`) | `BookingsService.create()` in `bookings.service.ts` | `model Booking` in `prisma/schema.prisma` |
| **Double-Booking Overlap Guard?** | `AvailabilityCalendar.tsx` | `VehiclesController.getAvailability()` | `doesAssignmentConflict()` in `vehicles.service.ts` | `VehicleAssignment`, `BookingDay` |
| **Vehicle & Driver Assignment?** | `apps/web/src/features/logistics/AssignVehicleModal.tsx` | `BookingsController.assignVehicle()` | `BookingsService.assignVehicle()` | `VehicleAssignment` table |
| **Chauffeur Portal & Dispatch?** | `apps/web/src/features/dashboard/DriverDashboard.tsx` | `BookingsController.confirmAssignment()` | `BookingsService.confirmAssignment()` | `User` (`role: DRIVER`), `VehicleAssignment` |
| **Trip Odometer & Mileage Delta?** | `apps/web/src/features/logistics/TripExecutionModal.tsx` | `BookingsController.completeTrip()` | `BookingsService.completeTrip()` | `Booking.startOdometer`, `endOdometer` |
| **QR Code Gate Pass Verification?**| `apps/web/src/pages/PublicVerificationPage.tsx` | `BookingsController.verifyBookingToken()` | `BookingsService.verifyBookingToken()` | `Booking.verificationToken` |
| **Authentication & RBAC Guards?** | `apps/web/src/pages/LoginPage.tsx` | `apps/api/src/modules/auth/auth.controller.ts` | `AuthService.login()` | `model User`, `RolesGuard` |
| **Preventive Maintenance Schedules?**| `apps/web/src/features/maintenance/MaintenanceView.tsx` | `MaintenanceController.findAll()` | `MaintenanceService.getOverview()` | `VehicleMaintenance` table |
| **Immutable Audit Logging?** | `apps/web/src/features/admin/AuditLogsView.tsx` | `AuditController.findAll()` | `AuditService.log()` | `model AuditLog` |

---

## 2. Likely Evaluator Questions & Technically Accurate Answers

### Question 1: "Why did you choose a Feature-First Modular Architecture instead of a standard layered architecture?"
**Technically Accurate Answer:**
> *"A layered architecture organizes files strictly by technical roles (e.g. all controllers together, all views together). As an enterprise system expands to 13 distinct business capabilities, a layered structure causes high file fragmentation, making it difficult to understand the end-to-end implementation of a single feature.  
> We adopted a **Feature-First Modular Architecture** where each domain capability (such as Booking Management, Fleet Inventory, or Chauffeur Dispatch) is treated as a cohesive vertical slice. In our `modules/` portals, an evaluator can inspect the frontend React components, the backend NestJS service, the database schema excerpt, and the automated tests side-by-side. At the same time, we maintained the build boundaries of `apps/web` and `apps/api` to preserve Vite browser bundling and NestJS Node.js compilation without creating conflicting runtime dependencies."*

---

### Question 2: "How does the system mathematically prevent assigning a vehicle to two conflicting bookings?"
**Technically Accurate Answer:**
> *"In `VehiclesService.doesAssignmentConflict()`, the system applies interval intersection logic:  
> $$\text{Overlap} \iff (\text{start}_1 < \text{end}_2) \land (\text{end}_1 > \text{start}_2)$$  
> Furthermore, Capital Fleet supports both standard continuous trips and **weekly recurring day slots** (`BookingDay`). For slot-based bookings, the system maps `MORNING` (08:00–12:30) and `AFTERNOON` (13:00–18:00) into precise UTC timestamps via `getSlotInterval()`. A collision is only flagged if the specific time slots intersect, allowing a single vehicle to serve a morning survey trip and an afternoon logistics delivery on the same date."*

---

### Question 3: "How is security and authorization enforced across the application?"
**Technically Accurate Answer:**
> *"Security is implemented using a multi-tiered defense-in-depth model:
> 1. **Authentication:** Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256. Passwords are never stored in plaintext; they are salted and hashed using bcrypt (cost factor 10).
> 2. **Authorization:** Role-Based Access Control (RBAC) via NestJS `RolesGuard` and `@Roles(UserRole.X)`. Four distinct roles are enforced: `EMPLOYEE`, `DRIVER`, `LOGISTICS_ADMIN`, and `SYSTEM_ADMIN`.
> 3. **Input Validation:** Global `ValidationPipe` with `whitelist: true` strips unexpected payload properties and verifies types via `class-validator` DTOs.
> 4. **Exception Masking:** Global `AllExceptionsFilter` catches uncaught errors, preventing raw database stack traces or SQL syntax from leaking to client responses.
> 5. **Public Access:** Gate verification endpoints (`/api/bookings/verify/*`) are guarded with `@Public()` metadata, allowing security guards to verify QR code authenticity without accessing sensitive internal dashboards."*

---

### Question 4: "How does the database ensure referential integrity when related records are deleted?"
**Technically Accurate Answer:**
> *"We use PostgreSQL relational foreign keys defined in `prisma/schema.prisma`:
> - **Cascade Deletion:** Child records that have no independent meaning (such as `BookingDay` belonging to a weekly `Booking`, or `Notification` belonging to a `User`) use `onDelete: Cascade`. Deleting the parent booking automatically removes its day slots.
> - **Guarded Deletion:** When deleting a `Department`, `DepartmentsService.remove()` checks `_count.users`. If any active employee is assigned to the department, the delete operation is rejected with a `BadRequestException` to avoid orphaned user foreign keys.
> - **Set Null:** If a booking linked to a notification is deleted, the notification remains intact with `bookingId = null` using `onDelete: SetNull`."*

---

### Question 5: "What testing strategies were employed to ensure system reliability?"
**Technically Accurate Answer:**
> *"We implemented a multi-layered verification suite:
> 1. **Unit Testing:** 7 automated test suites comprising 72 unit tests running under Jest (`npm run test:api`), covering `BookingsService`, `AuthService`, `SettingsService`, `VehiclesService`, `UsersService`, `DepartmentsService`, and `MaintenanceService` with isolated mock implementations of `PrismaService`.
> 2. **Static Type Checking:** Strict TypeScript compilation with `0` errors across both `apps/api` and `apps/web` (`npm run typecheck`).
> 3. **Integration & End-to-End Testing:** Standalone Node.js workflow verification scripts (`test_logistics_workflow.js`, `verify_e2e_workflow.js`, `test_password_reset_e2e.ts`) that execute live HTTP sequences testing login, request creation, logistics approval, vehicle assignment, trip departure, arrival, completion, and QR gate verification."*

---

## 3. Demonstration Script (Live Presentation Sequence)

During an oral evaluation or project demo, follow this 5-minute presentation path:

1. **Architecture Introduction (30 seconds):**
   - Open repository root. Show `modules/` directory showcasing the 13 business domain portals.
   - Explain that each module connects frontend views, backend APIs, database models, and unit tests.
2. **Employee Booking Submission (1 minute):**
   - Log in as Employee (`abebe@capitalre.com`).
   - Open "Request Transport" form. Select destination ("Bole International Airport Project"), passenger count (4), and departure time.
   - Click Submit. Show real-time notice period validation.
3. **Logistics Review & Smart Assignment (1.5 minutes):**
   - Switch session to Logistics Admin (`logistics@capitalre.com`).
   - Open Logistics Dashboard. Show pending request in `ReviewRequestsQueue`.
   - Click "Assign Vehicle & Driver". Show how the recommendation algorithm pre-selects an active vehicle with adequate passenger capacity.
   - Confirm assignment. Show in-app notification dispatch.
4. **Driver Trip Execution & Odometer Delta (1 minute):**
   - Switch session to Driver (`driver@capitalre.com`).
   - Open Driver Dashboard. Accept assigned dispatch.
   - Click "Start Trip", enter start odometer (`25,400 km`).
   - Click "Complete Trip", enter end odometer (`25,480 km`).
   - Show that distance delta ($80 \text{ km}$) automatically updates vehicle cumulative mileage.
5. **Digital Receipt & QR Verification (1 minute):**
   - Click "View Digital Receipt" to display verified electronic voucher with QR code.
   - Click "Verify QR" or open public link `http://localhost:5173/?verify=<token>`.
   - Show how the unauthenticated public verification screen verifies gate pass authenticity in real-time.
