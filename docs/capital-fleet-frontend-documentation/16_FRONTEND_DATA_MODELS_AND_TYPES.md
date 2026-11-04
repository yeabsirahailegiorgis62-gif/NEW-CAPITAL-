# 16 — Frontend Data Models and Types

This document provides a comprehensive technical reference for all TypeScript interfaces, types, enums, and data models implemented in [apps/web/src/types/index.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/types/index.ts).

---

## 1. User & Organizational Hierarchy Models

### 1.1 `UserRole`
```typescript
export type UserRole = 'EMPLOYEE' | 'DRIVER' | 'LOGISTICS_ADMIN' | 'SYSTEM_ADMIN';
```

### 1.2 `User`
Represents an employee, chauffeur, or system administrator in the Capital Real Estate corporate directory.

| Field Name | Type | Optional? | Description |
|---|---|---|---|
| `id` | `string` | No | Unique UUID primary key. |
| `employeeId` | `string \| null` | Yes | Corporate employee badge/staff ID (e.g., `"EMP-1042"`). |
| `name` | `string` | No | Full personal name. |
| `email` | `string` | No | Corporate email address. |
| `role` | `UserRole` | No | System access level. |
| `departmentId` | `string \| null` | Yes | Foreign key reference to `Department`. |
| `phone` | `string \| null` | Yes | Contact telephone number. |
| `avatarUrl` | `string \| null` | Yes | URL to profile photo asset. |
| `jobTitle` | `string \| null` | Yes | Official corporate designation (e.g., "Senior Sales Executive"). |
| `licenseNumber`| `string \| null` | Yes | Commercial driving license ID (mandatory if `role === 'DRIVER'`). |
| `department` | `{ id: string; name: string } \| null` | Yes | Embedded relational department object. |
| `isActive` | `boolean` | No | Account status flag. |
| `createdAt` | `string` | No | ISO 8601 registration timestamp. |

### 1.3 `Department`
Represents a corporate department (e.g., Sales, Architecture, Executive Office).

| Field Name | Type | Optional? | Description |
|---|---|---|---|
| `id` | `string` | No | Unique UUID. |
| `name` | `string` | No | Department name. |
| `code` | `string \| null` | Yes | Short alphanumeric code (e.g., `"SALES"`, `"ENG"`). |
| `description` | `string \| null` | Yes | Operational scope description. |
| `isActive` | `boolean` | Yes | Active operational flag. |
| `_count` | `{ users: number }` | Yes | Aggregated employee count. |

---

## 2. Fleet Vehicle Models

### 2.1 `VehicleCategory` & `VehicleOperationalStatus`
```typescript
export type VehicleCategory = 'SEDAN' | 'SUV' | 'PICKUP' | 'MINIBUS' | 'OTHER';

export type VehicleOperationalStatus = 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'INACTIVE';
```

### 2.2 `Vehicle`
Represents an executive corporate vehicle managed in the fleet inventory.

| Field Name | Type | Optional? | Description |
|---|---|---|---|
| `id` | `string` | No | Unique UUID. |
| `name` | `string` | No | Display vehicle title (e.g., "Toyota Land Cruiser Prado"). |
| `make` | `string` | No | Vehicle manufacturer (e.g., "Toyota"). |
| `model` | `string` | No | Vehicle model (e.g., "Prado TX-L"). |
| `registrationNumber` | `string` | No | Ethiopian license plate number (e.g., "3-56789 AA"). |
| `category` | `VehicleCategory` | No | Vehicle classification. |
| `passengerCapacity` | `number` | No | Seating capacity excluding chauffeur. |
| `operationalStatus` | `VehicleOperationalStatus` | No | Readiness status. |
| `fuelLevel` | `number \| null` | Yes | Current fuel tank percentage ($0 - 100$). |
| `mileage` | `number \| null` | Yes | Current odometer reading in kilometers. |
| `fuelType` | `string \| null` | Yes | `"PETROL"`, `"DIESEL"`, `"HYBRID"`, `"ELECTRIC"`. |

---

## 3. Transportation Request & Booking Models

### 3.1 `BookingStatus`
```typescript
export type BookingStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';
```

### 3.2 `Booking`
Represents an employee transportation reservation request.

| Field Name | Type | Optional? | Description |
|---|---|---|---|
| `id` | `string` | No | Unique UUID. |
| `bookingReference` | `string` | No | High-visibility reference code (e.g., `"CR-2026-0891"`). |
| `requesterId` | `string` | No | User ID of the requesting employee. |
| `requester` | Embedded User Object | Yes | Populated user metadata (name, department, phone). |
| `requestType` | `'DAILY' \| 'WEEKLY'` | Yes | Daily ad-hoc vs weekly recurring schedule. |
| `pickupLocation` | `string \| null` | Yes | Origin site address. |
| `destination` | `string` | No | Target destination site. |
| `purpose` | `string` | No | Business justification. |
| `departureAt` | `string` | No | ISO 8601 departure timestamp. |
| `expectedReturnAt`| `string` | No | ISO 8601 expected return timestamp. |
| `actualDepartureAt`| `string \| null` | Yes | Actual trip start timestamp logged by chauffeur. |
| `actualReturnAt` | `string \| null` | Yes | Actual trip return timestamp logged by chauffeur. |
| `startOdometer` | `number \| null` | Yes | Vehicle odometer at departure (km). |
| `endOdometer` | `number \| null` | Yes | Vehicle odometer upon return (km). |
| `passengerCount` | `number` | No | Number of passengers requiring transport. |
| `status` | `BookingStatus` | No | Current operational lifecycle stage. |
| `assignments` | `VehicleAssignment[]`| Yes | History of vehicle and driver dispatches. |
| `currentAssignment`| `VehicleAssignment \| null`| Yes | Active vehicle and chauffeur assignment. |
| `bookingDays` | `BookingDay[]` | Yes | Recurring itinerary days for weekly bookings. |

### 3.3 `BookingDay`
Represents a discrete scheduled trip within a weekly recurring request.

| Field Name | Type | Description |
|---|---|---|
| `id` | `string` | Unique UUID. |
| `dayOfWeek` | `string` | `"MONDAY"`, `"TUESDAY"`, `"WEDNESDAY"`, `"THURSDAY"`, `"FRIDAY"`. |
| `tripDate` | `string` | YYYY-MM-DD calendar date. |
| `timeSlot` | `'MORNING' \| 'AFTERNOON'` | Commuter period slot. |
| `status` | `BookingStatus` | Operational status of this specific day's trip. |
| `vehicle` | `Vehicle \| null` | Assigned vehicle for this day. |
| `driver` | Embedded driver object | Assigned chauffeur for this day. |

---

## 4. Dispatch, Telematics & Verification Models

### 4.1 `VehicleAssignment`
Represents the formal dispatch linking a booking to a vehicle and driver.

| Field Name | Type | Description |
|---|---|---|
| `id` | `string` | Unique UUID. |
| `bookingId` | `string` | Foreign key to `Booking`. |
| `vehicleId` | `string` | Foreign key to `Vehicle`. |
| `driverId` | `string \| null` | Foreign key to `User` (Driver). |
| `driverName` | `string \| null` | Chauffeur full name snapshot. |
| `driverPhone`| `string \| null` | Chauffeur phone snapshot. |
| `status` | `'CONFIRMED' \| 'DECLINED' \| 'COMPLETED' \| ...` | Assignment confirmation lifecycle. |
| `assignedAt` | `string` | Timestamp when logistics officer dispatched asset. |
| `startOdometer`| `number \| null` | Odometer at departure. |
| `endOdometer` | `number \| null` | Odometer at arrival. |

### 4.2 `BookingVerificationResult`
Returned by public QR-code security verification endpoints (`/api/bookings/verify/:ref`).

| Field Name | Type | Description |
|---|---|---|
| `isValid` | `boolean` | True if pass is authentic and approved. |
| `verificationStatus` | `'VALID' \| 'EXPIRED' \| 'CANCELLED' \| ...` | Gate clearance verdict. |
| `bookingReference` | `string` | Reference code. |
| `requester` | `{ name, employeeId, department }` | Employee metadata. |
| `trip` | `{ destination, departureAt, ... }` | Trip itinerary details. |
| `assignment` | `{ vehicleName, registrationNumber, driverName }` | Dispatched fleet asset and chauffeur. |
| `verifiedAt` | `string` | Server verification timestamp. |

---

## 5. Maintenance, Fuel & Audit Models

### 5.1 `VehicleMaintenance`
Represents scheduled or emergency fleet repairs.

| Field Name | Type | Description |
|---|---|---|
| `id` | `string` | Unique UUID. |
| `vehicleId` | `string` | Foreign key to `Vehicle`. |
| `category` | `MaintenanceCategory` | Routine service, oil change, brake service, etc. |
| `serviceDescription`| `string` | Scope of repair work. |
| `serviceDate` | `string` | Date of maintenance. |
| `actualCost` | `number \| null` | Financial expenditure (ETB). |
| `status` | `MaintenanceStatus` | `'REPORTED'`, `'SCHEDULED'`, `'IN_PROGRESS'`, `'COMPLETED'`. |

### 5.2 `FuelRecord`
Represents an individual refueling transaction.

| Field Name | Type | Description |
|---|---|---|
| `id` | `string` | Unique UUID. |
| `vehicleId` | `string` | Foreign key to `Vehicle`. |
| `date` | `string` | Refueling timestamp. |
| `odometerReading` | `number` | Mileage at pump. |
| `fuelQuantityLiters`| `number` | Volume dispensed. |
| `totalCost` | `number` | Total financial cost in ETB. |

### 5.3 `AuditLog`
Represents an immutable record of system state changes.

| Field Name | Type | Description |
|---|---|---|
| `id` | `string` | Unique UUID. |
| `actorName` | `string \| null` | Name of user who performed mutation. |
| `entityType` | `string` | `"Booking"`, `"Vehicle"`, `"User"`, `"Assignment"`. |
| `entityId` | `string` | UUID of modified record. |
| `action` | `string` | `"BOOKING_CREATED"`, `"BOOKING_APPROVED"`, `"VEHICLE_ASSIGNED"`, etc. |
| `previousValues` | `Record<string, any>` | State diff prior to mutation. |
| `newValues` | `Record<string, any>` | State diff after mutation. |
| `createdAt` | `string` | Immutable server timestamp. |
