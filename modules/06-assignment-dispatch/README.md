# Vehicle & Driver Assignment & Dispatch Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/06-assignment-dispatch`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Provides intelligent recommendation scoring and automated or manual allocation of optimal vehicles and drivers to approved transport bookings.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/logistics)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/bookings)
- **Database Entities:** `VehicleAssignment`, `Booking`, `Vehicle`, `User` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings/:id/assign` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Manually assigns a specific vehicle and driver to a booking. |
| `POST` | `/api/bookings/:id/auto-assign` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Executes multi-criteria optimization to match best vehicle/driver. |
| `GET` | `/api/vehicles/recommendations/:bookingId` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Returns ranked vehicle recommendations matching passenger capacity and route requirements. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `VehicleAssignment`, `Booking`, `Vehicle`, `User`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: What criteria does the auto-assign algorithm use?
**A:** Vehicle capacity match (penalizing oversized empty vehicles), operational status (`ACTIVE`), absence of overlapping assignments, and driver workload balancing.

#### Q: Can assignments be reassigned or cancelled?
**A:** Yes, logistics officers can unassign or reassign prior to trip departure, automatically logging the change in `AuditLog`.
