# Capital Real Estate Fleet Management System
## Deliverable 03: Comprehensive Page Inventory & Feature Documentation

---

### Executive Overview

This document presents a granular, evidence-based audit of every page, operational view, modal dialog, and dashboard implemented within the **Capital Real Estate Fleet Management System** frontend (`apps/web`). A total of **31 distinct views and dialogs** were inspected and verified against the source code.

Each entry documents the route or trigger, target user roles, business purpose, form fields, validation logic, API integrations, UX states, and verified implementation status.

---

### Master Page & Modal Inventory

| ID | Name / Title | Trigger / Route | User Role(s) | Primary Source File | Implementation Status |
|:---|:---|:---|:---|:---|:---|
| **P-01** | Public Corporate Landing Page | `currentView: 'landing'` | Public / All | [`LandingPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/LandingPage.tsx) | Verified & Working |
| **P-02** | Corporate Authentication Portal | `currentView: 'login'` | Public / All | [`LoginPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/LoginPage.tsx) | Verified & Working |
| **P-03** | Password Recovery Dialog | Modal trigger on login | Public / All | [`ForgotPasswordModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/auth/ForgotPasswordModal.tsx) | Verified & Working |
| **P-04** | Public Security Gate Verification | `?verify=` / `?token=` | Public / Security Guards | [`PublicVerificationPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx) | Verified & Working |
| **P-05** | Employee Self-Service Dashboard | `activeTab: 'dashboard'` | `EMPLOYEE` | [`EmployeeDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/EmployeeDashboard.tsx) | Verified & Working |
| **P-06** | Driver Mission Cockpit | `activeTab: 'dashboard'` | `DRIVER` | [`DriverDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/DriverDashboard.tsx) | Verified & Working |
| **P-07** | Logistics Command Dashboard | `activeTab: 'dashboard'` | `LOGISTICS_ADMIN` | [`LogisticsDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/LogisticsDashboard.tsx) | Verified & Working |
| **P-08** | Executive Analytics Dashboard | `activeTab: 'dashboard'` | `SYSTEM_ADMIN` | [`AdminAnalyticsDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/AdminAnalyticsDashboard.tsx) | Verified & Working |
| **P-09** | Transportation Request Form | `activeTab: 'new-booking'` | `EMPLOYEE`, Admins | [`BookingRequestForm.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx) | Verified & Working |
| **P-10** | My Bookings History View | `activeTab: 'my-bookings'` | `EMPLOYEE` | [`BookingsTable.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingsTable.tsx) | Verified & Working |
| **P-11** | Review Requests Queue | `activeTab: 'requests-queue'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx) | Verified & Working |
| **P-12** | Vehicle Allocation Queue | `activeTab: 'assign-queue'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx) | Verified & Working |
| **P-13** | Weekly Recurring Requests Queue| `activeTab: 'weekly-requests'`| `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx) | Verified & Working |
| **P-14** | Vehicle & Chauffeur Assignment | Modal dialog | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`AssignVehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx) | Verified & Working |
| **P-15** | Comprehensive Booking Details | Modal dialog | All Roles | [`BookingDetailsModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingDetailsModal.tsx) | Verified & Working |
| **P-16** | Booking Cancellation Dialog | Modal dialog | `EMPLOYEE`, Admins | [`CancelBookingModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/CancelBookingModal.tsx) | Verified & Working |
| **P-17** | Mission Telemetry Execution | Modal dialog | `DRIVER`, Admins | [`TripExecutionModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/TripExecutionModal.tsx) | Verified & Working |
| **P-18** | Digital Gate Pass & Receipt | Modal dialog | All Roles | [`DigitalReceiptModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/DigitalReceiptModal.tsx) | Verified & Working |
| **P-19** | Formal Printed Transport Order | Modal dialog | All Roles | [`PrintableTransportFormModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/PrintableTransportFormModal.tsx) | Verified & Working |
| **P-20** | In-App QR Code Lookup | Modal dialog | All Roles | [`BookingVerificationModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingVerificationModal.tsx) | Verified & Working |
| **P-21** | Fleet Availability Calendar | `activeTab: 'availability'` | All Roles | [`AvailabilityCalendar.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/availability/AvailabilityCalendar.tsx) | Verified & Working |
| **P-22** | Fleet Vehicle Inventory | `activeTab: 'vehicles'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`VehicleInventoryView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/vehicles/VehicleInventoryView.tsx) | Verified & Working |
| **P-23** | Vehicle Asset Creation / Edit | Modal dialog | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`VehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/vehicles/VehicleModal.tsx) | Verified & Working |
| **P-24** | Fleet Maintenance & Issues | `activeTab: 'maintenance'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`MaintenanceView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/maintenance/MaintenanceView.tsx) | Verified & Working |
| **P-25** | Chauffeur Registry & Licenses | `activeTab: 'drivers'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`DriversManagementView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/drivers/DriversManagementView.tsx) | Verified & Working |
| **P-26** | Reports & Analytics Hub | `activeTab: 'reports'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`ReportsHubView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/reports/ReportsHubView.tsx) | Verified & Working |
| **P-27** | Staff Directory & Accounts | `activeTab: 'users'` | `SYSTEM_ADMIN` | [`UsersManagementView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/UsersManagementView.tsx) | Verified & Working |
| **P-28** | New Employee Provisioning | Modal dialog | `SYSTEM_ADMIN` | [`AddEmployeeModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/AddEmployeeModal.tsx) | Verified & Working |
| **P-29** | Departments Management View | `activeTab: 'departments'` | `SYSTEM_ADMIN` | [`DepartmentsManagementView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/DepartmentsManagementView.tsx) | Verified & Working |
| **P-30** | System & Security Policy Config| `activeTab: 'settings'` | `SYSTEM_ADMIN` | [`SystemSettingsView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/SystemSettingsView.tsx) | Verified & Working |
| **P-31** | Immutable System Audit Logs | `activeTab: 'audit-logs'` | `LOGISTICS_ADMIN`, `SYSTEM_ADMIN` | [`AuditLogsView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/AuditLogsView.tsx) | Verified & Working |

---

### Detailed Specification of Core Operational Pages

---

#### 1. Public Corporate Landing Page (`P-01`)
* **Component:** [`LandingPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/LandingPage.tsx)
* **Trigger:** Top-level state `currentView === 'landing'`
* **Operational Purpose:** Provides a public-facing corporate introduction to Capital Real Estate's fleet services, operational benefits, dispatch stats, and security verification links.
* **Key Features:**
  * Interactive hero section with animated highway route simulation ([`DynamicFleetRouteSimulation.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/telematics/DynamicFleetRouteSimulation.tsx)).
  * "Sign In to Fleet Portal" action button triggering `setCurrentView('login')`.
  * Public QR pass lookup widget allowing visitors to input booking references for immediate clearance verification.
  * Showcase of company fleet tiers (Sedans, Executive SUVs, Field Pickups, Minibuses).

---

#### 2. Corporate Authentication Portal (`P-02`)
* **Component:** [`LoginPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/LoginPage.tsx)
* **Trigger:** Top-level state `currentView === 'login'` or URL query `?view=login`
* **Operational Purpose:** Authenticates staff members against the NestJS backend and acquires the session Bearer JWT.
* **Form Fields & Validation:**
  1. `identifier` (Email address or Employee ID): Required, string, trimmed.
  2. `password`: Required, string, password visibility toggle included.
* **Client Validation:** Verifies non-empty fields before dispatching network request.
* **API Service Call:** `api.login(identifier, password)` -> `POST /api/auth/login`.
* **State Updates:** On HTTP 200, saves token to `sessionStorage`, sets `currentUser`, switches `currentView` to `'workspace'`, and triggers `refreshAllData()`.
* **Error Handling:** Displays a high-visibility inline alert banner on HTTP 401 or network failure (`"Invalid credentials or account inactive"`).

---

#### 3. Public Security Gate Verification Portal (`P-04`)
* **Component:** [`PublicVerificationPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx)
* **Trigger:** URL parameters `?verify=<REF>` or `?token=<UUID>`
* **Operational Purpose:** Dedicated gate security interface accessed by physical security guards and checkpoint police officers via mobile devices to verify vehicle dispatch clearance without needing a user account.
* **API Service Calls:**
  * If parameter matches UUID regex: `api.verifyTripToken(token)` -> `GET /api/bookings/verify-token/:token`
  * Otherwise: `api.verifyBooking(reference)` -> `GET /api/bookings/verify/:reference`
* **Information Rendered:**
  * Validity Status Banner (`VALID`, `EXPIRED`, `INVALID`, `CANCELLED`).
  * Cryptographic gate pass seal with verification timestamp in Addis Ababa time (UTC+3).
  * Assigned Vehicle details (Make, Model, License Plate Number, Category).
  * Assigned Driver details (Full Name, Phone Number).
  * Travel Details: Destination, Purpose, Departure window, Expected Return window, Passenger Count.
  * Search input to quickly inspect alternative booking references.

---

#### 4. Transportation Request Form (`P-09`)
* **Component:** [`BookingRequestForm.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx)
* **Trigger:** Workspace tab `activeTab === 'new-booking'`
* **Operational Purpose:** Enables corporate employees to submit transportation requests for either single-day trips or multi-day recurring weekly itineraries.
* **Dual-Mode Tabs:**
  1. **Daily Request Tab:** For point-to-point transit on specific dates.
  2. **Weekly Request Tab:** For recurring site visits (e.g., Monday Morning + Thursday Afternoon) across a 7-day work week.
* **Input Fields:**
  * `destination`: Text input (e.g., "CMC Site 4 Engineering Hub"). Required.
  * `purpose`: Text input (e.g., "Concrete quality inspection & soil test"). Required.
  * `passengerCount`: Numeric counter with +/- steppers (Min: 1, Max: 30). Required.
  * `pickupLocation`: Defaults to "Capital Real Estate HQ, Bole Tower". Optional.
  * `contactPhone`: Defaults to `currentUser.phone`. Required.
  * `departureDate` & `departureTime`: Date and time inputs. Must be in the future.
  * `returnDate` & `returnTime`: Must be after departure.
  * `priority`: Radio selection (`NORMAL`, `HIGH`, `VIP`).
  * `requiresDriver`: Boolean (Hardcoded to `true` to ensure chauffeur assignment).
  * `weeklyDaysSchedule`: Day-by-day toggle for Monday through Sunday with time slot selection (`MORNING` 08:30–12:30 or `AFTERNOON` 13:30–17:30).
* **Automated Notice Compliance:**
  * Daily requests require at least 24 hours advance notice.
  * Weekly recurring requests require at least 72 hours advance notice.
  * A live compliance badge dynamically indicates notice status (`isNoticeCompliant`).
* **Live Duplicate Detection:** Debounced watcher checks `api.checkDuplicate({ tripDate, destination, departureTime })` and warns the user if an identical trip request was already filed by another colleague.
* **Post-Submission Confirmation View:** Renders an animated success confirmation containing a generated QR code, reference badge, "View Digital Receipt" shortcut, and "Print Transport Form" action.

---

#### 5. Logistics Review Requests Queue (`P-11` & `P-12`)
* **Component:** [`ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx)
* **Trigger:** Workspace tabs `activeTab === 'requests-queue'` (Pending) and `activeTab === 'assign-queue'` (Approved)
* **Operational Purpose:** Central dispatch workbench for transport officers to review incoming requests, assess departmental justification, execute approvals/rejections, and initiate vehicle allocations.
* **Filter Tabs:** `All`, `Pending Review`, `Approved (Awaiting Assignment)`, `Assigned / In Progress`.
* **Advanced Filters:** Real-time search by Reference, Requester, Destination; Department filter dropdown; Request Type filter (`ALL`, `DAILY`, `WEEKLY`); Date range filter.
* **Action Controls on Request Rows:**
  * `Approve`: Triggers `handleApproveBooking(id)` -> calls `POST /api/bookings/:id/approve` with optimistic state update.
  * `Reject`: Opens modal dialog prompting for mandatory rejection justification -> calls `POST /api/bookings/:id/reject`.
  * `Assign Vehicle`: Opens [`AssignVehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx).
  * `Quick Auto-Assign`: Invokes AI recommendation engine to pair the optimal vehicle and driver in a single click.
  * `Inspect`: Opens [`BookingDetailsModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingDetailsModal.tsx).
  * `Cancel`: Opens [`CancelBookingModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/CancelBookingModal.tsx).

---

#### 6. Vehicle and Driver Assignment Modal (`P-14`)
* **Component:** [`AssignVehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx)
* **Trigger:** Invoked via `onAssignVehicle(booking)` callback from Review Queue or Dashboards
* **Operational Purpose:** Allows logistics administrators to select an available fleet vehicle and qualified driver for an approved booking with real-time schedule conflict validation.
* **Smart Recommendation Engine Integration:**
  * Calls `api.getVehicleRecommendations(booking.id)`: Returns vehicles scored by passenger capacity, fuel efficiency, category match, and schedule availability.
  * Calls `api.getDriverRecommendations(booking.id)`: Returns active chauffeurs ranked by workload balance, license qualification, and schedule availability.
* **Conflict Prevention UI:**
  * Vehicles currently occupied during the requested travel window are marked in red with an `Unavailable` badge.
  * The conflicting booking reference (e.g., `"Conflict: CR-2026-0012"`) is displayed directly beneath the vehicle card.
  * Client-side validation blocks submission if an unavailable vehicle is selected.
* **Driver Modes:**
  1. `Corporate Chauffeur`: Selects from active company drivers.
  2. `Self-Driven (Staff)`: Records the requester as the authorized driver.
* **Preset Dispatch Instructions:** Includes one-click presets (e.g., *"Pick up vehicle keys and fuel voucher at Gate 1 Dispatch office before departure"*).
* **Submission:** Calls `api.assignVehicle(bookingId, payload)` -> `POST /api/bookings/:id/assign`.

---

#### 7. Driver Mission Portal (`P-06`)
* **Component:** [`DriverDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/DriverDashboard.tsx)
* **Trigger:** Workspace tab `activeTab === 'dashboard'` when `currentUser.role === 'DRIVER'`
* **Operational Purpose:** Chauffeur mission console designed for mobile and tablet touchscreens, providing real-time telemetry logging, trip milestone tracking, and mechanical issue reporting.
* **Mission Lifecycle Operations:**
  1. **Accept / Decline Assignment:** Drivers can confirm their readiness or decline an assignment with reason logging (`api.confirmAssignment` / `api.declineAssignment`).
  2. **Start Mission:** Opens start dialog to record starting odometer reading and actual departure timestamp (`api.startTrip`). Transitions booking to `IN_PROGRESS`.
  3. **Mark Arrival:** One-click confirmation when reaching destination (`api.markArrival`).
  4. **Report Delay:** Dialog to record traffic or breakdown delays with reason logging (`api.reportDelay`).
  5. **Complete Mission:** Final modal prompt to record return odometer, trip notes, and vehicle return condition (`api.completeTrip`). Transitions booking to `COMPLETED` and releases assets.
  6. **Report Vehicle Defect:** Interactive vehicle issue form to log mechanical, electrical, tire, or body damage with severity classification (`api.reportIssue`).

---

#### 8. Digital Receipt & Security Pass Modal (`P-18`)
* **Component:** [`DigitalReceiptModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/DigitalReceiptModal.tsx)
* **Trigger:** Invoked via `onOpenReceipt(booking)` or direct URL parameter `?receipt=<ID>`
* **Operational Purpose:** Provides a cryptographic digital boarding pass and physical trip voucher containing high-density QR code clearance.
* **Implementation Highlights:**
  * Uses `createPortal` to render above all application layers.
  * Generates high-error-correction QR code (`errorCorrectionLevel: 'H'`) delegating to the public verification endpoint.
  * Displays complete mission manifest: Gate Pass Clearance Seal, Booking Reference, Passenger List, Assigned Vehicle specifications, Chauffeur details, and Authorized Transit Window.
  * Built-in action buttons: "Copy Reference", "Print Pass" (executes print stylesheet), "Download QR Image".

---

#### 9. Formal Printed Transport Form Modal (`P-19`)
* **Component:** [`PrintableTransportFormModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/PrintableTransportFormModal.tsx)
* **Trigger:** Invoked via `onPrintForm(booking)`
* **Operational Purpose:** Generates an official, legal document replicating Capital Real Estate's corporate paper requisition form, complete with header emblem, reference numbers, multi-signoff signature boxes (Requester, Dept Head, Logistics Officer, Security Guard), and day-by-day weekly itinerary tables.
* **Print Optimization:** Formatted with `@media print` rules in `src/index.css` to hide headers, sidebars, and buttons, producing a clean, black-and-white, border-aligned document for physical archival.

---

#### 10. Fleet Availability & Timeline Calendar (`P-21`)
* **Component:** [`AvailabilityCalendar.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/availability/AvailabilityCalendar.tsx)
* **Trigger:** Workspace tab `activeTab === 'availability'`
* **Operational Purpose:** Visual timeline displaying all corporate vehicles across a selected 7-day calendar window.
* **Features:**
  * Displays color-coded trip blocks indicating assigned trips (`status: ASSIGNED` in blue, `IN_PROGRESS` in emerald, `COMPLETED` in slate).
  * Allows employees to inspect fleet availability before submitting requests.
  * Allows logistics officers to identify idle vehicle windows and schedule maintenance intervals without disrupting corporate operations.

---

#### 11. Reports & Operational Hub (`P-26`)
* **Component:** [`ReportsHubView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/reports/ReportsHubView.tsx)
* **Trigger:** Workspace tab `activeTab === 'reports'`
* **Operational Purpose:** Analytical reporting center displaying operational fleet metrics, vehicle utilization rates, trip status distributions, and fuel consumption trends.
* **CSV Export Capabilities:** Integrated with [`csvExport.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/csvExport.ts). Allows logistics officers and finance auditors to export complete datasets into standardized `.csv` files:
  * Export Bookings Ledger (`bookings_report_*.csv`)
  * Export Fleet Inventory (`vehicles_report_*.csv`)
  * Export Maintenance & Defect Log (`maintenance_report_*.csv`)
  * Export Fuel Audit Trail (`fuel_records_*.csv`)

---

#### 12. Immutable System Audit Logs (`P-31`)
* **Component:** [`AuditLogsView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/AuditLogsView.tsx)
* **Trigger:** Workspace tab `activeTab === 'audit-logs'`
* **Operational Purpose:** Displays an unalterable operational audit trail recording every significant system event (e.g., `BOOKING_CREATED`, `BOOKING_APPROVED`, `VEHICLE_ASSIGNED`, `TRIP_STARTED`, `TRIP_COMPLETED`, `BOOKING_CANCELLED`).
* **Data Rendered:** Action timestamp in Addis Ababa time, Performing User, Entity Type, Entity Reference, Action Category, and JSON metadata changes.

---

### Implementation Status Summary

All 31 views and modal dialogs documented above are **fully implemented in TypeScript/React** and compile with zero errors (`tsc && vite build` exit code 0). The operational workflows have been validated against the live backend API.
