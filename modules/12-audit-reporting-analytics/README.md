# Audit Trails & Executive Reporting Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/12-audit-reporting-analytics`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Maintains an immutable operational audit log of all system mutations and provides downloadable CSV reports and executive utilization dashboards.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/reports)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/audit)
- **Database Entities:** `AuditLog` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/audit-logs` | `SYSTEM_ADMIN` | Queries immutable audit trail with actor, entity, and JSON delta filters. |
| `GET` | `/api/bookings/stats` | `Authenticated` | Provides booking analytics for administrative charts. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `AuditLog`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: What does an audit log entry capture?
**A:** `actorId`, `actorName`, `action` (e.g. ASSIGN_VEHICLE), `entityType`, `entityId`, `previousValues` JSON, and `newValues` JSON, providing non-repudiation.

#### Q: Why is audit logging important for academic evaluation?
**A:** It demonstrates compliance with enterprise software auditing standards (traceability of changes, accountability of admin actions).
