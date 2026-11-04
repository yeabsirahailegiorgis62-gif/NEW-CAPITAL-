# Capital Fleet Management System — Security Review & Audit

**Document Version:** 1.0.0  
**Project:** Capital Real Estate Fleet Management System  
**Date:** October 26, 2026  
**Auditor:** Senior Application Security & Architecture Specialist  

---

## 1. Executive Summary

A comprehensive security review of the Capital Real Estate Fleet Management System was conducted across the backend API, database layer, authentication services, role-based authorization controls, and client-side frontend data handling.

All high and critical vulnerabilities identified prior to remediation have been verified as resolved. The application enforces defense-in-depth principles: authorization is enforced strictly on the backend, data access is scoped to authorized roles, password hashes are never exposed, and input validation is applied to all incoming DTOs.

---

## 2. Security Domain Findings & Verification

### 2.1 Authentication & Credential Security
- **Mechanism:** JWT (JSON Web Tokens) with RS256/HS256 signed tokens containing user ID, role, and department claims.
- **Password Hashing:** Passwords are salted and hashed using `bcrypt` (10 rounds). Plaintext passwords are never persisted.
- **Password Exposure:** User entities returned by API routes omit the `password` field via Prisma query field selection or class-transformer serialization (`@Exclude()`).
- **Brute Force Defense:** Progressive account lockout is enforced. After 5 consecutive failed login attempts within a 15-minute window, the account is temporarily locked, mitigating brute-force password cracking.
- **Administrative Resets:** When an administrator initiates a password reset, a secure temporary credential is generated, hashed, and flagged with `mustChangePassword = true`.

### 2.2 Role-Based Access Control (RBAC) & Route Protection
- **Guards:** NestJS `JwtAuthGuard` combined with custom `@Roles(...)` metadata and `RolesGuard`.
- **Privilege Separation:**
  - `EMPLOYEE`: Can submit trip requests, view their own bookings, cancel their own pending bookings, and view receipts for their bookings. Strictly barred from approving requests or assigning fleet resources.
  - `LOGISTICS_ADMIN`: Can review pending queues, approve/reject requests with mandatory justification, assign vehicles and chauffeurs, auto-assign assets, and cancel active bookings.
  - `DRIVER`: Can view only trips assigned specifically to their driver ID (`where: { assignments: { some: { driverId } } }`), confirm assignments, and update trip execution status (start, arrival, delay, complete). Cannot access or manipulate other drivers' trips or manage fleet inventory.
  - `SYSTEM_ADMIN`: Full administrative privileges, user management, department management, system settings, and audit log access.
- **Verification Evidence:**
  - `verify_workflows.js`: Direct API calls by `EMPLOYEE` to `/assign` return `403 Forbidden`. Calls by `DRIVER` to cancel or create vehicles return `403 Forbidden`. Unauthenticated requests return `401 Unauthorized`.

### 2.3 Insecure Direct Object References (IDOR) & Scoping
- **Booking Access:**
  - When an employee requests `GET /api/bookings/:id`, the backend verifies that `booking.requesterId === user.id` unless the user possesses `LOGISTICS_ADMIN` or `SYSTEM_ADMIN` role.
- **Driver Portal Isolation:**
  - When a chauffeur accesses `/api/bookings`, the query restricts results strictly to assignments where `driverId === user.id`.
  - Tested with two distinct driver accounts (Abebe and Mulugeta) in `verify_e2e_workflow.js`: Mulugeta cannot view Abebe's assigned trip, even when querying all bookings.

### 2.4 SQL & NoSQL Injection Prevention
- **Data Access:** Object-Relational Mapping is handled exclusively through Prisma ORM, which generates parameterized queries for all relational operations.
- **Row-Level Locking:** Where raw SQL is utilized for concurrency row-level locking (`SELECT ... FOR UPDATE`), Prisma's tagged template literal `$queryRaw` is used, ensuring parameters are sanitized as bound variables rather than concatenated strings.

### 2.5 CSV Formula Injection (Spreadsheet Mitigation)
- **Vulnerability:** Unsanitized user inputs exported to CSV can trigger code execution when opened in Excel or LibreOffice Calc if cells begin with formula trigger characters (`=`, `+`, `-`, `@`, `\t`).
- **Remediation:** Both `ReportsHubView.tsx` and `AuditLogsView.tsx` implement cell sanitization:
  ```typescript
  const sanitizeCell = (val: string) => {
    let clean = (val ?? '').replace(/"/g, '""');
    if (/^[=\+\-@\t\r]/.test(clean)) {
      clean = "'" + clean;
    }
    return `"${clean}"`;
  };
  ```
- **Status:** VERIFIED. All formula-trigger prefixes are neutralized with a leading single quote.

### 2.6 Cross-Site Scripting (XSS) & UI Safety
- **Frontend Framework:** React 18 with JSX automatically escapes all dynamic content rendered in the DOM, preventing reflected and stored XSS.
- **Receipt Modal & Printable Form:** Renders strictly typed booking attributes without injecting unescaped `dangerouslySetInnerHTML`.
- **QR Code Content:** Encodes only a URL reference (`http://localhost:5173/?ref=...`) and token; does not serialize secrets, tokens, or PII into the 2D barcode.

### 2.7 Audit Trail & Non-Repudiation
- **Immutability:** Audit records are stored in a dedicated `AuditLog` table. Ordinary application roles have no delete or update routes for audit entries.
- **Actor Integrity:** The backend extracts the actor ID and name directly from the verified JWT payload (`req.user`), preventing clients from falsifying the actor identity in audit records.

---

## 3. Summary of Security Posture

| Control Category | Standard Applied | Status |
| :--- | :--- | :--- |
| **Authentication** | JWT with bcrypt password hashing | **SECURE** |
| **Brute Force Protection** | 5 failed attempts / 15-minute lockout | **SECURE** |
| **Authorization (RBAC)** | Strict NestJS Guards on all endpoints | **SECURE** |
| **Data Scoping (IDOR)** | Ownership validation on bookings & trips | **SECURE** |
| **SQL Injection** | Parameterized queries via Prisma & tagged raw SQL | **SECURE** |
| **Spreadsheet Injection** | Prefix neutralization on all CSV exports | **SECURE** |
| **XSS Defense** | React JSX escaping, no unescaped innerHTML | **SECURE** |
| **Secrets Management** | `.env` separation, exclusion in git repository | **SECURE** |
| **Audit Logging** | Server-enforced actor attribution, append-only log | **SECURE** |
