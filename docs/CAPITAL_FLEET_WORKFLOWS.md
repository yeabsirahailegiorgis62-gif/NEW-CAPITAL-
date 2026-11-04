# Capital Fleet Management System — Operational Workflows & Lifecycles

**Document Version:** 1.0.0  
**Project:** Capital Real Estate Fleet Management System  
**Date:** October 26, 2026  
**Auditor / Architect:** Senior Full-Stack Software Engineer & Workflow Specialist  

---

## 1. Overview of System Roles

The Capital Real Estate Fleet Management System orchestrates four distinct operational roles across company headquarters and regional construction projects:

1. **Employee (Requester):** Submits transport requisitions for official duties, site inspections, and administrative tasks.
2. **Logistics Officer / Admin:** Authoritative dispatcher responsible for reviewing requests, granting approvals, declining invalid requests, and allocating fleet vehicles and chauffeurs.
3. **Chauffeur (Driver):** Receives trip assignments, verifies vehicle readiness, records departure odometer readings, reports delays or arrival, and completes trips with closing mileage.
4. **System Administrator:** Oversees corporate fleet master inventory, user accounts, departments, system configuration, and audit compliance journals.

---

## 2. Core Business Workflows

### 2.1 The Standard Transport Requisition & Allocation Lifecycle

```
[Employee] Submits Booking Request (Single-Day / Weekly)
      │
      ▼
Status: PENDING_APPROVAL  <─── (Vehicle/Chauffeur selection strictly prohibited)
      │
      ├───────────────────────────────────────────┐
      ▼                                           ▼
[Logistics Admin] Declines Request        [Logistics Admin] Approves Request
      │                                           │
      ▼                                           ▼
Status: REJECTED                          Status: APPROVED
(Reason recorded, Requester notified)             │
                                                  ▼
                                          [Logistics Admin] Allocates Vehicle & Chauffeur
                                          (Manual Selection OR 1-Click Auto-Assign)
                                                  │
                                                  ▼
                                          Status: ASSIGNED / CONFIRMED
                                                  │
                                                  ▼
                                          [Driver] Receives Trip in Driver Portal
                                                  │
                                                  ▼
                                          [Driver] Confirms Assignment & Starts Trip
                                                  │
                                                  ▼
                                          Status: IN_PROGRESS
                                                  │
                                                  ▼
                                          [Driver] Completes Trip with Final Odometer
                                                  │
                                                  ▼
                                          Status: COMPLETED
                                          (Digital Transport Receipt finalized)
```

---

### 2.2 Step-by-Step Workflow Specifications

#### Workflow 1: Employee Submits Transport Requisition
1. **Initiation:** Employee navigates to **New Request** form (`BookingRequestForm.tsx`).
2. **Input Fields:**
   - Trip Type: Single-Day or Recurring Weekly
   - Departure Date & Time (validated to ensure strictly in the future)
   - Estimated Return Date & Time (validated to be after departure)
   - Destination / Project Site (e.g., *Ayat Zone C, Sarbet Site, CMC Commercial Center*)
   - Purpose of Trip (e.g., *Structural inspection with municipal engineers*)
   - Number of Passengers
   - Chauffeur Requirement (Yes/No toggle)
3. **Safety Constraint:** The employee is **strictly barred from selecting vehicles or assigning drivers**. Fleet allocation is the sole prerogative of the Logistics Department.
4. **Result:** Request saved with status `PENDING_APPROVAL` and assigned a tracking reference (`CR-2026-xxxx`). Real-time notification routed to Logistics Admins.

---

#### Workflow 2: Logistics Officer Review & Approval Enforcement
1. **Queue Review:** Logistics Admin accesses **Review Requests Queue** (`ReviewRequestsQueue.tsx`).
2. **Pending Actions Available:**
   - **Approve:** Evaluates operational legitimacy and advances status to `APPROVED`.
   - **Decline / Reject:** Prompts for mandatory rejection reason; advances status to `REJECTED`.
   - **View Details:** Opens modal inspecting route, passenger count, and requester profile.
3. **Safety Constraint (Phase 2 Remediation):**
   - Assignment actions ("Assign Vehicle" and "⚡ Auto-Assign") **never appear on pending requests**.
   - Direct API attempts to call `/api/bookings/:id/assign` on `PENDING_APPROVAL` are rejected with `400 Bad Request`.

---

#### Workflow 3: Vehicle & Chauffeur Assignment
1. **Precondition:** Request is in `APPROVED` status.
2. **Allocation Mode A — Manual Allocation (`AssignVehicleModal.tsx`):**
   - Logistics Admin selects vehicle from real-time conflict-free recommendations.
   - Recommender checks operational status (`ACTIVE`), passenger capacity, safety alert status, and existing trip/maintenance overlaps.
   - Logistics Admin selects an available verified chauffeur.
   - Backend acquires PostgreSQL row-level locks (`FOR UPDATE`) on the vehicle and chauffeur records to prevent simultaneous double-booking.
   - Status advances to `ASSIGNED`.
3. **Allocation Mode B — 1-Click Smart Auto-Assign:**
   - Logistics Admin clicks **⚡ Auto-Assign**.
   - Algorithm selects the smallest available vehicle meeting passenger capacity without schedule overlaps, assigns an available driver, and commits the transaction atomically.

---

#### Workflow 4: Chauffeur Trip Execution (`DriverDashboard.tsx`)
1. **Visibility:** Assigned chauffeur logs into **Driver Portal** and sees only trips assigned to their driver account.
2. **Assignment Confirmation:** Chauffeur reviews route instructions and clicks **Confirm Assignment** (`/assignments/:id/confirm`).
3. **Start Trip:** Upon departure, chauffeur records starting mileage and clicks **Start Trip** (`/start-trip`). Status becomes `IN_PROGRESS`.
4. **Complete Trip:** Upon returning to company headquarters, chauffeur records ending mileage, fuel notes, and clicks **Complete Trip** (`/complete-trip`). Status becomes `COMPLETED`.
5. **Invariant Safeguard:** Completed trips cannot be cancelled or altered.

---

#### Workflow 5: Cancellation & Resource Release
1. **Eligibility:** Authorized logistics admins (or requesters for unassigned pending requests) can cancel trips.
2. **Execution:** Admin enters mandatory cancellation reason in `CancelBookingModal.tsx` (`PATCH /api/bookings/:id/cancel`).
3. **Resource Release:**
   - Status updates to `CANCELLED`.
   - Assignment record records `unassignedAt = new Date()`, immediately releasing the vehicle and chauffeur back to the available fleet pool for future bookings.
   - Audit log records the responsible officer and reason.

---

#### Workflow 6: Digital Receipt & Verification
1. **Access:** Requester, logistics officer, or security personnel clicks **Receipt** on any approved/assigned/completed booking.
2. **Display Elements:**
   - Capital Real Estate corporate branding & official crest
   - Human-readable Booking Reference (`CR-2026-xxxx`)
   - Requester Name, Employee ID, and Department
   - Assigned Vehicle details (Make, Model, License Plate)
   - Assigned Chauffeur name and emergency telephone
   - QR Code encoding verification link
3. **Verification Page (`PublicVerificationPage.tsx`):**
   - Scanning the QR code routes to public verification showing authorized trip credentials without exposing passwords or sensitive database keys.
