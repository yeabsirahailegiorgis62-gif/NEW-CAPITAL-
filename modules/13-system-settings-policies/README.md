# System Policies & Dynamic Configuration Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/13-system-settings-policies`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Allows administrators to dynamically configure business policies (e.g. minimum advance notice hours, auto-approval thresholds) without redeploying code.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/admin)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/settings)
- **Database Entities:** `SystemSetting` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/settings` | `Authenticated` | Reads current active system policies. |
| `PATCH` | `/api/settings` | `SYSTEM_ADMIN` | Updates operational thresholds (e.g. minimum notice hours). |
| `POST` | `/api/settings/danger/purge-operations` | `SYSTEM_ADMIN` | Secure administrative purge of test booking and assignment records. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `SystemSetting`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How does caching work in SettingsService?
**A:** `SettingsService` maintains an in-memory cache of policy key-value pairs to avoid querying PostgreSQL on every single booking creation request. Updates invalidate the cache immediately.

#### Q: How is the purge-operations endpoint protected?
**A:** Requires `SYSTEM_ADMIN` role plus password re-verification in the request payload to prevent accidental data loss.
