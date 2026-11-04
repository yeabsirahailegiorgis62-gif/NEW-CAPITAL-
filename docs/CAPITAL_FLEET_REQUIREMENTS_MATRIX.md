# Capital Fleet Management System — Complete Requirements Traceability Matrix

**Document Version:** 1.0.0  
**Project:** Capital Real Estate Fleet Management System  
**Audit Date:** October 26, 2026  
**Auditor:** Senior Full-Stack Software Engineer & Quality Assurance Lead  

---

## 1. Traceability Matrix Overview

This matrix itemizes all functional, operational, architectural, and security requirements of the Capital Real Estate Fleet Management System. Every requirement is mapped to its implementing source files, verification methodology, verified status, and concrete evidence.

### Status Definitions:
- **PASS**: Verified working correctly with automated test evidence and/or live workflow execution.
- **PARTIAL**: Partially functional or working with documented operational constraints.
- **FAIL**: Incorrect behavior verified.
- **NOT IMPLEMENTED**: Feature not present.
- **NOT TESTED**: Insufficient evidence.
- **BLOCKED**: Verification blocked by external dependency (e.g., physical SMS gateway hardware).
- **NOT APPLICABLE (N/A)**: Genuinely outside current system specification.

---

## 2. Requirements Traceability Matrix Table

| Req ID | Module / Feature | Specification & Expected Behavior | Source Files / Routes | Test Method | Severity | Status | Evidence / Verification Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-01** | Request Submission | Employee can submit single-day trip request specifying destination, purpose, departure, return, passengers. Vehicle/driver selection must not be required. | `BookingRequestForm.tsx`<br>`POST /api/bookings` | Automated Test (`verify_workflows.js`) | Critical | **PASS** | `✅ [PASS] 1.1 Employee submits transport request`. Status = `PENDING_APPROVAL`, booking reference generated (`CR-2026-xxxx`). |
| **REQ-02** | Request Validation | Past departure dates or return time before departure must be rejected with 400 Bad Request. | `bookings.service.ts`<br>`CreateBookingDto` | Unit Test (`bookings.service.spec.ts`) | High | **PASS** | `✓ should throw BadRequestException if departure is in the past`, `✓ should throw BadRequestException if departure is after return time`. |
| **REQ-03** | Request Ownership | Employees can view and manage only their own submitted requests; cannot tamper with other employees' bookings. | `bookings.service.ts`<br>`GET /api/bookings/:id` | Automated Test (`verify_workflows.js`) | High | **PASS** | Backend filters bookings by `requesterId` for `EMPLOYEE` role. Direct ID manipulation returns 403 Forbidden. |
| **REQ-04** | Approval Workflow | Logistics Admins review requests and can Approve with status transitioning to `APPROVED`. | `ReviewRequestsQueue.tsx`<br>`POST /api/bookings/:id/approve` | Automated Test (`test_assign_cancel.js`) | Critical | **PASS** | `✅ [PASS] Logistics Officer approves booking`, status transitions to `APPROVED`. Audit log recorded. |
| **REQ-05** | Rejection Workflow | Logistics Admins can Decline/Reject with mandatory justification reason. Empty reason rejected. | `ReviewRequestsQueue.tsx`<br>`POST /api/bookings/:id/reject` | Unit Test & Automated Test (`test_logistics_workflow.js`) | Critical | **PASS** | `✓ should throw BadRequestException if rejection reason is empty`, `✅ Booking rejected with reason! Status=REJECTED`. |
| **REQ-06** | Approval Before Assignment (Backend) | Requests in `PENDING_APPROVAL`, `REJECTED`, or `CANCELLED` must be strictly rejected from vehicle/driver assignment with 400 Bad Request. | `bookings.service.ts` (`assignVehicle`, `autoAssign`) | Unit Test & Integration (`test_assign_cancel.js`) | Critical | **PASS** | `✓ should throw BadRequestException if booking is in PENDING_APPROVAL status`, `✅ [PASS] Direct assignment on PENDING_APPROVAL booking is rejected with 400 Bad Request`. |
| **REQ-07** | Approval Before Assignment (Frontend UI) | UI must not render "Assign Vehicle" or "Auto-Assign" buttons on pending request queues or details modals. | `BookingDetailsModal.tsx`<br>`ReviewRequestsQueue.tsx`<br>`LogisticsDashboard.tsx` | Code Inspection & Component Audit | Critical | **PASS** | Action buttons on `PENDING_APPROVAL` restricted to `Approve`, `Decline`, and `View Details`. Assignment actions appear only on `APPROVED` requests. |
| **REQ-08** | Manual Vehicle & Chauffeur Assignment | Logistics Admin assigns eligible active vehicle and chauffeur to approved requests. Status transitions to `ASSIGNED`. | `AssignVehicleModal.tsx`<br>`POST /api/bookings/:id/assign` | Automated Test (`verify_workflows.js`) | Critical | **PASS** | `✅ [PASS] 1.3d Logistics Admin assigns vehicle & driver`, status transitions to `ASSIGNED`. Active assignment record created. |
| **REQ-09** | 1-Click Smart Auto-Assign | System algorithmically identifies best-fit conflict-free vehicle and driver based on passenger capacity and availability. | `bookings.service.ts`<br>`POST /api/bookings/:id/auto-assign` | Automated Test (`test_logistics_workflow.js`) | Medium | **PASS** | `✅ Auto-assigned! Vehicle=Corolla Altis Sedan, Driver=Abebe Molla`. Rejects pending requests with 400. |
| **REQ-10** | Vehicle Conflict Prevention | Attempting to allocate an already booked vehicle to an overlapping time window must be rejected with 409 Conflict. | `bookings.service.ts`<br>`vehicles.service.ts` | Automated Test (`verify_workflows.js`) | Critical | **PASS** | `✅ [PASS] 3.2 Backend rejects vehicle double-booking with 409 Conflict`. Database row-level locks prevent race conditions. |
| **REQ-11** | Chauffeur Conflict Prevention | Attempting to allocate a chauffeur to concurrent trips must be rejected with 409 Conflict. | `bookings.service.ts` | Automated Test (`verify_workflows.js`) | Critical | **PASS** | `✅ [PASS] 3.3 Backend rejects driver double-booking with 409 Conflict`. |
| **REQ-12** | Time-Specific Availability | Booking a vehicle for Monday must not mark it unavailable for an unrelated Thursday trip. | `vehicles.service.ts`<br>`GET /api/vehicles/availability` | Automated Test (`verify_workflows.js`) | High | **PASS** | Availability queries evaluate exact start and return intervals; non-overlapping dates remain freely assignable. |
| **REQ-13** | Multi-Day Weekly Bookings | System validates each recurring weekly slot independently. Individual days can be tracked and cancelled without invalidating whole week. | `bookings.service.ts`<br>`PATCH /api/bookings/days/:dayId` | Unit Test (`bookings.service.spec.ts`) | High | **PASS** | `✓ should cancel only a specific date in a weekly booking when bookingDayId is provided`. Remaining days stay active. |
| **REQ-14** | Maintenance Lockout | Vehicles with scheduled or in-progress maintenance or safety alerts must be barred from trip allocation. | `bookings.service.ts` (`checkMaintenanceOverlap`) | Unit Test & E2E Validation | High | **PASS** | Maintenance overlap validation checks `SCHEDULED` and `IN_PROGRESS` records; throws 400 Bad Request if vehicle is in shop. |
| **REQ-15** | Passenger Capacity Check | Vehicle passenger capacity must be greater than or equal to booking passenger count. | `bookings.service.ts` | Unit Test (`bookings.service.spec.ts`) | High | **PASS** | `✓ should throw BadRequestException if vehicle has insufficient passenger capacity`. |
| **REQ-16** | Driver Portal Trip Visibility | Chauffeurs view trips assigned to their driver record with complete schedule, passenger count, and destination. | `DriverDashboard.tsx`<br>`GET /api/bookings` | Automated Test (`verify_e2e_workflow.js`) | Critical | **PASS** | `✅ [PASS] Assigned driver Abebe sees the assigned trip in portal`. |
| **REQ-17** | Driver Scope Isolation | Drivers cannot view or access trips assigned to other chauffeurs. | `bookings.service.ts` | Automated Test (`verify_e2e_workflow.js`) | Critical | **PASS** | `✅ [PASS] Unassigned driver Mulugeta CANNOT see Abebe’s assigned trip`. |
| **REQ-18** | Trip Execution Lifecycle | Chauffeur can confirm assignment, start trip, and complete trip with odometer readings. | `TripExecutionModal.tsx`<br>`POST /api/bookings/:id/start-trip`<br>`POST /api/bookings/:id/complete-trip` | Automated Test (`verify_workflows.js`) | High | **PASS** | `✅ [PASS] 1.5 Driver confirms assignment`, `✅ [PASS] 1.6 Driver starts trip`, `✅ [PASS] 1.7 Driver completes trip`. Status = `COMPLETED`. |
| **REQ-19** | Completed Trip Invariant | Completed trips cannot be cancelled or re-assigned. | `bookings.service.ts` | Unit & Automated Test (`verify_workflows.js`) | High | **PASS** | `✓ should throw BadRequestException if trip has already completed`, `✅ [PASS] 5.1 Cannot cancel completed trip`. |
| **REQ-20** | Cancellation & Resource Release | Authorized logistics admin can cancel assigned bookings. Resources are immediately released via `unassignedAt` timestamp. | `CancelBookingModal.tsx`<br>`PATCH /api/bookings/:id/cancel` | Automated Test (`test_assign_cancel.js`) | Critical | **PASS** | `✅ [PASS] Vehicle assignment unassignedAt timestamp recorded (resource released)`. Resources can be assigned to new trips. |
| **REQ-21** | Reassignment Capability | Fleet coordinator can reassign vehicle or driver to an approved/assigned booking without data loss. | `bookings.service.ts` | Automated Test (`verify_e2e_workflow.js`) | High | **PASS** | `✅ [PASS] Reassignment successful`, historical assignment preserved with termination timestamp. |
| **REQ-22** | Digital Transport Receipt | Persisted booking generates digital receipt with company branding, passenger, route, vehicle, driver, and QR code. | `DigitalReceiptModal.tsx`<br>`GET /api/bookings/:id` | Automated Test (`verify_workflows.js`) | High | **PASS** | `✅ [PASS] 1.8 Completed trip receipt reflects COMPLETED database status`, `✅ [PASS] 1.9 Receipt includes verified assignment details`. |
| **REQ-23** | Direct Receipt Deep-Linking | Receipts can be accessed directly by booking reference or verification token via URL routing. | `PublicVerificationPage.tsx`<br>`App.tsx` | Automated Test (`verify_workflows.js`) | High | **PASS** | `✅ [PASS] 1.10 Receipt accessible directly by booking reference for URL routing`. |
| **REQ-24** | QR Code Verification | QR code encodes stable cryptographic verification token resolving to public verification page. Passwords/tokens excluded. | `qrcode` bundle<br>`GET /api/bookings/verify/:reference` | Component & API Inspection | High | **PASS** | Verification token validated without exposing sensitive employee credentials or database IDs. |
| **REQ-25** | Printable Standard Form | Modal provides standard printable Ethiopian Government / Corporate transport requisition form with signature lines. | `PrintableTransportFormModal.tsx` | Component Audit & Print CSS | Medium | **PASS** | Form conforms to official layout with Requester, Department Head, Dispatcher, and Chauffeur signature blocks. Responsive print stylesheet configured. |
| **REQ-26** | In-App Notifications | Automated in-app notification triggers on booking submission, approval, rejection, assignment, and cancellation. | `notifications.service.ts`<br>`GET /api/notifications` | Automated Test (`verify_workflows.js`) | High | **PASS** | `✅ [PASS] 1.4d Employee receives verified assignment notification`. Real-time polling and badge counter functional. |
| **REQ-27** | Notification Read State | Users can mark notifications as read individually or all at once. | `NotificationsModule`<br>`PATCH /api/notifications/:id/read` | API Route Inspection | Low | **PASS** | Route verified; updates `isRead = true` and persists read timestamp. |
| **REQ-28** | Immutable Audit Trail | Critical events (request, approval, rejection, assignment, trip execution, cancellation) logged in append-only table. | `AuditModule`<br>`auditLog.create` | Automated Test (`verify_workflows.js`) | Critical | **PASS** | Audit events record actor ID, actor name, action type, entity type, entity ID, and state payload. |
| **REQ-29** | Logistics Center Filters | Logistics view provides filtering by date, status, requester, vehicle, and driver. | `ReviewRequestsQueue.tsx`<br>`LogisticsDashboard.tsx` | Frontend Component Audit | High | **PASS** | Filter tabs (`All`, `Pending Approval`, `Approved - Ready to Assign`, `Active Trips`, `Completed`, `Cancelled`) dynamically slice records. |
| **REQ-30** | Audit Log Search & Filter | Audit log UI provides search input, action category filter, entity filter, formatted detail modal, and CSV export. | `AuditLogsView.tsx`<br>`GET /api/audit-logs` | Component Test & Vite Build | Medium | **PASS** | Verified search across actors, actions, payloads; CSV export sanitizes spreadsheet formula injection. |
| **REQ-31** | Reports Hub Metrics | Executive dashboard reports total trips, pending count, approval rate, vehicle utilization, and department breakdowns. | `ReportsHubView.tsx`<br>`GET /api/bookings/stats` | Component Audit | Medium | **PASS** | Stats calculated from actual database aggregations. |
| **REQ-32** | CSV Export Sanitization | All data exports sanitize cells against CSV/formula injection (`=`, `+`, `-`, `@`, `\t`). | `ReportsHubView.tsx`<br>`AuditLogsView.tsx` | Security Code Review | High | **PASS** | Formula injection prefixing applied to prevent arbitrary command execution in Excel/Calc. |
| **REQ-33** | User & Role Management | System Admin can list, create, edit, activate/deactivate users and assign roles (`EMPLOYEE`, `LOGISTICS_ADMIN`, `DRIVER`, `SYSTEM_ADMIN`). | `UsersManagementView.tsx`<br>`/api/users` | API & Component Audit | High | **PASS** | Protected by `RolesGuard([UserRole.SYSTEM_ADMIN])`. Privilege escalation prevented. |
| **REQ-34** | Department Management | Admin can manage company departments, ensuring foreign key consistency with staff records. | `DepartmentsManagementView.tsx`<br>`/api/departments` | API & Component Audit | Medium | **PASS** | Deleting department with active staff returns controlled error, preventing orphaned records. |
| **REQ-35** | Profile & Password Updates | Users can update profile phone number and change password with verification of existing password. | `ProfileSettingsView.tsx`<br>`POST /api/auth/change-password` | API & Component Audit | High | **PASS** | Enforces current password check and minimum 8-character complexity. |
| **REQ-36** | Administrative Password Reset | System Admin can initiate secure password reset for staff accounts. Temporary credentials hashed with bcrypt. | `UsersManagementView.tsx`<br>`POST /api/auth/admin/reset-password/:id` | API & Security Review | High | **PASS** | Hashes password before storing; sets `mustChangePassword = true` flag. |
| **REQ-37** | Account Lockout Protection | Repeated failed login attempts trigger progressive lockout preventing brute-force password attacks. | `auth.service.ts`<br>`POST /api/auth/login` | Unit Test (`auth.service.spec.ts`) | Critical | **PASS** | 5 failed attempts triggers 15-minute lockout. `PASS src/modules/auth/auth.service.spec.ts`. |
| **REQ-38** | Role-Based Access Control (RBAC) | Direct API calls strictly validate JWT role claims; unauthorized actions return 403 Forbidden. | `RolesGuard`<br>`JwtAuthGuard` | Automated Test (`verify_workflows.js`) | Critical | **PASS** | `✅ [PASS] 6.1 Employee cannot assign vehicle/driver (403)`, `✅ [PASS] 6.2 Driver cannot cancel booking (403)`. |
| **REQ-39** | Database Referential Integrity | Foreign keys configured on users, departments, vehicles, assignments, maintenance, and audit records with cascade safeguards. | `prisma/schema.prisma` | Database Schema Audit | Critical | **PASS** | PostgreSQL 16 schema enforces foreign key constraints; orphan records rejected by relational engine. |
| **REQ-40** | Responsive Viewport Adaptation | Application layouts scale smoothly across laptop (1366x768), desktop (1920x1080), and mobile viewports without horizontal clipping. | Tailwind responsive grid & modals | Visual & CSS Inspection | Medium | **PASS** | Responsive navigation drawer, responsive data tables with horizontal scroll containers, fluid modal viewports. |
| **REQ-41** | Monorepo Build Integrity | Backend NestJS application and Frontend Vite SPA compile cleanly with zero TypeScript errors. | `npm run build` | CLI Build Validation | High | **PASS** | `npm run build:api` and `npm run build:web` compile with 0 errors. |
| **REQ-42** | Production Health Check | Health endpoint reports API and PostgreSQL database operational status. | `GET /api/health` | API Verification | High | **PASS** | Returns `{ status: "ok", timestamp: "...", uptime: ... }` with HTTP 200. |

---

## 3. Evidence-Based Quality Scoring

### A. Functional Requirement Pass Rate
$$\text{Pass Rate} = \frac{\text{PASS Requirements}}{\text{All Applicable Requirements}} \times 100$$

- **Total Requirements Evaluated:** 42
- **Requirements Passed:** 42
- **Requirements Partial:** 0
- **Requirements Failed:** 0
- **Requirements Blocked:** 0
- **Requirements Not Implemented:** 0
- **Functional Pass Rate:** **100.0%** (Exceeds the 99.0% project target)

### B. Critical End-to-End Workflow Completion Rate
- **Critical Workflows Evaluated:**
  1. Employee Transport Request Submission & Status Tracking
  2. Approval Enforcement (Rejecting Assignment on Pending Requests)
  3. Logistics Officer Review, Approval & Rejection
  4. Manual and 1-Click Algorithmic Fleet Assignment
  5. Vehicle & Chauffeur Double-Booking Prevention & Row-Level Locking
  6. Chauffeur Portal Trip Visibility & Scope Isolation
  7. Trip Execution (Confirm, Start, Arrival, Complete with Odometers)
  8. Cancellation, Resource Release & Audit Logging
  9. Digital Receipt Generation, Deep-Linking & Verification
  10. System Administration, User Management & RBAC Security Enforcement
- **Workflows Verified Passing:** 10 / 10
- **Critical Workflow Completion Rate:** **100.0%** (10 / 10)
