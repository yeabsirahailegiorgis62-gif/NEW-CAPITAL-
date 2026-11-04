# Capital Real Estate Fleet Management System
## Baseline Health & Quality Audit: Pre-Repair Status

**Date:** October 2026  
**Auditor / Engineer:** Antigravity Senior Engineering Agent  
**Environment:** Linux (x86_64), Node.js v20, PostgreSQL 16 (Port 5435), NestJS (Port 4100), Vite (Port 5173)

---

### 1. Executive Summary

A comprehensive pre-repair baseline audit was executed on the existing Capital Fleet repository to establish an authoritative benchmark prior to implementing functional repairs. 

* **Overall System State:** Substantial, high-quality application with deep domain modeling (31 views/modals, 35 API methods, automated conflict checking, public QR verification).
* **Critical Defects Identified:**
  1. **Approval Bypass in Assignment Engine:** `assignVehicle` and `autoAssign` in `bookings.service.ts` explicitly permit assigning vehicles and drivers to requests in `PENDING_APPROVAL` status, bypassing the mandatory managerial review step.
  2. **UI Action Permissiveness:** `ReviewRequestsQueue.tsx` and `LogisticsDashboard.tsx` expose "Assign Vehicle" and "Quick Auto-Assign" buttons on pending request rows.
  3. **Backend Unit Test Failure:** 8 tests in `apps/api/src/modules/bookings/bookings.service.spec.ts` fail due to `TypeError: this.prisma.booking.findFirst is not a function` because the test mock is missing `findFirst`.
  4. **In-Memory Tab State Reset:** Refreshing the browser while on a sub-tab (e.g., `'maintenance'`) resets the view back to `'dashboard'`.
  5. **Audit Logs View Lacks Search/Filters:** `AuditLogsView.tsx` renders a raw log table without interactive search or entity-type filter controls.
  6. **Button Overcrowding:** Up to 6 simultaneous action buttons clutter pending request rows on 1366x768 screens.

---

### 2. Baseline Test & Verification Results

| Suite / Check | Command Executed | Result | Details / Error Messages |
|:---|:---|:---:|:---|
| **Backend Unit Tests** | `npm run test --workspace=apps/api` | **FAIL (8 Failed, 22 Passed)** | `TypeError: this.prisma.booking.findFirst is not a function` in `bookings.service.spec.ts`. |
| **Backend Build** | `npm run build:api` (`nest build`) | **PASS** | Exit Code 0, 0 TypeScript errors. |
| **Frontend Build** | `npm run build:web` (`tsc && vite build`) | **PASS** | Exit Code 0, 1612 modules transformed, 985 kB JS bundle. |
| **Integration Suite 1** | `node verify_workflows.js` | **PASS (37/37)** | All 37 workflow assertions passed. |
| **Integration Suite 2** | `node verify_e2e_workflow.js` | **PASS (32/32)** | End-to-end trip execution and QR verification passed. |
| **Integration Suite 3** | `node test_assign_cancel.js` | **PASS (23/23)** | Assignment and cancellation passed (NOTE: Test 2 explicitly tested assigning on pending). |
| **Integration Suite 4** | `node test_logistics_workflow.js` | **PASS (7/7)** | Logistics endpoints passed (NOTE: Step 6 tested auto-assign on pending). |
| **Database Container** | `docker ps` | **PASS** | Container `capital_fleet_db` (PostgreSQL 16) healthy on port 5435. |

---

### 3. Detailed Breakdown of Confirmed Defects

#### Defect A: Assignment Before Approval (Priority 0)
* **Backend Cause:** `bookings.service.ts` line 843:
  ```typescript
  if (
    booking.status !== BookingStatus.PENDING_APPROVAL &&
    booking.status !== BookingStatus.APPROVED &&
    booking.status !== BookingStatus.ASSIGNED
  ) { ... }
  ```
  `autoAssign()` (line 1253) also lacks a check rejecting `PENDING_APPROVAL`.
* **Frontend Cause:** `ReviewRequestsQueue.tsx` (line 352) checks only user role (`canAssign = isLogisticsAdmin || isSystemAdmin`) without checking `booking.status === 'APPROVED'`.

#### Defect B: Backend Unit Mock Desynchronization (Priority 1)
* **Cause:** `findOne()` in `bookings.service.ts` (line 338) uses `this.prisma.booking.findFirst({ where: { OR: [{ id }, { bookingReference: id }] } })` to support both UUID and human references (`CR-2026-xxxx`), but `bookings.service.spec.ts` mock for `booking` only provided `findUnique`, `findMany`, `create`, `update`, `count`.

#### Defect C: UI Navigation State Loss on Refresh (Priority 2)
* **Cause:** `activeTab` in `App.tsx` defaults to `'dashboard'` and does not synchronize with URL search parameters (e.g., `?tab=maintenance`).

#### Defect D: Audit Logs View Filtering (Priority 2)
* **Cause:** `AuditLogsView.tsx` only fetches `api.getAuditLogs()` without providing search by user/reference or action type pills.

---

### 4. Proposed Repair Sequence

1. **Step 1:** Fix Backend Unit Test Mock in `bookings.service.spec.ts` -> run `npm run test:api` to reach 100% passing (30/30).
2. **Step 2:** Fix `assignVehicle` and `autoAssign` in `bookings.service.ts` to strictly reject `PENDING_APPROVAL`, `REJECTED`, `CANCELLED`, and `COMPLETED`.
3. **Step 3:** Update `test_assign_cancel.js` and `test_logistics_workflow.js` to assert that assigning on `PENDING_APPROVAL` returns `400 Bad Request`, and only succeeds once approved.
4. **Step 4:** Fix `ReviewRequestsQueue.tsx` and `LogisticsDashboard.tsx` to only render "Assign Vehicle" and "Quick Auto-Assign" when `booking.status === 'APPROVED'`.
5. **Step 5:** Reduce action button clutter on pending rows in `ReviewRequestsQueue.tsx`.
6. **Step 6:** Add URL query synchronization for `activeTab` in `App.tsx` (preserving tab on page refresh).
7. **Step 7:** Add interactive search and action filters in `AuditLogsView.tsx`.
8. **Step 8:** Run all automated test suites, build checks, and verify zero regressions.
9. **Step 9:** Author complete documentation deliverables (`CAPITAL_FLEET_REPAIR_LOG.md`, `CAPITAL_FLEET_REQUIREMENTS_MATRIX.md`, etc.).
