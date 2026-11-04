# Authentication, Authorization & Security Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/01-authentication-security`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Provides JSON Web Token (JWT) stateless authentication, Passport strategy validation, role-based access control (RBAC), bcrypt password hashing, and administrative password reset workflows.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/auth)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/auth)
- **Database Entities:** `User`, `PasswordResetToken`, `PasswordResetRequest` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `Public` | Authenticates staff member via email/employeeId and password, returns JWT Bearer token. |
| `POST` | `/api/auth/forgot-password` | `Public` | Initiates password reset request, stores hashed token, sends email. |
| `POST` | `/api/auth/reset-password` | `Public` | Validates reset token and sets new bcrypt password hash. |
| `POST` | `/api/auth/change-password` | `Authenticated` | Allows logged-in user to change their password. |
| `GET` | `/api/auth/me` | `Authenticated` | Returns current authenticated user session details. |
| `POST` | `/api/auth/logout` | `Authenticated` | Invalidates client session and clears local credentials. |
| `GET` | `/api/auth/admin/reset-requests` | `SYSTEM_ADMIN` | Lists all pending/approved employee password reset requests. |
| `POST` | `/api/auth/admin/reset-requests/:id/approve` | `SYSTEM_ADMIN` | Approves reset request and dispatches temporary credentials. |
| `POST` | `/api/auth/admin/reset-requests/:id/reject` | `SYSTEM_ADMIN` | Rejects password reset request with audit trail reason. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `User`, `PasswordResetToken`, `PasswordResetRequest`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How does the system ensure passwords are never exposed?
**A:** Passwords are never stored in plaintext. They are salted and hashed using bcrypt with a work factor of 10. The backend explicitly strips `passwordHash` in service queries before returning user objects.

#### Q: How does Role-Based Access Control work?
**A:** The `@Roles(UserRole.X)` decorator attaches allowed metadata to routes. `RolesGuard` verifies the user's JWT payload `role` claim against required roles and throws `ForbiddenException` on violation.
