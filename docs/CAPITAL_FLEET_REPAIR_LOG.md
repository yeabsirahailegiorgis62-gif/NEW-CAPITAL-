# Capital Fleet Management System — Complete Repair Log

**Document Version:** 1.0.0  
**Project:** Capital Real Estate Fleet Management System  
**Date:** October 26, 2026  
**Auditor / Lead Engineer:** Senior Full-Stack Software Engineer & QA Specialist  

---

## 1. Overview of Repairs

This repair log documents all confirmed defects, root cause diagnoses, affected architectural layers, code modifications, and verification proofs executed during the Capital Fleet system remediation.

---

## 2. Itemized Defect Remediation Log

### Defect 1: Transport Request Allocation Prior to Approval (Priority 0)
- **Status:** FIXED & VERIFIED
- **Severity:** CRITICAL (Business Integrity & RBAC)
- **Problem Statement:** The system previously allowed logistics coordinators to assign vehicles and chauffeurs directly to transport requests in `PENDING_APPROVAL` status. Additionally, the UI exposed "Assign Vehicle" and "⚡ Auto-Assign" action buttons on pending request queues, bypassing the mandatory administrative approval step.
- **Root Cause Analysis:**
  1. In `apps/api/src/modules/bookings/bookings.service.ts`, the status guard condition in `assignVehicle()` previously permitted `PENDING_APPROVAL` (`if (booking.status !== BookingStatus.PENDING_APPROVAL && ...)`).
  2. `autoAssign()` in `bookings.service.ts` similarly lacked a guard against allocating pending requests.
  3. Frontend components (`ReviewRequestsQueue.tsx`, `LogisticsDashboard.tsx`, `BookingDetailsModal.tsx`) rendered assignment actions on rows where `booking.status === BookingStatus.PENDING_APPROVAL`.
- **Files Changed:**
  - `apps/api/src/modules/bookings/bookings.service.ts` (lines 839–854 and 1263–1272)
  - `apps/web/src/features/bookings/BookingDetailsModal.tsx`
  - `apps/web/src/features/logistics/ReviewRequestsQueue.tsx`
  - `apps/web/src/features/dashboard/LogisticsDashboard.tsx`
- **Fix Implemented:**
  1. Backend `assignVehicle()` now strictly validates `booking.status`: If status is `PENDING_APPROVAL`, it throws a `BadRequestException` (`'Cannot assign vehicle: this transport request is currently pending review and must be approved by logistics administration before allocation.'`). Only requests with status `APPROVED` or `ASSIGNED` (for reassignment) are eligible.
  2. Backend `autoAssign()` enforces the exact same status check before allocating fleet assets.
  3. Frontend UI components strictly restrict visible actions on `PENDING_APPROVAL` items to `Approve`, `Decline/Reject`, and `View Details`. All "Assign" and "Auto-Assign" buttons are hidden until approval is granted.
- **Verification Evidence:**
  - `bookings.service.spec.ts` unit test: `✓ should throw BadRequestException if booking is in PENDING_APPROVAL status`
  - Integration script `test_assign_cancel.js`: `✅ [PASS] Direct assignment on PENDING_APPROVAL booking is rejected with 400 Bad Request`
  - Integration script `test_logistics_workflow.js`: `✅ Direct assign on pending request correctly rejected with 400 Bad Request!` and `✅ Auto-assign on pending request correctly rejected with 400 Bad Request!`

---

### Defect 2: Backend Unit Test Suite Mock Failures (Priority 1)
- **Status:** FIXED & VERIFIED
- **Severity:** HIGH (CI/CD & Quality Assurance)
- **Problem Statement:** 8 unit tests in `apps/api/src/modules/bookings/bookings.service.spec.ts` were failing with `TypeError: this.prisma.booking.findFirst is not a function` and `TypeError: this.prisma.auditLog.findMany is not a function`.
- **Root Cause Analysis:**
  1. `BookingsService.findOne()` was previously enhanced to query by either primary UUID `id` or human-readable `bookingReference` using `this.prisma.booking.findFirst()`. However, the test suite's `TestingModule` mock for `PrismaService` only provided `booking.findUnique`.
  2. `BookingsService.findOne()` appends immutable audit trail records via `this.prisma.auditLog.findMany()`, but the test mock for `auditLog` only mocked `create`.
- **Files Changed:**
  - `apps/api/src/modules/bookings/bookings.service.spec.ts`
- **Fix Implemented:**
  1. Configured `findFirst` on the `prisma.booking` mock in `Test.createTestingModule()`.
  2. In `beforeEach`, set `(prisma.booking.findFirst as jest.Mock).mockImplementation((args) => (prisma.booking.findUnique as jest.Mock)(args))` to maintain compatibility with existing test fixtures.
  3. Added `findMany: jest.fn().mockResolvedValue([])` to the `auditLog` mock.
  4. Added `$queryRaw: jest.fn().mockResolvedValue([])` for PostgreSQL row-level lock simulations.
  5. Added comprehensive `describe('assignVehicle')` unit test suite covering status guards and RBAC role checks.
- **Verification Evidence:**
  - Executed `npm run test:api`: 3 of 3 test suites passed, 35 of 35 unit tests passed with 0 failures (`PASS bookings.service.spec.ts`, `PASS settings.service.spec.ts`, `PASS auth.service.spec.ts`).

---

### Defect 3: Active Tab State Loss on Page Refresh (Priority 2)
- **Status:** FIXED & VERIFIED
- **Severity:** MEDIUM (Usability & Routing Integrity)
- **Problem Statement:** Refreshing the browser on sub-views (such as Review Queue, Inventory, Audit Logs, or Reports Hub) abruptly reset the user's workspace back to the default `dashboard` tab, forcing repetitive manual navigation.
- **Root Cause Analysis:**
  - In `apps/web/src/App.tsx`, `activeTab` was initialized with static default state: `useState<string>('dashboard')` without inspecting current URL parameters or browser history.
- **Files Changed:**
  - `apps/web/src/App.tsx`
- **Fix Implemented:**
  1. Updated `activeTab` state initialization to inspect `new URLSearchParams(window.location.search).get('tab')`.
  2. Implemented `useEffect` synchronization using `window.history.replaceState` to reflect the active tab in the browser URL query parameter without triggering page reloads.
- **Verification Evidence:**
  - Direct navigation to `/?tab=audit-logs`, `/?tab=reports`, and `/?tab=logistics-queue` renders the intended sub-view immediately. Browser refresh maintains view state without bouncing back to dashboard.

---

### Defect 4: Unfiltered Audit Logs & Missing CSV Export (Priority 2)
- **Status:** FIXED & VERIFIED
- **Severity:** MEDIUM (Operational Visibility & Compliance)
- **Problem Statement:** The System Audit Log table in the admin workspace displayed raw records with no search or filtering capabilities, and lacked an export mechanism. Long payload JSON strings were truncated without a way to inspect details.
- **Root Cause Analysis:**
  - `AuditLogsView.tsx` rendered a static HTML table without search inputs, action category filters, entity filters, or pagination controls.
- **Files Changed:**
  - `apps/web/src/features/admin/AuditLogsView.tsx`
- **Fix Implemented:**
  1. Added interactive real-time search input searching across actor names, action types, entity types, IDs, and payload strings.
  2. Added action category filter dropdown dynamically populated from active log actions (`APPROVE_BOOKING`, `ASSIGN_VEHICLE`, `REJECT_BOOKING`, `CANCEL_BOOKING`, `START_TRIP`, `COMPLETE_TRIP`, etc.).
  3. Added target entity type filter dropdown.
  4. Implemented interactive "View" button opening an Audit Event Details modal with full formatted JSON payload.
  5. Implemented client-side CSV Export with sanitization against spreadsheet formula injection (`=`, `+`, `-`, `@`, `\t`).
- **Verification Evidence:**
  - Built frontend with `npm run build:web` (0 errors). Verified search and filtering dynamically updates table rows and export count.

---

### Defect 5: Double-Booking and Race Conditions Prevention (Priority 0)
- **Status:** VERIFIED
- **Severity:** CRITICAL (Operational Fleet Safety)
- **Verification Performed:**
  - Verified backend concurrency controls in `bookings.service.ts`:
    - Row-level locking via `SELECT ... FOR UPDATE` inside `prisma.$transaction`.
    - Overlap detection checking `departureAt < existing.expectedReturnAt && expectedReturnAt > existing.departureAt`.
    - Maintenance overlap validation checking workshop schedules (`SCHEDULED`, `IN_PROGRESS`).
    - Chauffeur conflict detection ensuring a driver cannot be assigned to concurrent trips.
- **Verification Evidence:**
  - Executed `verify_workflows.js`:
    - `✅ [PASS] 3.2 Backend rejects vehicle double-booking with 409 Conflict`
    - `✅ [PASS] 3.3 Backend rejects driver double-booking with 409 Conflict`
  - Executed `verify_e2e_workflow.js`:
    - `✅ [PASS] Conflicting vehicle assignment is rejected with conflict error (409/400)`
    - `✅ [PASS] Conflicting driver assignment is rejected with conflict error (409/400)`

---

### Defect 6: Cancellation Resource Release and Audit Trail (Priority 1)
- **Status:** VERIFIED
- **Severity:** HIGH (Operational Fleet Efficiency)
- **Verification Performed:**
  - Verified that cancelling an assigned booking updates `unassignedAt = new Date()` on all active assignments, returning the vehicle and chauffeur to the available pool.
  - Verified that cancelled assignments do not block future trips.
  - Verified that immutable audit logs record the cancellation event, actor ID, and cancellation reason.
- **Verification Evidence:**
  - Executed `test_assign_cancel.js`:
    - `✅ [PASS] Cancel ASSIGNED booking via PATCH succeeds`
    - `✅ [PASS] Booking 1 status is CANCELLED`
    - `✅ [PASS] Vehicle assignment unassignedAt timestamp recorded (resource released)`

---

## 3. Monorepo Build and Test Summary Post-Remediation

| Suite / Command | Execution Scope | Passed | Failed | Result |
| :--- | :--- | :--- | :--- | :--- |
| `npm run test:api` | Backend Unit Tests (Jest) | 35 | 0 | **100% PASS** |
| `npm run build:api` | API TypeScript Build (`tsc`) | 1 | 0 | **100% PASS** |
| `npm run build:web` | Web Vite Bundle (`tsc && vite build`) | 1 | 0 | **100% PASS** |
| `npm run lint` | Full Monorepo Typecheck (`tsc --noEmit`) | 2 | 0 | **100% PASS** |
| `node verify_workflows.js` | Core Business Lifecycles & RBAC | 37 | 0 | **100% PASS** |
| `node verify_e2e_workflow.js` | End-to-End Multi-Role Workflow | 32 | 0 | **100% PASS** |
| `node test_assign_cancel.js` | Approval Enforcement & Cancellation | 26 | 0 | **100% PASS** |
| `node test_logistics_workflow.js` | Logistics Admin Auto-Assign & Rejection | 7 | 0 | **100% PASS** |
