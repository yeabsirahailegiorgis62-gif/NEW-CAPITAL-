# Capital Fleet — Frontend Documentation

## 1. Technology stack (what is actually used)

| Technology | Where | Role in this project |
| --- | --- | --- |
| React 18 | `apps/web` | UI components and state |
| TypeScript | `apps/web/tsconfig.json` | Static types for props and API JSON |
| Vite 5 | `apps/web/vite.config.ts` | Dev server port 5173, production bundler, `/api` proxy |
| Tailwind CSS | `apps/web` + `index.css` | Utility styling and `dark:` variants |
| `fetch` via `ApiClient` | `src/lib/api.ts` | All REST calls |
| lucide-react | icons | UI icons |
| date-fns | date helpers | formatting |
| qrcode | receipts / verify | QR generation |
| sessionStorage | `ApiClient` | JWT storage (`capital_fleet_token`) |
| localStorage | `ThemeContext` | `capital_fleet_theme` |

Declared but not the primary data layer: `@tanstack/react-query` is a dependency; screens load data with `api.*` and React `useState`/`useEffect`.

There is **no Redux, no React Router, no Axios**.

## 2. Directory map

```
apps/web/src/
├── main.tsx                 Mount + providers
├── App.tsx                  Session, “routing”, workflow handlers
├── index.css                Tailwind
├── types/index.ts           TypeScript models matching API JSON
├── lib/api.ts               ApiClient
├── lib/utils.ts             cn(), Ethiopian date helpers
├── lib/csvExport.ts         Report CSV
├── lib/imageUtils.ts        Avatar/photo helpers
├── context/ThemeContext.tsx Light/dark
├── pages/
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   └── PublicVerificationPage.tsx
├── components/
│   ├── layout/              AppShell, Sidebar, Navbar, ProfileModal
│   ├── ui/                  Button, Input, Modal, Toast, Card, …
│   ├── notifications/
│   ├── loading/
│   ├── automotive/          visual sections
│   └── telematics/          decorative route simulation
└── features/
    ├── auth/                ForgotPasswordModal
    ├── dashboard/           Employee, Logistics, Driver, Admin
    ├── bookings/            form, table, details, receipt, cancel, print, verify
    ├── logistics/           ReviewRequestsQueue, AssignVehicleModal, TripExecutionModal
    ├── vehicles/            inventory + VehicleModal
    ├── drivers/             DriversManagementView
    ├── availability/        AvailabilityCalendar
    ├── maintenance/         MaintenanceView
    ├── reports/             ReportsHubView
    ├── admin/               users, departments, settings, audit
    └── profile/             ProfileSettingsView
```

## 3. Application bootstrap

`main.tsx` wraps `App` with:

1. `ErrorBoundary` — class component catching render errors.
2. `ThemeProvider` — `document.documentElement` class `dark`.
3. `ToastProvider` — `useToast()` for success/error messages.

## 4. “Routing” as implemented in `App.tsx`

`App` holds:

- `currentView`: `'landing' | 'login' | 'workspace'`
- `activeTab`: string (`dashboard`, `new-booking`, `my-bookings`, `requests-queue`, `assign-queue`, `availability`, `vehicles`, `drivers`, `maintenance`, `reports`, `settings`, `departments`, `users`, `audit-logs`, `weekly-requests`, `profile-settings`)
- `currentUser: User | null`
- `bookings`, `notifications`
- modal targets (`selectedBookingForDetails`, `assigningBooking`, `tripModalBooking`, …)

**Conditional rendering:** if `verificationReference && isDirectScan` → `PublicVerificationPage`. Else landing, login, or workspace. Inside workspace, `{activeTab === 'dashboard' && (isDriver ? DriverDashboard : isEmployee ? EmployeeDashboard : isSystemAdmin ? AdminAnalyticsDashboard : LogisticsDashboard)}`.

**URL:** `?view=login` or path `/auth` opens login. `?tab=` persists the workspace tab. `?verify=` / `?ref=` opens public verification. `?receipt=` opens `DigitalReceiptModal`.

This is **client-side routing without a router library**.

## 5. State management

| Kind | Location | Example |
| --- | --- | --- |
| Session | `App` + `ApiClient.token` | `currentUser`, JWT |
| Shared lists | `App` | `bookings`, `notifications` |
| Screen-local | each feature `useState` | form fields in `BookingRequestForm` |
| Theme | `ThemeContext` | light/dark |
| Toasts | `ToastProvider` | `toast.success(...)` |

`refreshAllData()` in `App` calls `api.getNotifications()` and `api.getBookings()` in parallel.

`AppShell` polls notifications and calls `onNotificationsRefresh` so new unread items can toast.

**Optimistic UI:** `handleApproveBooking` / `handleRejectBooking` update local `bookings` status immediately, then call the API, then `refreshAllData()`. On failure they toast the error and refresh.

## 6. API integration

Class `ApiClient` (`export const api = new ApiClient()`):

- Restores token from `sessionStorage` in the constructor.
- `login` → `POST /api/auth/login` → `setToken(accessToken)`.
- `request()` sets `Content-Type: application/json` and Bearer header.
- Non-OK responses parse Nest’s `{ message }` (string or array) and `throw new Error(...)`.

Feature screens import `{ api } from '@/lib/api'`. Examples:

| UI | Method | Backend |
| --- | --- | --- |
| `App.handleLogin` | `api.login` | `POST /auth/login` |
| `BookingRequestForm` | `api.createBooking` | `POST /bookings` |
| `App.handleApproveBooking` | `api.approveBooking` | `POST /bookings/:id/approve` |
| `AssignVehicleModal` | `api.assignVehicle` / `autoAssignBooking` | `POST /bookings/:id/assign` |
| `TripExecutionModal` | `api.startTrip` / `completeTrip` | `POST /bookings/:id/start-trip` |
| `PublicVerificationPage` | `api.verifyBooking` | `GET /bookings/verify/:reference` |

## 7. Authentication and authorization on the client

**Authentication**

1. `LoginPage` collects identifier (email or employee ID) and password.
2. `onLoginSubmit` → `App.handleLogin` → `api.login`.
3. On success, `currentView = 'workspace'`.
4. On reload, `useEffect` in `App` calls `api.getProfile()` (`GET /auth/me`). Failure clears the token.

Password reset UI: `ForgotPasswordModal` → `api.forgotPassword` / `api.resetPassword`. Admin approve/reject lives in user admin views via `api.approveResetRequest` etc.

**Authorization (UI only)**

`Sidebar` filters tabs by `currentUser.role`. `App` sets `isEmployee`, `isDriver`, `isLogisticsAdmin`, `isSystemAdmin`, `canAssignVehicles`.

This is **not** security by itself. The API still returns 403 via `RolesGuard` if a user forges a request.

## 8. Important components and pages

### Pages

- **LandingPage** — marketing/home; `onSignInClick` → login view.
- **LoginPage** — form, theme toggle, opens `ForgotPasswordModal`.
- **PublicVerificationPage** — QR/public reference check without login.

### Layout

- **AppShell** — Navbar + Sidebar + children + notification drawer; polls `api.getNotifications()`.
- **Sidebar** — role-based `onTabChange(tabId)`.
- **Navbar** — user menu, theme, logout, notification bell.

### Bookings

- **BookingRequestForm** — daily/weekly request; local validation; `api.checkDuplicate`; `api.createBooking`.
- **BookingsTable** — list/history with cancel/receipt.
- **BookingDetailsModal** — full record; approve/reject/assign/start/complete depending on role and status.
- **CancelBookingModal** — reason + optional `bookingDayId` for weekly days.
- **DigitalReceiptModal** / **PrintableTransportFormModal** — receipt and printable form.
- **BookingVerificationModal** — in-app verify overlay.

### Logistics

- **ReviewRequestsQueue** — pending vs approved tabs; used for `requests-queue`, `assign-queue`, and `weekly-requests`.
- **AssignVehicleModal** — `getVehicleRecommendations`, `getDriverRecommendations`, then assign.
- **TripExecutionModal** — start/complete with odometer.

### Dashboards

- **EmployeeDashboard** — my trips, new booking CTA.
- **LogisticsDashboard** — `api.getLogisticsDashboardStats()` plus queues.
- **DriverDashboard** — assigned missions, start/complete, issues.
- **AdminAnalyticsDashboard** — system-admin overview.

### Admin / ops

- **UsersManagementView**, **AddEmployeeModal** — `POST/PATCH /users`, password reset admin APIs.
- **DepartmentsManagementView** — `/departments`.
- **SystemSettingsView** — `/settings` (policies used by `BookingsService.create`).
- **AuditLogsView** — `/audit-logs`.
- **VehicleInventoryView** / **VehicleModal** — fleet CRUD.
- **DriversManagementView** — chauffeur directory (users with `DRIVER` role).
- **MaintenanceView** — issues + maintenance + related fuel.
- **ReportsHubView** — operational reports/CSV.
- **ProfileSettingsView** / **ProfileModal** — `PATCH /users/profile/me`.

### UI primitives

`Button`, `Input` (error prop for form validation messages), `Modal`, `Card`, `Badge`, `Alert`, `Toast`, `SmartDropdown`, `BrandLogo`.

## 9. Forms, validation, events, responsive design

- **Form validation (client):** e.g. `BookingRequestForm.handleSubmit` checks destination/purpose/dates before `api.createBooking`. Server DTOs (`CreateBookingDto`) validate again.
- **Event handlers:** `onClick`/`onSubmit` functions such as `handleApproveBooking`, `handleSubmit`, `onTabChange`.
- **Conditional rendering:** role dashboards; action buttons only if `canAssignVehicles`; public vs authenticated verify.
- **Responsive design:** Tailwind breakpoints and `Sidebar` `isOpenMobile` / `onCloseMobile`. Layout is mobile-aware (hamburger in `Navbar`).

## 10. Styling

Tailwind utility classes. Dark mode: `ThemeContext` toggles class `dark` on `<html>`. Brand colour tokens appear as `brand-*` classes in several components.

## 11. Talking points for an examiner

- “The SPA is orchestrated by `App.tsx`; tabs are not React Router routes.”
- “All HTTP goes through one `ApiClient`; the Vite proxy avoids CORS during development.”
- “JWT is in sessionStorage, not localStorage, so closing the tab ends the session.”
- “Roles change which components mount; the NestJS `RolesGuard` is the real authorization.”
