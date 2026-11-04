# Driver Management & Chauffeur Portal Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/05-driver-management`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Manages certified chauffeurs, driving licenses, trip acceptance/decline workflows, daily assignments, and chauffeur mobile portal execution.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/drivers)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/users)
- **Database Entities:** `User`, `VehicleAssignment` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users?role=DRIVER` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Retrieves chauffeur roster with license status. |
| `GET` | `/api/vehicles/drivers/recommendations` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Returns ranked available drivers based on active workload. |
| `POST` | `/api/bookings/assignments/:id/confirm` | `DRIVER` | Driver accepts assigned trip dispatch. |
| `POST` | `/api/bookings/assignments/:id/decline` | `DRIVER` | Driver declines dispatch with mandatory decline reason. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `User`, `VehicleAssignment`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How does driver dispatch confirmation work?
**A:** When logistics assigns a driver, a `VehicleAssignment` is created with status `PENDING_CONFIRMATION`. The driver sees this on their DriverDashboard and must confirm or decline before trip commencement.

#### Q: How are driver licenses verified?
**A:** The User model enforces `licenseNumber` validation. Drivers with missing or expired credentials cannot be recommended by the auto-dispatch algorithm.
