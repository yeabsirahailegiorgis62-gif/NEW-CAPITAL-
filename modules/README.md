# Capital Fleet Management System — Business Domain Modules

Welcome to the **Feature-First Architecture** of Capital Fleet Management System.

Rather than organizing the codebase solely into technical layers (frontend, backend, database), the project is structured around the **13 core business capabilities** of the enterprise fleet operations.

---

## Business Domain Directory

| # | Business Domain Module | Primary Responsibilities | Key Entities | Frontend & Backend Links |
| :-: | :--- | :--- | :--- | :--- |
| **01** | [`01-authentication-security/`](./01-authentication-security/) | JWT authentication, RBAC authorization, password reset workflows. | `User`, `PasswordResetToken`, `PasswordResetRequest` | [Frontend](./01-authentication-security/frontend) \| [Backend](./01-authentication-security/backend) |
| **02** | [`02-employee-department-management/`](./02-employee-department-management/) | Staff directory, department organization, profile self-service. | `User`, `Department` | [Frontend](./02-employee-department-management/frontend) \| [Backend](./02-employee-department-management/backend) |
| **03** | [`03-booking-management/`](./03-booking-management/) | Single-day & weekly transport bookings, notice period validation. | `Booking`, `BookingDay` | [Frontend](./03-booking-management/frontend) \| [Backend](./03-booking-management/backend) |
| **04** | [`04-vehicle-management/`](./04-vehicle-management/) | Fleet inventory, vehicle status, registration, category capacity. | `Vehicle` | [Frontend](./04-vehicle-management/frontend) \| [Backend](./04-vehicle-management/backend) |
| **05** | [`05-driver-management/`](./05-driver-management/) | Chauffeur roster, license tracking, trip acceptance/decline, portal. | `User` (`role: DRIVER`), `VehicleAssignment` | [Frontend](./05-driver-management/frontend) \| [Backend](./05-driver-management/backend) |
| **06** | [`06-assignment-dispatch/`](./06-assignment-dispatch/) | Logistics request review, intelligent vehicle & driver allocation. | `VehicleAssignment`, `Booking`, `Vehicle` | [Frontend](./06-assignment-dispatch/frontend) \| [Backend](./06-assignment-dispatch/backend) |
| **07** | [`07-trip-execution/`](./07-trip-execution/) | Live departure odometer, delay reporting, return odometer, telematics. | `Booking` | [Frontend](./07-trip-execution/frontend) \| [Backend](./07-trip-execution/backend) |
| **08** | [`08-digital-receipts-verification/`](./08-digital-receipts-verification/) | Verifiable transport vouchers, PDF printing, public QR code audit. | `Booking` (`verificationToken`, `bookingReference`) | [Frontend](./08-digital-receipts-verification/frontend) \| [Backend](./08-digital-receipts-verification/backend) |
| **09** | [`09-maintenance-issues/`](./09-maintenance-issues/) | Workshop preventive maintenance, service costs, defect reporting. | `VehicleMaintenance`, `VehicleIssue` | [Frontend](./09-maintenance-issues/frontend) \| [Backend](./09-maintenance-issues/backend) |
| **10** | [`10-fuel-management/`](./10-fuel-management/) | Driver refueling expense logs, station receipts, consumption analytics. | `FuelRecord` | [Frontend](./10-fuel-management/frontend) \| [Backend](./10-fuel-management/backend) |
| **11** | [`11-notification-system/`](./11-notification-system/) | Asynchronous in-app alert notifications for booking approvals. | `Notification` | [Frontend](./11-notification-system/frontend) \| [Backend](./11-notification-system/backend) |
| **12** | [`12-audit-reporting-analytics/`](./12-audit-reporting-analytics/) | Immutable audit trails, CSV report export, executive analytics. | `AuditLog` | [Frontend](./12-audit-reporting-analytics/frontend) \| [Backend](./12-audit-reporting-analytics/backend) |
| **13** | [`13-system-settings-policies/`](./13-system-settings-policies/) | Dynamic system policies, notice thresholds, operational cleanup. | `SystemSetting` | [Frontend](./13-system-settings-policies/frontend) \| [Backend](./13-system-settings-policies/backend) |

---

## How to Navigate This Codebase for Academic Evaluation

1. **Pick a Feature:** Open any folder above (e.g. `modules/03-booking-management/`).
2. **Read the Architecture:** Open `README.md` to see business rules, API endpoints, and database models.
3. **Inspect the Implementation:**
   - Click `frontend` to view the React components, modals, and tables.
   - Click `backend` to view the NestJS controllers, services, DTOs, and unit tests.
4. **Inspect the Data Model:** View the entities in `prisma/schema.prisma` mapped in the guide.

