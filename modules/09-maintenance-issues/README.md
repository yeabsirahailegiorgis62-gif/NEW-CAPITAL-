# Maintenance & Vehicle Issues Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/09-maintenance-issues`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Oversees preventive workshop servicing schedules, maintenance cost accounting, and driver/employee defect reporting with photo attachments.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/maintenance)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/maintenance)
- **Database Entities:** `VehicleMaintenance`, `VehicleIssue` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/maintenance` | `Authenticated` | Lists scheduled and historical vehicle maintenance jobs. |
| `POST` | `/api/maintenance` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Schedules a preventive service or repair with cost estimates. |
| `PATCH` | `/api/maintenance/:id` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Updates service status (SCHEDULED, IN_PROGRESS, COMPLETED). |
| `GET` | `/api/vehicle-issues` | `Authenticated` | Retrieves defect reports with severity triage (LOW to CRITICAL). |
| `POST` | `/api/vehicle-issues` | `Authenticated` | Reports a new vehicle defect with odometer and optional photo URL. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `VehicleMaintenance`, `VehicleIssue`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How does a critical issue affect vehicle scheduling?
**A:** When a `CRITICAL` issue is reported with `immediateSafetyConcern = true`, the service flags `hasSafetyAlert = true` on the vehicle, preventing it from being auto-assigned to future bookings.

#### Q: How are maintenance intervals tracked?
**A:** The service checks vehicle odometer against `nextMaintenanceOdometer` and service dates against `nextMaintenanceDate` to alert logistics officers 30 days or 1,000 km in advance.
