# Vehicle Fleet Inventory Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/04-vehicle-management`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Maintains physical vehicle assets, registration, category, seating capacity, odometer mileage, fuel levels, and operational statuses (Active, Maintenance, Out of Service).

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/vehicles)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/vehicles)
- **Database Entities:** `Vehicle` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vehicles` | `Authenticated` | Lists fleet inventory with category, status, and search filters. |
| `GET` | `/api/vehicles/:id` | `Authenticated` | Retrieves vehicle details, active assignments, and issue logs. |
| `POST` | `/api/vehicles` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Registers a new vehicle asset with unique registration number. |
| `PATCH` | `/api/vehicles/:id` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Updates vehicle specifications, status, or odometer. |
| `GET` | `/api/vehicles/availability` | `Authenticated` | Queries real-time vehicle availability across a departure/return window. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `Vehicle`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How does the system prevent double-booking a vehicle?
**A:** The `VehiclesService` queries active assignments overlapping with the requested departure and return timestamps. It accounts for both full-day and morning/afternoon slot intervals.

#### Q: How is operational status tracked?
**A:** Vehicles transition between `ACTIVE`, `MAINTENANCE`, `OUT_OF_SERVICE`, and `INACTIVE`. When an urgent issue or maintenance is active, availability algorithms automatically exclude the vehicle.
