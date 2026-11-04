# Booking Lifecycle Management Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/03-booking-management`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Implements the core transport request lifecycle (creation, advance notice validation, approval, weekly recurrences, timeline tracking, and cancellation).

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/bookings)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/bookings)
- **Database Entities:** `Booking`, `BookingDay` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | `EMPLOYEE, SYSTEM_ADMIN` | Submits single-day or weekly recurring transport booking. |
| `GET` | `/api/bookings` | `Authenticated` | Lists bookings (employees see their own; admins see all). |
| `GET` | `/api/bookings/:id` | `Authenticated` | Retrieves detailed booking timeline, passengers, and assignment. |
| `POST` | `/api/bookings/:id/approve` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Approves pending booking request. |
| `POST` | `/api/bookings/:id/reject` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Rejects booking with formal rejection reason. |
| `POST` | `/api/bookings/:id/cancel` | `EMPLOYEE, LOGISTICS_ADMIN, SYSTEM_ADMIN` | Cancels booking with audit reason (guarded against active trips). |
| `GET` | `/api/bookings/stats` | `Authenticated` | Returns operational breakdown of bookings by status. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `Booking`, `BookingDay`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: What is the booking finite state machine?
**A:** PENDING_APPROVAL -> APPROVED -> ASSIGNED -> IN_PROGRESS -> COMPLETED. At any pre-trip stage, it can transition to CANCELLED or REJECTED.

#### Q: How do weekly recurring bookings work?
**A:** A parent `Booking` entity has 1:many `BookingDay` records. Each day specifies `dayOfWeek`, `tripDate`, and `timeSlot` (MORNING/AFTERNOON), enabling granular per-day vehicle allocations.
