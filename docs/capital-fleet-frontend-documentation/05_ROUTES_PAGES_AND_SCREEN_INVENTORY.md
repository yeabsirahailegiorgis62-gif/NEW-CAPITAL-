# Capital Fleet Management System
## Deliverable 05: Routes, Pages & Screen Inventory

**Document ID:** `DOC-05`  
**Classification:** Screen Inventory & User Interface Catalog  
**Status:** **Verified** against active React views (31 views & screens cataloged)  

---

## 1. Master Routing Architecture

The Capital Fleet frontend implements an **Application Shell Routing Architecture** managed inside [`apps/web/src/App.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx).

The routing model consists of two tiers:
1. **Top-Level View Tier:** Controlled by `currentView` (`'landing' | 'login' | 'workspace'`).
2. **Workspace Tab Routing Tier:** Controlled by `activeTab` (`'dashboard' | 'requests' | 'new-request' | 'logistics-queue' | ...`), synchronized directly with browser query parameters (`?tab=...`).
3. **Public Gate Security Bypass:** Route query param `?verify=...`, `?token=...`, or `?ref=...` immediately renders the unauthenticated gate clearance portal ([`PublicVerificationPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx)).

---

## 2. Complete Screen & View Inventory Table

| ID | Screen / View Name | Tab / Route Identifier | Intended Role | Purpose & Key Features | API Endpoints | Status | Relevant Source File |
|:---|:---|:---|:---|:---|:---|:---:|:---|
| **SCR-01** | Landing Page | Root (`/` with `currentView='landing'`) | Public | Corporate welcome, operational feature overview, portal login link. | None | **Verified** | `src/pages/LandingPage.tsx` |
| **SCR-02** | Login Screen | `?view=login` or `/auth` | Public | Multi-role authentication with demo credentials helper. | `POST /api/auth/login` | **Verified** | `src/pages/LoginPage.tsx` |
| **SCR-03** | Public QR Gate Pass | `?verify=<token>` or `?ref=<ref>` | Gate Guards | Unauthenticated security checkpoint verification of travel clearance passes. | `GET /api/bookings/verify/:ref` | **Verified** | `src/pages/PublicVerificationPage.tsx` |
| **SCR-04** | Employee Dashboard | `?tab=dashboard` (Role: `EMPLOYEE`) | Employee | Personal trip counters, active mission summary, quick requisition button. | `GET /api/bookings` | **Verified** | `src/features/dashboard/EmployeeDashboard.tsx` |
| **SCR-05** | Logistics Dashboard | `?tab=dashboard` (Role: `LOGISTICS_ADMIN`) | Logistics Admin | Dispatch control center, pending request counters, fleet availability. | `GET /api/bookings`, `GET /api/vehicles` | **Verified** | `src/features/dashboard/LogisticsDashboard.tsx` |
| **SCR-06** | Driver Mission Cockpit | `?tab=dashboard` (Role: `DRIVER`) | Chauffeur | Active assigned trip cards, start trip, record odometers, report road delays. | `GET /api/bookings` | **Verified** | `src/features/dashboard/DriverDashboard.tsx` |
| **SCR-07** | Admin Analytics Dashboard | `?tab=dashboard` (Role: `SYSTEM_ADMIN`) | System Admin | System KPIs, total trips, fuel metrics, vehicle status breakdown. | `GET /api/bookings/stats`, `GET /api/fuel/stats` | **Verified** | `src/features/dashboard/AdminAnalyticsDashboard.tsx` |
| **SCR-08** | New Booking Request | `?tab=new-request` | Employee / Admin | Daily & Weekly multi-day transport requisition intake form. | `POST /api/bookings` | **Verified** | `src/features/bookings/BookingRequestForm.tsx` |
| **SCR-09** | My Bookings Grid | `?tab=requests` | All Roles | Status-filtered interactive table of user's transport requests. | `GET /api/bookings` | **Verified** | `src/features/bookings/BookingsTable.tsx` |
| **SCR-10** | Logistics Review Queue | `?tab=logistics-queue` | Logistics Admin | Pending review queue with one-click approve and modal decline. | `POST .../approve`, `POST .../reject` | **Verified** | `src/features/logistics/ReviewRequestsQueue.tsx` |
| **SCR-11** | Fleet Asset Inventory | `?tab=vehicles` | Logistics / Admin | Master vehicle catalog with status pills, specs, and maintenance status. | `GET /api/vehicles` | **Verified** | `src/features/vehicles/VehicleInventoryView.tsx` |
| **SCR-12** | Fleet Availability Calendar| `?tab=calendar` | Logistics / Admin | Visual timeline of vehicle allocations across dates. | `GET /api/vehicles/availability` | **Verified** | `src/features/availability/AvailabilityCalendar.tsx` |
| **SCR-13** | Chauffeur Directory | `?tab=drivers` | Logistics / Admin | Roster of company chauffeurs, license classes, active assignments. | `GET /api/users?role=DRIVER` | **Verified** | `src/features/drivers/DriversManagementView.tsx` |
| **SCR-14** | Workshop Maintenance | `?tab=maintenance` | Logistics / Admin | Scheduled servicing records, mechanical defect tickets, cost logging. | `GET /api/maintenance` | **Verified** | `src/features/maintenance/MaintenanceView.tsx` |
| **SCR-15** | Reports & Analytics Hub | `?tab=reports` | Admin / Logistics | Trip volume charts, department utilization, sanitized CSV export. | `GET /api/bookings/stats` | **Verified** | `src/features/reports/ReportsHubView.tsx` |
| **SCR-16** | User & Role Management | `?tab=users` | System Admin | Staff user directory, role assignment, administrative password resets. | `GET /api/users`, `POST /api/users` | **Verified** | `src/features/admin/UsersManagementView.tsx` |
| **SCR-17** | Department Management | `?tab=departments` | System Admin | Corporate department hierarchy management. | `GET /api/departments` | **Verified** | `src/features/admin/DepartmentsManagementView.tsx` |
| **SCR-18** | System Audit Log | `?tab=audit-logs` | System Admin | Immutable security journal with search, action filtering & CSV export. | `GET /api/audit-logs` | **Verified** | `src/features/admin/AuditLogsView.tsx` |
| **SCR-19** | System Security Settings | `?tab=settings` | System Admin | Policy configuration (lockout attempts, session duration, password rules).| `GET /api/settings`, `PATCH /api/settings` | **Verified** | `src/features/admin/SystemSettingsView.tsx` |
| **SCR-20** | Profile Settings | `?tab=profile-settings` | All Roles | Self-service telephone update and password change interface. | `PATCH /api/users/profile/me`, `POST .../change-password` | **Verified** | `src/features/profile/ProfileSettingsView.tsx` |
| **SCR-21** | Trip Allocation Modal | Dialog Overlay | Logistics Admin | Vehicle and chauffeur assignment with capacity and conflict checks. | `POST /api/bookings/:id/assign` | **Verified** | `src/features/logistics/AssignVehicleModal.tsx` |
| **SCR-22** | Trip Execution Modal | Dialog Overlay | Chauffeur | Confirm assignment, record starting odometer, complete with final reading. | `POST .../confirm`, `POST .../start-trip`, `POST .../complete-trip` | **Verified** | `src/features/logistics/TripExecutionModal.tsx` |
| **SCR-23** | Digital Receipt Voucher | Dialog Overlay | All Roles | Branded corporate transport pass with client-side generated QR code. | `GET /api/bookings/:id` | **Verified** | `src/features/bookings/DigitalReceiptModal.tsx` |
| **SCR-24** | Printable Transport Voucher| Dialog Overlay | All Roles | Standard corporate printable voucher formatted with `@media print`. | `GET /api/bookings/:id` | **Verified** | `src/features/bookings/PrintableTransportFormModal.tsx` |
| **SCR-25** | Trip Cancellation Modal | Dialog Overlay | Logistics / Admin | Mandatory cancellation reason capture and asset release trigger. | `PATCH /api/bookings/:id/cancel` | **Verified** | `src/features/bookings/CancelBookingModal.tsx` |
| **SCR-26** | Trip Details Modal | Dialog Overlay | All Roles | Full trip itinerary, passenger count, approval timestamps, and actions. | `GET /api/bookings/:id` | **Verified** | `src/features/bookings/BookingDetailsModal.tsx` |
| **SCR-27** | Password Recovery Modal | Dialog Overlay | Public | Self-service forgot password email/token submission. | `POST /api/auth/forgot-password` | **Verified** | `src/features/auth/ForgotPasswordModal.tsx` |
| **SCR-28** | Add Employee Modal | Dialog Overlay | System Admin | Modal form for provisioning new staff credentials. | `POST /api/users` | **Verified** | `src/features/admin/AddEmployeeModal.tsx` |
| **SCR-29** | Add/Edit Vehicle Modal | Dialog Overlay | Logistics / Admin | Master fleet vehicle registration dialog. | `POST /api/vehicles`, `PATCH /api/vehicles/:id` | **Verified** | `src/features/vehicles/VehicleModal.tsx` |
| **SCR-30** | Notification Modal | Dialog Overlay | All Roles | Full-text view for in-app dispatch notifications. | `PATCH /api/notifications/:id/read` | **Verified** | `src/components/notifications/NotificationDetailsModal.tsx` |
| **SCR-31** | User Profile Modal | Dialog Overlay | All Roles | Quick user identity and role credentials inspector dialog. | In-memory session | **Verified** | `src/components/layout/ProfileModal.tsx` |

---

## 3. Screen State Transitions & Loading Handling

Across all discovered views, screens implement standardized UX states:
- **Loading State:** Data tables and dashboard widgets render skeleton pulses or the cockpit radar overlay (`AutomotiveLoadingScreen.tsx`).
- **Empty State:** Filtered grids with no matching records display helpful empty states (e.g., *"No requests match the selected status"*).
- **Error State:** Network failures trigger toast alerts (`useToast()`) without destroying surrounding UI context.
