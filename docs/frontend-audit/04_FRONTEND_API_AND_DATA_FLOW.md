# Capital Real Estate Fleet Management System
## Deliverable 04: Frontend API Integration & Data Flow Architecture

---

### 1. API Communication Protocol & Client Architecture

The **Capital Real Estate Fleet Management System** frontend connects to its backend via a structured RESTful JSON interface. All HTTP operations are encapsulated in the singleton `ApiClient` class defined in [`apps/web/src/lib/api.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts).

#### 1.1 Network Interception & Authorization Flow
1. **Endpoint Resolution:** Every request targets `/api/<endpoint>`. In local development, the Vite dev server proxy (`apps/web/vite.config.ts`) routes `/api` directly to `http://localhost:4100`. In production, a reverse proxy handles routing.
2. **Bearer Token Injection:** Before each HTTP dispatch, `ApiClient.request()` checks for an in-memory or `sessionStorage` token. If present, it attaches the header:
   ```http
   Authorization: Bearer <access_token>
   ```
3. **Response Interception & Error Extraction:** If `response.ok` is false, `ApiClient` parses the JSON error payload. If the backend returns a NestJS validation array (`errorData.message` as an array of strings), `ApiClient` concatenates them into a readable error message:
   ```typescript
   errorMessage = Array.isArray(errorData.message)
     ? errorData.message.join(', ')
     : errorData.message || errorMessage;
   ```
   This formatted message is thrown as a standard JavaScript `Error`, allowing calling components to catch it and display contextual alerts or toast messages.

---

### 2. Comprehensive API Endpoint Mapping Table

The following table documents every verified API call made by the frontend application, mapped directly from [`apps/web/src/lib/api.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts) to the corresponding NestJS backend controllers:

| Feature / Domain | Frontend Page / Component | Service Function in `api.ts` | API Endpoint | HTTP Method | Data Sent (Payload / Query) | Result / Response |
|:---|:---|:---|:---|:---:|:---|:---|
| **Auth: Sign In** | `LoginPage.tsx` | `api.login()` | `/api/auth/login` | `POST` | `{ identifier, password }` | `{ accessToken, user }` |
| **Auth: Current Profile** | `App.tsx` (Session check) | `api.getProfile()` | `/api/auth/me` | `GET` | *None (Bearer Token)* | Current `User` object |
| **Auth: Sign Out** | `Navbar.tsx`, `Sidebar.tsx` | `api.logout()` | `/api/auth/logout` | `POST` | *None* | `200 OK` (Token purged) |
| **Auth: Forgot Password** | `ForgotPasswordModal.tsx` | `api.forgotPassword()` | `/api/auth/forgot-password` | `POST` | `{ identifier }` | `{ success, message, resetToken }` |
| **Auth: Reset Password** | `ForgotPasswordModal.tsx` | `api.resetPassword()` | `/api/auth/reset-password` | `POST` | `{ token, newPassword }` | `{ success, message }` |
| **Auth: Change Password** | `ProfileSettingsView.tsx` | `api.changePassword()` | `/api/auth/change-password` | `POST` | `{ currentPassword, newPassword }` | `{ success, message }` |
| **Bookings: Submit** | `BookingRequestForm.tsx` | `api.createBooking()` | `/api/bookings` | `POST` | `{ destination, purpose, departureAt, expectedReturnAt, passengerCount, requestType, weeklyDays, ... }` | Newly created `Booking` record |
| **Bookings: List All** | `ReviewRequestsQueue`, `BookingsTable` | `api.getBookings()` | `/api/bookings` | `GET` | Optional: `?status=&search=&from=&to=` | Array of `Booking[]` |
| **Bookings: Single Details**| `BookingDetailsModal`, `DigitalReceiptModal` | `api.getBooking()` | `/api/bookings/:id` | `GET` | Booking UUID or Reference | Full `Booking` with assignments |
| **Bookings: Approve** | `ReviewRequestsQueue`, `BookingDetailsModal` | `api.approveBooking()` | `/api/bookings/:id/approve` | `POST` | *None* | Updated `Booking` (`APPROVED`) |
| **Bookings: Reject** | `ReviewRequestsQueue`, `BookingDetailsModal` | `api.rejectBooking()` | `/api/bookings/:id/reject` | `POST` | `{ rejectionReason }` | Updated `Booking` (`REJECTED`) |
| **Bookings: Cancel** | `CancelBookingModal.tsx` | `api.cancelBooking()` | `/api/bookings/:id/cancel` | `PATCH` | `{ reason, notes, bookingDayId }` | Updated `Booking` (`CANCELLED`) |
| **Bookings: Check Duplicate**| `BookingRequestForm.tsx` | `api.checkDuplicate()` | `/api/bookings/check-duplicate` | `POST` | `{ tripDate, destination, departureTime }` | `{ isDuplicate, matches[] }` |
| **Bookings: Public Verify** | `PublicVerificationPage.tsx` | `api.verifyBooking()` | `/api/bookings/verify/:ref` | `GET` | Human Reference (e.g. `CR-2026-0001`) | `BookingVerificationResult` |
| **Bookings: Token Verify** | `PublicVerificationPage.tsx` | `api.verifyTripToken()` | `/api/bookings/verify-token/:token` | `GET` | Cryptographic Token UUID | `BookingVerificationResult` |
| **Logistics: Stats** | `LogisticsDashboard.tsx` | `api.getLogisticsDashboardStats()` | `/api/bookings/stats` | `GET` | *None* | `LogisticsDashboardStats` |
| **Vehicles: List** | `VehicleInventoryView.tsx` | `api.getVehicles()` | `/api/vehicles` | `GET` | Optional: `?search=&category=&status=` | Array of `Vehicle[]` |
| **Vehicles: Details** | `VehicleInventoryView.tsx` | `api.getVehicle()` | `/api/vehicles/:id` | `GET` | Vehicle UUID | `Vehicle` with issues & assignments |
| **Vehicles: Create** | `VehicleModal.tsx` | `api.createVehicle()` | `/api/vehicles` | `POST` | `{ name, make, model, registrationNumber, category, capacity, ... }` | Created `Vehicle` record |
| **Vehicles: Update** | `VehicleModal.tsx` | `api.updateVehicle()` | `/api/vehicles/:id` | `PATCH` | Partial `Vehicle` data | Updated `Vehicle` record |
| **Vehicles: Availability** | `AssignVehicleModal`, `AvailabilityCalendar` | `api.getFleetAvailability()` | `/api/vehicles/availability` | `GET` | `?departureAt=&expectedReturnAt=&minCapacity=` | Availability list with conflict flags |
| **Vehicles: Recommendations**| `AssignVehicleModal.tsx` | `api.getVehicleRecommendations()` | `/api/vehicles/recommendations/:id` | `GET` | Booking UUID | Array of `VehicleRecommendation[]` |
| **Drivers: Recommendations** | `AssignVehicleModal.tsx` | `api.getDriverRecommendations()` | `/api/vehicles/driver-recommendations/:id` | `GET` | Booking UUID | Array of `DriverRecommendation[]` |
| **Assignment: Assign** | `AssignVehicleModal.tsx` | `api.assignVehicle()` | `/api/bookings/:id/assign` | `POST` | `{ vehicleId, driverId, driverName, driverPhone, assignmentNotes }` | Created `VehicleAssignment` |
| **Assignment: Auto-Assign** | `ReviewRequestsQueue.tsx` | `api.autoAssignBooking()` | `/api/bookings/:id/auto-assign` | `POST` | *None* | Created `VehicleAssignment` |
| **Assignment: Confirm** | `DriverDashboard.tsx` | `api.confirmAssignment()` | `/api/bookings/assignments/:id/confirm` | `POST` | *None* | Confirmed `VehicleAssignment` |
| **Assignment: Decline** | `DriverDashboard.tsx` | `api.declineAssignment()` | `/api/bookings/assignments/:id/decline` | `POST` | `{ reason }` | Declined `VehicleAssignment` |
| **Mission: Start Trip** | `DriverDashboard`, `TripExecutionModal` | `api.startTrip()` | `/api/bookings/:id/start-trip` | `POST` | `{ startOdometer, actualDepartureAt }` | Updated `Booking` (`IN_PROGRESS`) |
| **Mission: Mark Arrival** | `DriverDashboard.tsx` | `api.markArrival()` | `/api/bookings/:id/mark-arrival` | `POST` | *None* | Updated `Booking` record |
| **Mission: Report Delay** | `DriverDashboard.tsx` | `api.reportDelay()` | `/api/bookings/:id/report-delay` | `POST` | `{ reason }` | Updated `Booking` record |
| **Mission: Complete Trip**| `DriverDashboard`, `TripExecutionModal` | `api.completeTrip()` | `/api/bookings/:id/complete-trip` | `POST` | `{ endOdometer, actualReturnAt, tripNotes }` | Updated `Booking` (`COMPLETED`) |
| **Issues: List** | `MaintenanceView.tsx` | `api.getIssues()` | `/api/vehicle-issues` | `GET` | Optional: `?status=&vehicleId=` | Array of `VehicleIssue[]` |
| **Issues: Report** | `DriverDashboard`, `VehicleInventoryView` | `api.reportIssue()` | `/api/vehicle-issues` | `POST` | `{ vehicleId, description, severity, setMaintenanceStatus }` | `{ issue, maintenanceSet, affectedBookings }` |
| **Issues: Resolve** | `MaintenanceView.tsx` | `api.updateIssue()` | `/api/vehicle-issues/:id` | `PATCH` | `{ status, resolutionNotes }` | Updated `VehicleIssue` |
| **Maintenance: List** | `MaintenanceView.tsx` | `api.getMaintenance()` | `/api/maintenance` | `GET` | Optional: `?vehicleId=` | Array of `VehicleMaintenance[]` |
| **Maintenance: Create** | `MaintenanceView.tsx` | `api.createMaintenance()` | `/api/maintenance` | `POST` | Maintenance record payload | Created `VehicleMaintenance` |
| **Maintenance: Overview** | `MaintenanceView.tsx` | `api.getMaintenanceOverview()` | `/api/maintenance/overview` | `GET` | *None* | Maintenance stats overview |
| **Fuel: Records** | `ReportsHubView.tsx` | `api.getFuelRecords()` | `/api/fuel` | `GET` | Optional: `?vehicleId=` | Array of `FuelRecord[]` |
| **Fuel: Statistics** | `ReportsHubView.tsx` | `api.getFuelStats()` | `/api/fuel/stats` | `GET` | *None* | `FuelStats` object |
| **Notifications: List** | `AppShell.tsx`, `Navbar.tsx` | `api.getNotifications()` | `/api/notifications` | `GET` | *None* | Array of `InAppNotification[]` |
| **Notifications: Read** | `Navbar.tsx`, `App.tsx` | `api.markNotificationRead()` | `/api/notifications/:id/read` | `PATCH` | *None* | Updated `InAppNotification` |
| **Notifications: Read All** | `Navbar.tsx` | `api.markAllNotificationsRead()` | `/api/notifications/read-all` | `POST` | *None* | `200 OK` |
| **Audit Logs: List** | `AuditLogsView.tsx` | `api.getAuditLogs()` | `/api/audit-logs` | `GET` | Optional: `?entityType=&entityId=` | Array of `AuditLog[]` |
| **Users: List Directory** | `UsersManagementView`, `DriversManagementView` | `api.getUsers()` | `/api/users` | `GET` | *None* | Array of `User[]` |
| **Users: Create Account** | `AddEmployeeModal.tsx` | `api.createUser()` | `/api/users` | `POST` | `{ name, email, password, role, employeeId, departmentId, phone }` | Created `User` record |
| **Users: Update Account** | `UsersManagementView.tsx` | `api.updateUser()` | `/api/users/:id` | `PATCH` | Partial `User` data | Updated `User` record |
| **Users: Self Profile** | `ProfileSettingsView`, `ProfileModal` | `api.updateOwnProfile()` | `/api/users/profile/me` | `PATCH` | `{ name, phone, avatarUrl, jobTitle }` | Updated `User` profile |
| **Departments: List** | `DepartmentsManagementView.tsx` | `api.getDepartments()` | `/api/departments` | `GET` | *None* | Array of `Department[]` |
| **Departments: Create** | `DepartmentsManagementView.tsx` | `api.createDepartment()` | `/api/departments` | `POST` | `{ name, code, description }` | Created `Department` |
| **Departments: Update** | `DepartmentsManagementView.tsx` | `api.updateDepartment()` | `/api/departments/:id` | `PATCH` | Partial `Department` data | Updated `Department` |
| **Departments: Delete** | `DepartmentsManagementView.tsx` | `api.deleteDepartment()` | `/api/departments/:id` | `DELETE` | *None* | `200 OK` |
| **Settings: Get Policies** | `SystemSettingsView.tsx` | `api.getSettings()` | `/api/settings` | `GET` | *None* | `SystemSettings` object |
| **Settings: Update** | `SystemSettingsView.tsx` | `api.updateSettings()` | `/api/settings` | `PATCH` | Partial `SystemSettings` | Updated `SystemSettings` |
| **Booking Days: Update** | `CancelBookingModal.tsx` | `api.updateBookingDay()` | `/api/bookings/days/:id` | `PATCH` | `{ status, vehicleId, driverId, notes }` | Updated `BookingDay` |

---

### 3. Detailed End-to-End Workflow Traces

#### 3.1 Trace 1: Authentication & Workspace Bootstrapping
```
User clicks "Sign In" on LoginPage.tsx
  └─> Triggers handleLogin(identifier, pass) in App.tsx
        └─> Invokes api.login(identifier, pass)
              └─> POST /api/auth/login with JSON body
                    ├─> On HTTP 200:
                    │     ├─> ApiClient.setToken(accessToken) -> saves in sessionStorage
                    │     ├─> setCurrentUser(res.user)
                    │     ├─> setCurrentView('workspace')
                    │     ├─> setActiveTab('dashboard')
                    │     ├─> Promise.all([api.getNotifications(), api.getBookings()])
                    │     └─> Renders AppShell with user name and role
                    └─> On HTTP 401 / 500:
                          └─> Throws Error("Invalid credentials or account inactive")
                                └─> Catches in LoginPage.tsx -> renders Alert banner
```

#### 3.2 Trace 2: Transportation Request Submission
```
Employee fills BookingRequestForm.tsx and clicks "Submit Request"
  └─> Validates inputs (destination, purpose, passengerCount >= 1, non-past dates)
        └─> Constructs ISO strings (Africa/Addis_Ababa adjusted)
              └─> Invokes api.createBooking(payload)
                    └─> POST /api/bookings (Bearer JWT)
                          ├─> NestJS BookingsController -> BookingsService.create()
                          │     ├─> Generates reference "CR-2026-XXXX"
                          │     ├─> Writes to PostgreSQL (Status: PENDING_APPROVAL)
                          │     └─> Emits notification to Logistics Admins
                          └─> Frontend receives 201 Created + Booking object
                                ├─> toast.success("Request submitted!", "Booking CR-2026-XXXX is pending...")
                                ├─> setSubmittedBooking(booking)
                                ├─> Generates QR Code DataURL via QRCode.toDataURL()
                                ├─> Calls refreshAllData() in background
                                └─> Renders post-submission ticket voucher card
```

#### 3.3 Trace 3: Logistics Review & Vehicle Assignment
```
Logistics Officer navigates to "Review Requests Queue" (activeTab: 'requests-queue')
  └─> ReviewRequestsQueue.tsx mounts -> fetches bookings via api.getBookings()
        ├─> Officer clicks "Approve":
        │     ├─> Optimistic update: booking.status = 'APPROVED'
        │     ├─> api.approveBooking(id) -> POST /api/bookings/:id/approve
        │     ├─> toast.success("Booking approved", "Moved to Approved queue")
        │     └─> refreshAllData() updates state
        │
        └─> Officer clicks "Assign Vehicle":
              ├─> Opens AssignVehicleModal.tsx with booking prop
              ├─> In parallel fetches:
              │     ├─> api.getVehicleRecommendations(booking.id)
              │     └─> api.getDriverRecommendations(booking.id)
              ├─> Renders scored cards; unavailable vehicles flagged with conflict references
              ├─> Officer selects vehicle + chauffeur and clicks "Confirm Assignment"
              ├─> api.assignVehicle(booking.id, payload) -> POST /api/bookings/:id/assign
              ├─> NestJS creates Assignment record & updates Booking status to 'ASSIGNED'
              ├─> Modal closes, toast.success("Vehicle assigned!")
              └─> refreshAllData() cascades updated status across dashboard and queue
```

#### 3.4 Trace 4: Driver Mission Execution & Telemetry
```
Chauffeur logs in -> lands on DriverDashboard.tsx
  └─> System filters driverBookings where assignment.driverId === currentUser.id
        ├─> Driver accepts mission: api.confirmAssignment(assignmentId)
        ├─> Departure time arrives -> Driver clicks "Start Mission":
        │     ├─> Opens start dialog -> enters starting odometer (e.g., 45,210 km)
        │     ├─> api.startTrip(booking.id, { startOdometer }) -> POST /api/bookings/:id/start-trip
        │     ├─> Booking status transitions to 'IN_PROGRESS'
        │     └─> Dashboard card transitions to active route telematics view
        │
        ├─> Mid-transit checkpoint: Driver clicks "Mark Arrival" -> api.markArrival(id)
        │
        └─> Mission complete -> Driver clicks "Complete Trip":
              ├─> Enters return odometer (e.g., 45,285 km) + trip notes
              ├─> api.completeTrip(booking.id, payload) -> POST /api/bookings/:id/complete-trip
              ├─> Booking status transitions to 'COMPLETED'
              ├─> Associated vehicle & driver are immediately released to available fleet pool
              └─> Toast: "Trip record closed successfully"
```

#### 3.5 Trace 5: Public Gate Security Pass Verification
```
Security Guard scans QR code on phone or physical voucher at Bole Tower Gate 1
  └─> Mobile browser opens URL: https://fleet.capitalrealestate.et/?verify=CR-2026-0042
        └─> App.tsx detects query parameter 'verify'
              └─> Immediately mounts PublicVerificationPage.tsx (No authentication required)
                    └─> api.verifyBooking("CR-2026-0042") -> GET /api/bookings/verify/CR-2026-0042
                          ├─> NestJS BookingsService.verify() queries database:
                          │     ├─> Checks if booking exists & is in authorized status (ASSIGNED or IN_PROGRESS)
                          │     ├─> Extracts vehicle registration, chauffeur identity, travel window
                          │     └─> Returns BookingVerificationResult JSON
                          └─> Frontend renders Emerald Security Card:
                                ├─> "OFFICIAL DISPATCH CLEARANCE GRANTED"
                                ├─> Plate Number: ET-3-A1234
                                ├─> Chauffeur: Abebe Molla
                                ├─> Authorized Window: Today 08:30 - 17:00
                                └─> Guard approves gate passage
```

---

### 4. Error Propagation & Resilience Architecture

The frontend implements a multi-tiered resilience strategy:

1. **Client-Side Pre-Validation:** Forms validate required inputs and logical constraints (e.g., non-past departure dates, return time after departure, positive passenger numbers) before dispatching network requests, eliminating avoidable 400 Bad Request round-trips.
2. **Graceful Network Degradation:** In critical views (such as `AssignVehicleModal.tsx`), if the advanced AI recommendation endpoint fails or returns empty, the modal automatically falls back to standard availability checking (`api.getFleetAvailability`) without failing the UI.
3. **Optimistic UI Updates:** High-frequency operational actions (such as booking approval and rejection) update local React state immediately, providing instant visual feedback. If the backend subsequently returns an error, the error handler invokes `refreshAllData()` to roll back the UI to authoritative server state and displays an error toast.
4. **Top-Level Error Boundary:** The application root is wrapped in `<ErrorBoundary>`, preventing white-screen crashes in production if an unexpected rendering exception occurs.
