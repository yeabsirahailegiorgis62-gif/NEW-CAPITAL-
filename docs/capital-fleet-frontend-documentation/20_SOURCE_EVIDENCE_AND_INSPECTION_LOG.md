# 20 — Source Evidence and Inspection Log

This document provides an immutable, comprehensive log of all codebase inspections, source file audits, static type analysis, build executions, and automated test validations performed during the technical audit of the **Capital Fleet** application.

---

## 1. Repository and Inspection Metadata

- **Repository Root Path:** `/home/yeabsira-hailegiorgis/Documents/Capital Fleet`
- **Active Git Branch:** `main`
- **Git Commit Hash:** `62ada5d`
- **Initial Git Status:** Uncommitted changes and untracked validation scripts preserved in working directory.
- **Audit Date:** October 26, 2026
- **Auditor Role:** Senior Frontend Architect, Documentation Engineer, and UI/UX Auditor.
- **Scope Discipline:** **Zero application source code files, configurations, database migrations, or schemas were altered or modified during this documentation task.** All deliverables are strictly confined to `docs/capital-fleet-frontend-documentation/`.

---

## 2. Inventory of Inspected Source Files and Subsystems

### 2.1 Configuration and Tooling Files
| File Path | Purpose / Subsystem Inspected | Findings |
|---|---|---|
| [package.json](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/package.json) | Monorepo root package configuration | Verified npm workspaces (`apps/web`, `apps/api`), root build, lint, and test scripts. |
| [apps/web/package.json](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/package.json) | Frontend dependencies & scripts | React 18.2.0, Vite 5.1.6, TypeScript 5.2.2, Tailwind 3.4.1. Verified absence of unit test runner. |
| [apps/web/vite.config.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/vite.config.ts) | Build configuration & dev proxy | Port 5173, `@` path alias, `/api` proxy targeting `http://localhost:4100`. |
| [apps/web/tailwind.config.js](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/tailwind.config.js) | Design tokens & color system | `brand` (crimson red), `brandGreen`, `navy`, `status` color tokens, custom box shadows. |
| [apps/web/src/index.css](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/index.css) | Global stylesheet & animations | CSS custom variables, road animations, `@media (prefers-reduced-motion: reduce)`, custom scrollbars. |
| [docker-compose.yml](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/docker-compose.yml) | Database container definition | PostgreSQL 16 Alpine on port 5435, `TZ: Africa/Addis_Ababa`. |
| [start.sh](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/start.sh) | System boot and process coordinator | Builds API, starts backend on 4100, verifies health check, launches frontend on 5173. |

### 2.2 Core Application Architecture Files
| File Path | Responsibility | Findings |
|---|---|---|
| [apps/web/src/main.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/main.tsx) | Application DOM entry point | Mounts React root into `#root`, wraps with `ThemeProvider` and `ToastProvider`. |
| [apps/web/src/App.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx) | Root application component | 690 lines. Manages session token hydration, view routing, role predicates, and tab dispatch. |
| [apps/web/src/lib/api.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts) | HTTP API Client singleton | 525 lines. Implements 47 typed methods across Auth, Bookings, Vehicles, Maintenance, Users. |
| [apps/web/src/types/index.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/types/index.ts) | Master TypeScript type definitions | 422 lines. Exhaustive models (`User`, `Vehicle`, `Booking`, `VehicleAssignment`, `AuditLog`). |

### 2.3 UI Primitives & Automotive Components
- **Atomic Primitives (`apps/web/src/components/ui/`):**
  - `Button.tsx`: 6 variants, 3 sizes, loading spinners, ref forwarding.
  - `Card.tsx`: Compound card architecture.
  - `Badge.tsx`: 11 operational status types, pulsing live trip indicator.
  - `Input.tsx`: Form inputs with labels, icons, error text.
  - `Modal.tsx`: Portal dialog with stationary header, pinned footer, body scroll lock, Escape listener.
  - `SmartDropdown.tsx`: Automatic top/bottom collision flip, viewport height clamping.
  - `Toast.tsx`: Multi-type floating notification queue.
  - `Alert.tsx`: Banner alerts for warnings and errors.
  - `BrandLogo.tsx`: Corporate emblem SVG.
  - `ErrorBoundary.tsx`: React class lifecycle component catching rendering errors.
- **Layout Components (`apps/web/src/components/layout/`):**
  - `AppShell.tsx`: Responsive shell wrapper with mobile off-canvas drawer.
  - `Navbar.tsx`: Search shortcut (`Cmd+K`), notification polling, profile menu.
  - `Sidebar.tsx`: Role-filtered tab navigation.
  - `ProfileModal.tsx`: User profile inspection and password change.
- **Automotive & Telematics Components:**
  - `AutomotiveJourneySpine.tsx`: 5-step trip milestone visualizer.
  - `DynamicFleetRouteSimulation.tsx`: 50 KB telematics simulation along Addis Ababa corridors.
  - `AutomotiveLoadingScreen.tsx`: Tachometer gauge splash screen.
  - `NotificationDetailsModal.tsx`: Push event inspector.

### 2.4 Feature Modules & Pages
- `apps/web/src/features/bookings/`: `BookingRequestForm.tsx` (1,421 lines), `BookingsTable.tsx`, `BookingDetailsModal.tsx`, `CancelBookingModal.tsx`, `DigitalReceiptModal.tsx`, `BookingVerificationModal.tsx`, `PrintableTransportFormModal.tsx`.
- `apps/web/src/features/logistics/`: `ReviewRequestsQueue.tsx`, `AssignVehicleModal.tsx`, `TripExecutionModal.tsx`.
- `apps/web/src/features/dashboard/`: `EmployeeDashboard.tsx`, `LogisticsDashboard.tsx`, `DriverDashboard.tsx`, `AdminAnalyticsDashboard.tsx`.
- `apps/web/src/features/vehicles/`: `VehicleInventoryView.tsx`.
- `apps/web/src/features/drivers/`: `DriversManagementView.tsx`.
- `apps/web/src/features/maintenance/`: `MaintenanceView.tsx`.
- `apps/web/src/features/admin/`: `UsersManagementView.tsx`, `DepartmentsManagementView.tsx`, `SystemSettingsView.tsx`, `AuditLogsView.tsx`.
- `apps/web/src/features/reports/`: `ReportsHubView.tsx`.
- `apps/web/src/pages/`: `LoginPage.tsx`, `LandingPage.tsx`, `PublicVerificationPage.tsx` (625 lines), `DashboardPage.tsx`, `BookingsPage.tsx`, `NewRequestPage.tsx`, `ApprovalsPage.tsx`, `DispatchPage.tsx`, `VehiclesPage.tsx`, `DriversPage.tsx`, `DriverPortalPage.tsx`, `MaintenancePage.tsx`, `FuelManagementPage.tsx`, `UsersPage.tsx`, `DepartmentsPage.tsx`, `AuditLogsPage.tsx`, `ReportsPage.tsx`, `SettingsPage.tsx`, `GatePassPage.tsx`.

---

## 3. Log of Executed Commands and Verification Results

| Step | Executed Shell Command | Working Directory | Observed Exit Code | Key Evidence & Diagnostic Output |
|---|---|---|---|---|
| 1 | `git status --short` | Repo Root | 0 | Identified active branch `main`, commit `62ada5d`, clean baseline. |
| 2 | `npm run lint` | Repo Root | 0 | `tsc --noEmit` executed on both workspaces. **Zero compilation errors.** |
| 3 | `npm run build:web` | Repo Root | 0 | Vite transformed 1,612 modules in 2.21s. Output in `apps/web/dist/`. |
| 4 | `npm run test:api` | Repo Root | 0 | **35 of 35 Jest unit tests passed** (Auth, Bookings, Vehicles, Maintenance). |
| 5 | `node verify_workflows.js` | Repo Root | 0 | **37 of 37 integration checks passed** (Request, approve, assign, trip start/complete, cancel). |
| 6 | `node verify_e2e_workflow.js` | Repo Root | 0 | **32 of 32 validation checks passed** (QR verification, role enforcement, audit trail). |
| 7 | `curl -s http://localhost:4100/api/health` | Repo Root | 0 | Returned `{"status":"ok","database":"connected","timestamp":"..."}`. |
| 8 | `curl -s http://localhost:5173` | Repo Root | 0 | Returned HTTP 200 OK HTML payload with `#root`. |

---

## 4. Source Evidence Traceability Table

The table below links every major technical conclusion in this documentation package directly to verifiable repository source files:

| Claimed Feature / Behavior | Implementation Source File | Verifiable Symbol / Function |
|---|---|---|
| Single & Recurring Request Scheduling | [BookingRequestForm.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx) | `requestType`, `weeklyDaysSchedule`, `WEEKDAYS` |
| Pre-Flight Duplicate Collision Check | [apps/web/src/lib/api.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts#L276-L281) | `api.checkDuplicate` |
| Fleet Availability Window Check | [apps/web/src/lib/api.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts#L129-L148) | `api.getFleetAvailability` |
| Intelligent Vehicle Scoring Heuristic | [apps/web/src/lib/api.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts#L150-L156) | `api.getVehicleRecommendations` |
| 2D Vector QR Code Generation | [GatePassModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/GatePassModal.tsx) | `QRCode.toDataURL(verificationUrl)` |
| Unauthenticated Public Pass Verification | [PublicVerificationPage.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx#L180-L215) | `api.verifyBooking(reference)` |
| Gate Pass Isolation in Print Media | [PublicVerificationPage.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx#L183-L211) | `@media print { #public-pass-card { ... } }` |
| Dropdown Viewport Collision Prevention | [SmartDropdown.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/SmartDropdown.tsx#L34-L85) | `calculatePosition()`, `getBoundingClientRect()` |
| Session Token Isolation | [apps/web/src/lib/api.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts#L30-L41) | `sessionStorage.getItem('capital_fleet_token')` |
| Motion Sensitivity Compliance | [apps/web/src/index.css](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/index.css#L328-L337) | `@media (prefers-reduced-motion: reduce)` |

---

## 5. Audit Scope Boundaries and Limitations

1. **Physical Hardware Uplink:** Real-world GPS/OBD-II hardware tracking devices were not connected; the telematics corridor simulation was verified via client-side code analysis.
2. **Component Unit Tests:** Automated testing relied on TypeScript compile checks, Vite production build verification, and full-stack HTTP integration suites (`verify_workflows.js`), as no isolated unit test runner is installed in `apps/web`.
3. **No Code Modifications:** Consistent with task instructions, no bugs or gaps were patched during this documentation audit.
