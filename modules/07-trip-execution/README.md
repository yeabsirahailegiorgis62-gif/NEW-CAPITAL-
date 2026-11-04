# Trip Execution & Fleet Telematics Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/07-trip-execution`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Tracks live trip lifecycle: departure departure odometer capture, destination arrival marking, delay reporting, return odometer logging, and interactive telematics simulation.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/logistics)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/bookings)
- **Database Entities:** `Booking` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings/:id/start-trip` | `DRIVER, LOGISTICS_ADMIN, SYSTEM_ADMIN` | Records departure timestamp and start odometer reading. |
| `POST` | `/api/bookings/:id/mark-arrival` | `DRIVER, LOGISTICS_ADMIN, SYSTEM_ADMIN` | Marks arrival at destination. |
| `POST` | `/api/bookings/:id/report-delay` | `DRIVER, LOGISTICS_ADMIN, SYSTEM_ADMIN` | Submits delay notification with explanatory reason. |
| `POST` | `/api/bookings/:id/complete-trip` | `DRIVER, LOGISTICS_ADMIN, SYSTEM_ADMIN` | Finalizes trip with end odometer reading and distance delta calculation. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `Booking`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How is mileage validated upon trip completion?
**A:** The backend validates that `endOdometer >= startOdometer`. The computed distance delta is added to the vehicle's cumulative mileage in PostgreSQL.

#### Q: Who can start and complete a trip?
**A:** Chauffeurs assigned to the trip, Logistics Admins, or System Admins. Normal employees cannot alter trip odometers.
