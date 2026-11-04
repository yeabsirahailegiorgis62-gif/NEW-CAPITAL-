# In-App Notification & Alerts System Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/11-notification-system`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Dispatches asynchronous real-time inbox alerts to employees and drivers when bookings are approved, rejected, assigned, or rescheduled.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/components/notifications)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/notifications)
- **Database Entities:** `Notification` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | `Authenticated` | Fetches user in-app notifications sorted by timestamp. |
| `PATCH` | `/api/notifications/:id/read` | `Authenticated` | Marks an individual notification as read. |
| `POST` | `/api/notifications/read-all` | `Authenticated` | Marks all user unread notifications as read. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `Notification`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: When are notifications created?
**A:** Automatically inside `BookingsService` whenever booking status changes (`approve`, `reject`, `assign`, `cancel`) and inside `AuthService` on password reset requests.

#### Q: How is data retention managed?
**A:** Notifications are linked to recipient users with cascade deletes (`onDelete: Cascade`), ensuring clean cleanup if user accounts are purged.
