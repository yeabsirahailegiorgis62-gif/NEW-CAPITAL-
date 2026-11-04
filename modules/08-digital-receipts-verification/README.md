# Digital Receipts & QR Verification Module

**Business Domain:** Capital Fleet Management System  
**Module Directory:** `modules/08-digital-receipts-verification`  
**Architecture Pattern:** Feature-First Business Domain Vertical  

---

## 1. Domain Responsibility & Overview
Generates cryptographically verifiable transport vouchers, PDF printable dispatch tickets, and public QR code verification screens for gate security.

---

## 2. Technical Component Locations

- **Frontend Feature Implementation:** [`frontend/`](../../apps/web/src/features/bookings)
- **Backend Service & Controller:** [`backend/`](../../apps/api/src/modules/bookings)
- **Database Entities:** `Booking` in `prisma/schema.prisma`

---

## 3. REST API Endpoints & Contracts

| Method | Endpoint | Permissions | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bookings/verify/:reference` | `Public` | Validates booking authenticity by reference code (e.g. BK-202611-001). |
| `GET` | `/api/bookings/verify-token/:token` | `Public` | Cryptographic token endpoint for QR code scans by security guards. |

---

## 4. Key Database Relationships & Integrity Rules

The module manages the following entities in PostgreSQL:
- `Booking`
- Foreign keys enforce relational referential integrity.
- Indexes optimize frequent lookup queries (e.g. status, dates, and foreign keys).

---

## 5. Evaluator & Academic Examination Guide

#### Q: How does public verification work without logging in?
**A:** The `/api/bookings/verify/*` endpoints are decorated with `@Public()`. When gate security scans the QR code on a paper or digital voucher, it loads `PublicVerificationPage` showing vehicle, driver, and validity status.

#### Q: How is forgery prevented?
**A:** Each verified booking generates a unique UUID-based `verificationToken` signed and stored on the booking record. Invalid tokens return verification failed.
