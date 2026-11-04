# Employee & Department Management Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/02-employee-department-management`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Manages enterprise organizational units, staff directory, role assignments (Employee, Driver, Logistics Admin, System Admin), and user profile self-service.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/admin)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/users)
- **Database Entities:** `User`, `Department` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | `LOGISTICS_ADMIN, SYSTEM_ADMIN` | Retrieves staff directory with department relationships. |
| `POST` | `/api/users` | `SYSTEM_ADMIN` | Onboards new employee with auto-generated credentials. |
| `GET` | `/api/users/profile/me` | `Authenticated` | Retrieves current user profile. |
| `PATCH` | `/api/users/profile/me` | `Authenticated` | Self-service updates to phone, job title, and avatar. |
| `GET` | `/api/departments` | `Authenticated` | Lists all organizational departments with staff counts. |
| `POST` | `/api/departments` | `SYSTEM_ADMIN` | Creates a new organizational department. |
| `PATCH` | `/api/departments/:id` | `SYSTEM_ADMIN` | Updates department name, code, or description. |
| `DELETE` | `/api/departments/:id` | `SYSTEM_ADMIN` | Deletes department (guarded: blocked if active staff assigned). |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `User`, `Department`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How is data integrity preserved when deleting a department?
**A:** The `DepartmentsService.remove()` method inspects `_count.users`. If any active employee is assigned, a `BadRequestException` is thrown to prevent orphaned user records.

#### Q: How are unique employee IDs enforced?
**A:** Prisma schema specifies `@unique` on `employeeId`. The service performs a pre-flight duplicate check against both email and employee ID, throwing `ConflictException` on collisions.
