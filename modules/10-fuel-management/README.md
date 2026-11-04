# Fuel Management & Refueling Expenses Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/10-fuel-management`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Enables chauffeurs to record refueling transactions (odometer, fuel station, liters, unit price in ETB, and receipt vouchers), calculating fuel economy metrics.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/dashboard)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/fuel)
- **Database Entities:** `FuelRecord` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fuel` | `Authenticated` | Retrieves fuel logs filterable by vehicle and date range. |
| `POST` | `/api/fuel` | `DRIVER, LOGISTICS_ADMIN, SYSTEM_ADMIN` | Logs a refueling event with liters, unit price, and total cost. |
| `GET` | `/api/fuel/stats` | `Authenticated` | Calculates total fleet fuel spend, average cost per liter, and consumption trends. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `FuelRecord`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How is fuel efficiency calculated?
**A:** By comparing successive refueling odometer readings against liters dispensed ($\Delta 	ext{km} / 	ext{liters}$), providing kilometers-per-liter benchmarks per vehicle category.

#### Q: Why is driver attribution important for fuel?
**A:** Fuel logs record `driverId`, allowing the company to identify abnormal fuel consumption or audit expense claims against station receipts.
