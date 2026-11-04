# Capital Real Estate Fleet Management System
## Deliverable 01: Frontend System Overview & Operational Context

---

### Executive Summary & Academic Context

This technical document provides an exhaustive, evidence-based architectural and operational overview of the **Capital Real Estate Fleet Management System** frontend application (`apps/web`). Developed as part of a university internship project in Information Systems and Software Engineering, this web application serves as the primary operational hub for coordinating corporate transportation requests, fleet vehicle allocations, chauffeur assignments, dispatch gate clearances, and executive audit oversight for Capital Real Estate's corporate headquarters and regional construction projects in Addis Ababa, Ethiopia.

This report documents the **actual frontend implementation** currently present in the codebase. Every component, interface, service call, and workflow documented herein is directly verifiable against the source code in `apps/web/src/` and its backend counterpart in `apps/api/src/`.

---

### 1. Business Context & Problem Statement

#### 1.1 Organizational Background
**Capital Real Estate** is a major Ethiopian real estate development enterprise managing extensive multi-site operations across Addis Ababa, including corporate offices (Bole Tower HQ), regional development centers, project sites (CMC, Ayat, Lebu, Kazanchis), and municipal liaison facilities. To maintain day-to-day operations, project managers, civil engineers, quantity surveyors, marketing teams, and executive leadership require reliable, timely, and secure road transportation.

#### 1.2 Operational Problem
Prior to the implementation of the Capital Fleet Management System, transportation requests were handled through informal, fragmented, and paper-based channels (phone calls, Telegram messages, and manual memo forms). This legacy approach suffered from severe operational deficiencies:

1. **Lack of Visibility and Schedule Conflicts:** Logistics officers had no centralized, real-time calendar showing which vehicles and drivers were committed, leading to severe double-booking of vehicles and chauffeur idle time.
2. **Approval Delays & Unaccounted Travel:** Transportation requests frequently proceeded without verifiable departmental authorization, resulting in unauthorized trips and fuel waste.
3. **Absence of Gate Clearance Protocols:** Security personnel at corporate dispatch gates had no reliable mechanism to verify whether a vehicle departing the headquarters had official logistical clearance.
4. **Mileage, Maintenance, and Fuel Leakage:** Chauffeurs had no streamlined mechanism to report vehicle return odometers, transit delays, or emerging mechanical faults, complicating fleet maintenance cycles and fuel reconciliation.
5. **Lack of Auditability:** Dispute resolution was impossible due to the absence of immutable digital logs documenting who requested, approved, and assigned each trip.

#### 1.3 System Solution & Purpose
The **Capital Real Estate Fleet Management System** solves these operational problems by providing an integrated, role-based Single Page Application (SPA) designed with a cockpit-inspired automotive user interface. The frontend orchestrates the complete vehicle lifecycle across four distinct operational personas, providing automated conflict prevention, QR-code-powered gate clearance passes, live fleet calendar visualizations, telemetry trip tracking, and digital maintenance logging.

---

### 2. Frontend Project Scope

The frontend system encompasses all user-facing interfaces, client-side state management, responsive presentation layers, and client-to-backend communication mechanisms. The specific scope of the frontend includes:

* **Authentication & Session Management:** Multi-role login interface, password recovery dialogs, JWT token storage in `sessionStorage`, profile settings, and authenticated session resumption.
* **Employee Self-Service Portal:** Interactive daily and weekly transportation request booking forms with automatic 24h/72h notice policy compliance, duplicate booking detection, and booking history tracking.
* **Logistics Operational Command Center:** Real-time queue for reviewing requests, one-click approvals, modal-based rejection with mandatory reason logging, smart vehicle recommendation matching, and automated chauffeur allocation.
* **Driver Mission Portal:** Dedicated cockpit for company chauffeurs to view active assignments, accept/decline missions, record trip departure odometer readings, mark checkpoint arrivals, report road transit delays, report vehicle mechanical defects, and complete trips with return telemetry.
* **Gate Security & Public Verification:** Publicly accessible, unauthenticated QR-code verification portal (`PublicVerificationPage.tsx`) allowing gate guards and checkpoint officers to scan digital passes and verify booking legitimacy in under 3 seconds.
* **Digital Documentation & Physical Vouchers:** Client-side generation of cryptographically linked QR code receipts (`DigitalReceiptModal.tsx`) and printable official transportation order forms (`PrintableTransportFormModal.tsx`) formatted with print stylesheets (`@media print`).
* **Fleet Asset & Maintenance Management:** Interactive catalog of corporate vehicles with operational status tracking (`ACTIVE`, `MAINTENANCE`, `OUT_OF_SERVICE`, `INACTIVE`), vehicle issue ticket reporting, and scheduled servicing records.
* **Executive Analytics & Administration:** Administrative dashboards featuring system-wide KPIs, staff user directory management, department hierarchy configuration, security policy configuration, and searchable system audit logs.

---

### 3. Frontend Technology Inventory

The frontend architecture was inspected directly from [`apps/web/package.json`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/package.json), [`apps/web/vite.config.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/vite.config.ts), and the `apps/web/src/` source tree. The confirmed technologies and their exact roles are cataloged below:

| Technology / Library | Version | Category | Purpose in Capital Fleet Frontend | Implementation Evidence |
|:---|:---|:---|:---|:---|
| **React** | `18.2.0` | Core Framework | Declarative component hierarchy, virtual DOM reconciliation, component lifecycle hooks (`useState`, `useEffect`, `useMemo`, `useRef`). | `apps/web/package.json:17` |
| **ReactDOM** | `18.2.0` | DOM Renderer | Root element mounting (`ReactDOM.createRoot`), modal portal rendering (`createPortal`). | `apps/web/src/main.tsx:9`, `DigitalReceiptModal.tsx:2` |
| **TypeScript** | `5.2.2` | Programming Language | Static type safety, strict interface declarations (`User`, `Booking`, `Vehicle`, `VehicleAssignment`), compile-time error prevention. | `apps/web/package.json:29`, `src/types/index.ts` |
| **Vite** | `5.1.6` | Build Tool & Bundler | Next-generation ESM development server with Hot Module Replacement (HMR), production Rollup bundling, and local proxy configuration. | `apps/web/package.json:30`, `vite.config.ts` |
| **Tailwind CSS** | `3.4.1` | Styling Framework | Utility-first CSS framework configured with corporate brand palette, dark mode classes, glassmorphism filters, and responsive breakpoints. | `apps/web/tailwind.config.js`, `src/index.css` |
| **PostCSS** | `8.4.38` | CSS Processing | CSS transformation pipeline enabling vendor prefixing and Tailwind nesting. | `apps/web/package.json:27` |
| **Autoprefixer** | `10.4.19` | CSS Tooling | Automatically applies CSS vendor prefixes to maximize cross-browser compatibility. | `apps/web/package.json:26` |
| **Lucide React** | `0.359.0` | Iconography | High-consistency SVG iconography across all dashboards, status badges, buttons, and cockpit telemetry indicators. | `apps/web/package.json:15` |
| **QRCode** | `1.5.4` | QR Code Engine | Client-side generation of high-density QR code Data URLs (`QRCode.toDataURL`) with Level 'H' error correction for digital gate passes. | `apps/web/package.json:16`, `DigitalReceiptModal.tsx:56` |
| **date-fns** | `3.6.0` | Date Utilities | Robust manipulation and arithmetic of ISO 8601 date strings. | `apps/web/package.json:14` |
| **clsx & tailwind-merge**| `2.1.0` / `2.2.2` | CSS Utilities | Dynamic class name resolution and conditional styling utility (`cn()` in `src/lib/utils.ts`). | `apps/web/src/lib/utils.ts:4-6` |
| **Custom Fetch API Wrapper** | Native | HTTP / Network Client | Singleton `ApiClient` in `src/lib/api.ts` providing typed REST requests, automatic JWT Bearer injection, and unified error handling. | `apps/web/src/lib/api.ts:26-77` |
| **React Context API** | Built-in | State Management | Global UI state management for dark/light themes (`ThemeContext.tsx`) and dynamic system toasts (`Toast.tsx`). | `src/context/ThemeContext.tsx`, `src/components/ui/Toast.tsx` |

#### Architectural Classification

```mermaid
graph TD
    subgraph Client Application [Client Layer: Browser SPA]
        React[React 18.2.0 Core]
        TS[TypeScript 5.2.2 Types]
        Tailwind[Tailwind CSS 3.4.1 Engine]
        Lucide[Lucide Icons]
        QR[QRCode Generator]
    end

    subgraph State & Networking [Data & Service Layer]
        Context[Theme & Toast Contexts]
        LocalState[Component State: useState / useMemo]
        ApiClient[Singleton ApiClient fetch wrapper]
    end

    subgraph Build & Development [Tooling Layer]
        Vite[Vite 5.1.6 Bundler]
        PostCSS[PostCSS & Autoprefixer]
    end

    subgraph Backend Server [API Layer: NestJS on Port 4100]
        Proxy[Vite Dev Server Proxy: /api]
        NestAPI[NestJS Modular API Engine]
        Postgres[(PostgreSQL 16 Database)]
    end

    Client Application --> State & Networking
    State & Networking --> ApiClient
    ApiClient -->|HTTP JSON Requests with Bearer JWT| Proxy
    Proxy -->|Local Forwarding| NestAPI
    NestAPI --> Postgres
    Build & Development -.->|Compiles & Bundles| Client Application
```

---

### 4. User Roles & Access Control Model

Inspection of [`apps/web/src/types/index.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/types/index.ts) (line 1) and [`apps/web/src/components/layout/Sidebar.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/Sidebar.tsx) (lines 50–91) confirms that the frontend supports **four distinct user roles**:

```typescript
export type UserRole = 'EMPLOYEE' | 'DRIVER' | 'LOGISTICS_ADMIN' | 'SYSTEM_ADMIN';
```

Each confirmed user role is documented below with its verified frontend boundaries:

#### 4.1 Employee (`EMPLOYEE`)
* **Operational Purpose:** Corporate staff members who need road transport to attend business meetings, client visits, municipal agencies, or ongoing construction sites.
* **Dedicated Dashboard:** [`EmployeeDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/EmployeeDashboard.tsx). Displays an overview of personal active bookings, total trips taken, quick-action request shortcuts, and a vehicle availability radar widget.
* **Accessible Navigation Items:**
  1. `dashboard` (`My Dashboard`)
  2. `new-booking` (`Book a Vehicle`)
  3. `my-bookings` (`My Bookings` & history table)
  4. `availability` (`Fleet Calendar`)
  5. `profile-settings` (`Profile Settings`)
* **Authorized Actions:** Submit daily and weekly booking requests; check duplicate travel requests; cancel pending or approved personal bookings; view and print digital trip receipts; copy booking references; update personal phone number and avatar.
* **Restricted Features:** Cannot review or approve bookings, cannot assign vehicles or chauffeurs, cannot view other employees' travel details, cannot access maintenance or administrative settings.
* **Frontend Access Control:** Enforced conditionally in `App.tsx` (lines 340, 385–392, 431–445) and filtered navigation links in `Sidebar.tsx`.

#### 4.2 Driver / Chauffeur (`DRIVER`)
* **Operational Purpose:** Professional corporate drivers employed to operate fleet vehicles, transport staff safely, record mileage, and report vehicle condition.
* **Dedicated Dashboard:** [`DriverDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/DriverDashboard.tsx). Features an automotive instrument HUD showing assigned missions, current trip odometer logs, vehicle health, and active trip telemetry.
* **Accessible Navigation Items:**
  1. `dashboard` (`Driver Dashboard`)
  2. `availability` (`Fleet Calendar`)
  3. `profile-settings` (`Profile Settings`)
* **Authorized Actions:** View trips assigned specifically to the logged-in chauffeur; accept or decline trip assignments with reason logging; start assigned trips with departure odometer entry (`api.startTrip`); mark checkpoint arrivals; report transit delays (`api.reportDelay`); complete trips with return odometer and notes (`api.completeTrip`); report emerging mechanical vehicle defects (`api.reportIssue`); display digital passes for gate clearance.
* **Frontend Access Control:** Isolated through role checks (`isDriver = currentUser.role === 'DRIVER'`) in `App.tsx` (lines 376–384) and driver-specific sidebar links.

#### 4.3 Logistics Admin (`LOGISTICS_ADMIN`)
* **Operational Purpose:** Transport officers and dispatchers responsible for reviewing transportation requests, verifying departmental justifications, allocating suitable vehicles and available chauffeurs, handling cancellations, and managing fleet assets.
* **Dedicated Dashboard:** [`LogisticsDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/LogisticsDashboard.tsx). Features live statistics (Pending Approvals, Ready for Assignment, Dispatched Trips, Fleet Utilization Rate), quick action buttons, pending review cards, and active trip tables.
* **Accessible Navigation Items:**
  1. `dashboard` (`Dashboard Overview`)
  2. `requests-queue` (`Transport Requests Queue`)
  3. `assign-queue` (`Assign Vehicles Queue`)
  4. `weekly-requests` (`Weekly Requests Queue`)
  5. `availability` (`Schedule / Calendar`)
  6. `vehicles` (`Vehicles Inventory`)
  7. `maintenance` (`Maintenance & Issues`)
  8. `drivers` (`Chauffeur Registry`)
  9. `reports` (`Reports Hub`)
  10. `profile-settings` (`Profile Settings`)
* **Authorized Actions:** One-click booking approval (`api.approveBooking`); modal rejection with required justification (`api.rejectBooking`); smart vehicle and driver allocation with conflict detection (`api.assignVehicle`); automated auto-assignment (`api.autoAssignBooking`); operational cancellation (`api.cancelBooking`); fleet vehicle creation and editing; vehicle issue resolution; maintenance scheduling; CSV export of operational data.
* **Frontend Access Control:** `canAssignVehicles = isLogisticsAdmin || isSystemAdmin` in `App.tsx` (line 344).

#### 4.4 System Administrator (`SYSTEM_ADMIN`)
* **Operational Purpose:** IT systems administrators, executive directors, and compliance officers who require omniscient system control, user access provisioning, security configuration, and audit record oversight.
* **Dedicated Dashboard:** [`AdminAnalyticsDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/AdminAnalyticsDashboard.tsx). Features enterprise-grade executive analytics, fleet distribution bar charts, departmental consumption metrics, trip completion rates, and system health status.
* **Accessible Navigation Items:**
  1. `dashboard` (`Analytics & Command`)
  2. `users` (`Staff Directory & Provisioning`)
  3. `departments` (`Departments Hierarchy`)
  4. `drivers` (`Chauffeurs Registry`)
  5. `vehicles` (`Fleet Inventory`)
  6. `requests-queue` (`Review Requests`)
  7. `assign-queue` (`Assign Vehicles`)
  8. `reports` (`Reports & Analytics`)
  9. `settings` (`System & Security Settings`)
  10. `audit-logs` (`System Audit Logs`)
  11. `profile-settings` (`Profile Settings`)
* **Authorized Actions:** Complete management over users (create, edit, toggle active, reset passwords); department creation and budget assignment; configuration of system-wide security policies (password complexity, notice windows, lockout durations); inspection of immutable system audit trails; data purge operations in emergency maintenance.

---

### 5. Verified End-to-End Business Workflow

The complete transportation workflow was traced across the frontend source code, verified with integration tests (`verify_workflows.js` and `verify_e2e_workflow.js`), and tested against the live backend:

```mermaid
sequenceDiagram
    autonumber
    actor Employee as Staff Employee
    actor Logistics as Logistics Admin
    actor Driver as Assigned Chauffeur
    actor Guard as Security / Gate Officer
    participant Web as Web Frontend (React)
    participant API as Backend API (NestJS)
    participant DB as PostgreSQL Database

    %% Step 1: Request Submission
    Employee->>Web: Fills BookingRequestForm (Daily / Weekly)
    Web->>API: POST /api/bookings
    API->>DB: INSERT INTO bookings (Status: PENDING_APPROVAL)
    API-->>Web: Returns Booking Record with bookingReference (CR-2026-XXXX)
    Web-->>Employee: Displays Ticket Confirmation with live QR Code

    %% Step 2: Logistics Review & Approval
    Logistics->>Web: Navigates to ReviewRequestsQueue (tab: pending)
    Web->>API: GET /api/bookings?status=PENDING_APPROVAL
    API-->>Web: List of pending requests
    Logistics->>Web: Clicks "Approve" button
    Web->>API: POST /api/bookings/:id/approve
    API->>DB: UPDATE bookings SET status = 'APPROVED'
    API-->>Web: Updated booking record
    Web-->>Logistics: Toast notification; moved to Approved queue

    %% Step 3: Vehicle & Driver Assignment
    Logistics->>Web: Clicks "Assign Vehicle" on Approved booking
    Web->>API: GET /api/vehicles/recommendations/:id & /vehicles/driver-recommendations/:id
    API-->>Web: Ranked list of available vehicles & chauffeurs
    Logistics->>Web: Selects Vehicle + Chauffeur, submits assignment
    Web->>API: POST /api/bookings/:id/assign
    API->>DB: INSERT INTO assignments; UPDATE bookings SET status = 'ASSIGNED'
    API-->>Web: Returns VehicleAssignment record

    %% Step 4: Driver Notification & Mission Start
    Driver->>Web: Logs in; views DriverDashboard
    Web->>API: GET /api/bookings (Filtered to driver assignments)
    API-->>Web: Assigned mission details
    Driver->>Web: Clicks "Start Mission" & inputs Start Odometer
    Web->>API: POST /api/bookings/:id/start-trip
    API->>DB: UPDATE bookings SET status = 'IN_PROGRESS', startOdometer = XXX

    %% Step 5: Gate Clearance Verification
    Guard->>Web: Scans QR Code on Employee/Driver phone
    Web->>API: GET /api/bookings/verify/:reference
    API-->>Web: Returns BookingVerificationResult (VALID, Vehicle, Driver, Gate Pass)
    Web-->>Guard: Displays Green Security Clearance Card

    %% Step 6: Trip Completion & Telemetry
    Driver->>Web: Clicks "Complete Trip" & inputs Return Odometer + notes
    Web->>API: POST /api/bookings/:id/complete-trip
    API->>DB: UPDATE bookings SET status = 'COMPLETED', endOdometer = YYY
    API-->>Web: Closed booking record
    Web-->>Driver: Toast: "Trip record closed successfully"
```

#### Detailed Stage-by-Stage Verification:

1. **Stage 1 — Submission:** The employee completes the request in [`BookingRequestForm.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx). The frontend enforces required fields (`destination`, `purpose`, `passengerCount >= 1`, non-past departure, and `departure < return`). Upon submission, the API responds with a generated human-readable booking reference formatted as `CR-YYYY-XXXX` (e.g., `CR-2026-0042`) and status `PENDING_APPROVAL`.
2. **Stage 2 — Operational Review:** The Logistics Admin sees the request in [`ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx). If justified, the officer approves the request, which transitions status to `APPROVED`. If unjustified, the officer clicks Reject, providing a reason string transmitted via `POST /api/bookings/:id/reject`, transitioning status to `REJECTED`.
3. **Stage 3 — Resource Allocation:** From the `Approved` queue or dashboard, the officer opens [`AssignVehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx). The modal queries `api.getVehicleRecommendations(bookingId)` and `api.getDriverRecommendations(bookingId)`. Vehicles with active scheduling conflicts are flagged as unavailable with conflicting booking references shown in red. Once submitted via `POST /api/bookings/:id/assign`, status becomes `ASSIGNED`.
4. **Stage 4 — Chauffeur Mission Execution:** The assigned chauffeur logs in and accesses [`DriverDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/DriverDashboard.tsx). The chauffeur can start the trip, which prompts for the starting odometer reading, calling `POST /api/bookings/:id/start-trip` and setting status to `IN_PROGRESS`.
5. **Stage 5 — Gate Clearance:** Security guards scan the QR code using a mobile browser. The scan opens [`PublicVerificationPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx), which calls `GET /api/bookings/verify/:ref` without requiring authentication, validating driver identity, vehicle plate number, authorized passengers, and validity window.
6. **Stage 6 — Mission Closure:** Upon return to headquarters, the driver records the final odometer reading and mechanical condition in the trip completion dialog. The frontend calls `POST /api/bookings/:id/complete-trip`, transitioning status to `COMPLETED` and releasing the vehicle and driver back to the available pool.

---

### 6. Frontend / Backend Architecture & Contract

The frontend and backend interact as decoupled components within a unified monorepo:

* **Repository Layout:** Managed as an npm workspaces monorepo containing `apps/web` (Vite + React) and `apps/api` (NestJS + Prisma).
* **Communication Protocol:** JSON over HTTP REST.
* **Base URL & Development Proxy:** During local development, the frontend runs on port `5173`. `vite.config.ts` proxies all `/api` requests to the NestJS server running on port `4100`. In production builds, `/api` is served via reverse proxy (Nginx).
* **Authentication Contract:** Stateless JWT tokens. When a user submits credentials in `LoginPage.tsx`, the backend returns `{ accessToken: string, user: User }`. The client stores the token in browser `sessionStorage` under the key `capital_fleet_token`. Every subsequent request automatically attaches this token in the HTTP `Authorization` header as `Bearer <token>`.
* **Data Flow Architecture:** The frontend utilizes an optimistic update pattern for immediate UI responsiveness (e.g., in `handleApproveBooking` and `handleRejectBooking` in `App.tsx`), followed by a synchronization refresh via `refreshAllData()` to ensure client state matches the authoritative PostgreSQL database.

---

### 7. Document Identification & Authorship Reference

* **Project:** Capital Real Estate Fleet Management System
* **Module:** Frontend SPA (`apps/web`)
* **Document ID:** `01_FRONTEND_SYSTEM_OVERVIEW`
* **Version:** 1.0 (Audited Technical Release)
* **Audited Codebase Date:** October 2026
* **Target Audience:** University Internship Examination Board, Academic Advisors, and Technical Project Evaluators.
