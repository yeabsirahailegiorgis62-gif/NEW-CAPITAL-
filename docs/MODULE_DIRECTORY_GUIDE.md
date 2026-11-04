# Capital Fleet — Module Directory Guide

**Document Version:** 2.0  
**Target:** Academic Evaluator & Software Engineering Navigation  
**Architecture:** Feature-First Modular Business Portals  

This guide provides the exact file locations for every business module implemented in the **Capital Fleet Management System**. Evaluators can locate the frontend component, backend controller, business logic service, database model, API endpoint, and automated test for any capability immediately.

---

## Complete Feature Matrix & File Navigator

### 1. Authentication, Authorization & Security Module
- **Business Purpose:** Stateless JWT issuance, role-based access control (RBAC), bcrypt salt hashing, password reset tokens, and admin reset approvals.
- **Frontend Component:** [`apps/web/src/pages/LoginPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/LoginPage.tsx), [`apps/web/src/features/auth/ForgotPasswordModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/auth/ForgotPasswordModal.tsx)
- **Backend Controller:** [`apps/api/src/modules/auth/auth.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/auth/auth.controller.ts)
- **Backend Service:** [`apps/api/src/modules/auth/auth.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/auth/auth.service.ts)
- **Email Service:** [`apps/api/src/modules/mail/mail.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/mail/mail.service.ts)
- **Data Transfer Objects (DTO):** [`apps/api/src/modules/auth/auth.dto.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/auth/auth.dto.ts)
- **Guards & Strategies:** [`apps/api/src/common/guards/jwt-auth.guard.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/common/guards/jwt-auth.guard.ts), [`apps/api/src/common/guards/roles.guard.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/common/guards/roles.guard.ts), [`apps/api/src/modules/auth/jwt.strategy.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/auth/jwt.strategy.ts)
- **Database Models:** `User`, `PasswordResetToken`, `PasswordResetRequest` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`apps/api/src/modules/auth/auth.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/auth/auth.service.spec.ts), [`test_password_reset_e2e.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/test_password_reset_e2e.ts)
- **Feature Portal:** [`modules/01-authentication-security/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/01-authentication-security/)

---

### 2. Employee & Department Management Module
- **Business Purpose:** Organizational structure hierarchy, staff onboarding, role assignment, and self-service profile management.
- **Frontend Components:**
  - Staff Directory: [`apps/web/src/features/admin/UsersManagementView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/UsersManagementView.tsx)
  - Onboard Employee: [`apps/web/src/features/admin/AddEmployeeModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/AddEmployeeModal.tsx)
  - Department Management: [`apps/web/src/features/admin/DepartmentsManagementView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/DepartmentsManagementView.tsx)
  - Profile Settings: [`apps/web/src/features/profile/ProfileSettingsView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/profile/ProfileSettingsView.tsx)
- **Backend Controllers:**
  - Users: [`apps/api/src/modules/users/users.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/users/users.controller.ts)
  - Departments: [`apps/api/src/modules/departments/departments.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/departments/departments.controller.ts)
- **Backend Services:**
  - Users: [`apps/api/src/modules/users/users.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/users/users.service.ts)
  - Departments: [`apps/api/src/modules/departments/departments.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/departments/departments.service.ts)
- **Database Models:** `User`, `Department` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`apps/api/src/modules/users/users.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/users/users.service.spec.ts), [`apps/api/src/modules/departments/departments.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/departments/departments.service.spec.ts)
- **Feature Portal:** [`modules/02-employee-department-management/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/02-employee-department-management/)

---

### 3. Booking Lifecycle Management Module
- **Business Purpose:** Submitting transport bookings (daily & weekly), minimum advance notice validation, approval, cancellation, and timeline history.
- **Frontend Components:**
  - Request Form: [`apps/web/src/features/bookings/BookingRequestForm.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx)
  - Bookings Table: [`apps/web/src/features/bookings/BookingsTable.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingsTable.tsx)
  - Details Modal: [`apps/web/src/features/bookings/BookingDetailsModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingDetailsModal.tsx)
  - Cancel Modal: [`apps/web/src/features/bookings/CancelBookingModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/CancelBookingModal.tsx)
  - Availability Calendar: [`apps/web/src/features/availability/AvailabilityCalendar.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/availability/AvailabilityCalendar.tsx)
- **Backend Controller:** [`apps/api/src/modules/bookings/bookings.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.controller.ts)
- **Backend Service:** [`apps/api/src/modules/bookings/bookings.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.service.ts)
- **DTOs:** [`apps/api/src/modules/bookings/bookings.dto.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.dto.ts)
- **Database Models:** `Booking`, `BookingDay` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`apps/api/src/modules/bookings/bookings.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.service.spec.ts)
- **Feature Portal:** [`modules/03-booking-management/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/03-booking-management/)

---

### 4. Vehicle Inventory & Fleet Module
- **Business Purpose:** Managing vehicle assets, license plates, seating capacities, odometer mileage, fuel types, and operational readiness.
- **Frontend Components:**
  - Inventory View: [`apps/web/src/features/vehicles/VehicleInventoryView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/vehicles/VehicleInventoryView.tsx)
  - Vehicle Modal: [`apps/web/src/features/vehicles/VehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/vehicles/VehicleModal.tsx)
- **Backend Controller:** [`apps/api/src/modules/vehicles/vehicles.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/vehicles/vehicles.controller.ts)
- **Backend Service:** [`apps/api/src/modules/vehicles/vehicles.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/vehicles/vehicles.service.ts)
- **DTOs:** [`apps/api/src/modules/vehicles/vehicles.dto.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/vehicles/vehicles.dto.ts)
- **Database Models:** `Vehicle` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`apps/api/src/modules/vehicles/vehicles.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/vehicles/vehicles.service.spec.ts)
- **Feature Portal:** [`modules/04-vehicle-management/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/04-vehicle-management/)

---

### 5. Driver Management & Portal Module
- **Business Purpose:** Chauffeur certification tracking, driving licenses, trip dispatch acceptance/decline, and dedicated mobile driver execution portal.
- **Frontend Components:**
  - Driver Roster: [`apps/web/src/features/drivers/DriversManagementView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/drivers/DriversManagementView.tsx)
  - Driver Dashboard: [`apps/web/src/features/dashboard/DriverDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/DriverDashboard.tsx)
- **Backend Logic:** Querying drivers with `role: DRIVER` in [`apps/api/src/modules/users/users.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/users/users.service.ts), driver recommendations in [`apps/api/src/modules/vehicles/vehicles.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/vehicles/vehicles.service.ts), assignment confirmation in [`apps/api/src/modules/bookings/bookings.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.service.ts).
- **Database Models:** `User` (`role: DRIVER`), `VehicleAssignment` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Integration Tests:** [`verify_workflows.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/verify_workflows.js)
- **Feature Portal:** [`modules/05-driver-management/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/05-driver-management/)

---

### 6. Vehicle & Driver Assignment & Dispatch Module
- **Business Purpose:** Logistics review queue, intelligent vehicle & chauffeur matching, multi-criteria auto-assignment, and dispatch management.
- **Frontend Components:**
  - Assignment Modal: [`apps/web/src/features/logistics/AssignVehicleModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx)
  - Review Queue: [`apps/web/src/features/logistics/ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx)
  - Logistics Dashboard: [`apps/web/src/features/dashboard/LogisticsDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/LogisticsDashboard.tsx)
- **Backend Service Logic:** [`apps/api/src/modules/bookings/bookings.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.service.ts) (`assignVehicle`, `autoAssignVehicle`), [`apps/api/src/modules/vehicles/vehicles.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/vehicles/vehicles.service.ts) (`getRecommendations`, `getDriverRecommendations`)
- **Database Models:** `VehicleAssignment`, `Booking`, `Vehicle`, `User` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`test_assign_cancel.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/test_assign_cancel.js), [`test_logistics_workflow.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/test_logistics_workflow.js)
- **Feature Portal:** [`modules/06-assignment-dispatch/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/06-assignment-dispatch/)

---

### 7. Trip Execution & Live Telematics Module
- **Business Purpose:** Trip departure odometer recording, destination arrival marking, delay reporting, return odometer delta validation, and route simulation.
- **Frontend Components:**
  - Trip Execution Modal: [`apps/web/src/features/logistics/TripExecutionModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/TripExecutionModal.tsx)
  - Route Telematics: [`apps/web/src/components/telematics/DynamicFleetRouteSimulation.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/telematics/DynamicFleetRouteSimulation.tsx)
  - Journey Spine: [`apps/web/src/components/automotive/AutomotiveJourneySpine.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/automotive/AutomotiveJourneySpine.tsx)
- **Backend Endpoints:** `POST /api/bookings/:id/start-trip`, `POST /api/bookings/:id/mark-arrival`, `POST /api/bookings/:id/report-delay`, `POST /api/bookings/:id/complete-trip` in [`apps/api/src/modules/bookings/bookings.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.controller.ts)
- **Database Fields:** `Booking.startOdometer`, `Booking.endOdometer`, `Booking.actualDepartureAt`, `Booking.actualReturnAt`, `Booking.delayReason` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`verify_e2e_workflow.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/verify_e2e_workflow.js)
- **Feature Portal:** [`modules/07-trip-execution/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/07-trip-execution/)

---

### 8. Digital Receipts & Public QR Verification Module
- **Business Purpose:** Issuing cryptographic electronic transport receipts, printable gate vouchers, and public QR code verification screens for security checkpoints.
- **Frontend Components:**
  - Digital Receipt: [`apps/web/src/features/bookings/DigitalReceiptModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/DigitalReceiptModal.tsx)
  - Verification Modal: [`apps/web/src/features/bookings/BookingVerificationModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingVerificationModal.tsx)
  - Printable Paper Voucher: [`apps/web/src/features/bookings/PrintableTransportFormModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/PrintableTransportFormModal.tsx)
  - Public Security Screen: [`apps/web/src/pages/PublicVerificationPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx)
- **Backend Endpoints:** `GET /api/bookings/verify/:reference`, `GET /api/bookings/verify-token/:token` in [`apps/api/src/modules/bookings/bookings.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.controller.ts)
- **Database Models:** `Booking` (`verificationToken`, `bookingReference`) in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`verify_e2e_workflow.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/verify_e2e_workflow.js)
- **Feature Portal:** [`modules/08-digital-receipts-verification/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/08-digital-receipts-verification/)

---

### 9. Maintenance & Vehicle Issues Module
- **Business Purpose:** Scheduled preventive servicing, cost auditing, odometer threshold tracking, and employee/chauffeur defect reporting with photo attachments.
- **Frontend Component:** [`apps/web/src/features/maintenance/MaintenanceView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/maintenance/MaintenanceView.tsx)
- **Backend Controllers:**
  - Maintenance: [`apps/api/src/modules/maintenance/maintenance.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/maintenance/maintenance.controller.ts)
  - Issues: [`apps/api/src/modules/issues/issues.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/issues/issues.controller.ts)
- **Backend Services:**
  - Maintenance: [`apps/api/src/modules/maintenance/maintenance.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/maintenance/maintenance.service.ts)
  - Issues: [`apps/api/src/modules/issues/issues.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/issues/issues.service.ts)
- **Database Models:** `VehicleMaintenance`, `VehicleIssue` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`apps/api/src/modules/maintenance/maintenance.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/maintenance/maintenance.service.spec.ts)
- **Feature Portal:** [`modules/09-maintenance-issues/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/09-maintenance-issues/)

---

### 10. Fuel Management & Refueling Expenses Module
- **Business Purpose:** Chauffeur mobile refueling logging, fuel station vouchers, cost per liter (ETB) tracking, and fleet fuel economy aggregation.
- **Frontend Components:** Refueling modal in [`apps/web/src/features/dashboard/DriverDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/DriverDashboard.tsx), Fuel analytics in [`apps/web/src/features/reports/ReportsHubView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/reports/ReportsHubView.tsx)
- **Backend Controller:** [`apps/api/src/modules/fuel/fuel.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/fuel/fuel.controller.ts)
- **Backend Service:** [`apps/api/src/modules/fuel/fuel.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/fuel/fuel.service.ts)
- **DTOs:** [`apps/api/src/modules/fuel/fuel.dto.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/fuel/fuel.dto.ts)
- **Database Models:** `FuelRecord` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Integration Tests:** [`verify_workflows.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/verify_workflows.js)
- **Feature Portal:** [`modules/10-fuel-management/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/10-fuel-management/)

---

### 11. In-App Notification & Alerts System Module
- **Business Purpose:** Event-driven in-app alerts for employees and drivers when transport requests are approved, rejected, assigned, or cancelled.
- **Frontend Components:** [`apps/web/src/components/notifications/NotificationDetailsModal.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/notifications/NotificationDetailsModal.tsx), [`apps/web/src/components/layout/Navbar.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/Navbar.tsx)
- **Backend Controller:** [`apps/api/src/modules/notifications/notifications.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/notifications/notifications.controller.ts)
- **Backend Service:** [`apps/api/src/modules/notifications/notifications.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/notifications/notifications.service.ts)
- **Database Models:** `Notification` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** Dispatched in [`apps/api/src/modules/bookings/bookings.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/bookings/bookings.service.spec.ts)
- **Feature Portal:** [`modules/11-notification-system/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/11-notification-system/)

---

### 12. Audit Trails & Executive Reporting Module
- **Business Purpose:** Non-repudiation audit trails for system mutations, downloadable CSV data reports, and executive analytics charts.
- **Frontend Components:**
  - Audit Trail Table: [`apps/web/src/features/admin/AuditLogsView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/AuditLogsView.tsx)
  - Reports Hub: [`apps/web/src/features/reports/ReportsHubView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/reports/ReportsHubView.tsx)
  - Analytics Dashboard: [`apps/web/src/features/dashboard/AdminAnalyticsDashboard.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/dashboard/AdminAnalyticsDashboard.tsx)
- **Backend Controller:** [`apps/api/src/modules/audit/audit.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/audit/audit.controller.ts)
- **Backend Service:** [`apps/api/src/modules/audit/audit.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/audit/audit.service.ts)
- **Database Models:** `AuditLog` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Integration Tests:** [`verify_workflows.js`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/verify_workflows.js)
- **Feature Portal:** [`modules/12-audit-reporting-analytics/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/12-audit-reporting-analytics/)

---

### 13. System Policies & Dynamic Configuration Module
- **Business Purpose:** Dynamic configuration of operating parameters (minimum notice hours, maintenance thresholds, auto-approval thresholds) and test data purging.
- **Frontend Component:** [`apps/web/src/features/admin/SystemSettingsView.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/SystemSettingsView.tsx)
- **Backend Controller:** [`apps/api/src/modules/settings/settings.controller.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/settings/settings.controller.ts)
- **Backend Service:** [`apps/api/src/modules/settings/settings.service.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/settings/settings.service.ts)
- **DTOs:** [`apps/api/src/modules/settings/settings.dto.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/settings/settings.dto.ts)
- **Database Models:** `SystemSetting` in [`prisma/schema.prisma`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/prisma/schema.prisma)
- **Automated Tests:** [`apps/api/src/modules/settings/settings.service.spec.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/api/src/modules/settings/settings.service.spec.ts)
- **Feature Portal:** [`modules/13-system-settings-policies/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/modules/13-system-settings-policies/)

