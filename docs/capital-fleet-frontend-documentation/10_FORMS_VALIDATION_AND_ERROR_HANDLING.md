# 10 — Forms, Validation, and Error Handling

This document provides a comprehensive technical audit of all forms, input controls, client-side validation logic, duplicate submission prevention mechanisms, and error reporting patterns implemented in the **Capital Fleet** frontend application.

---

## 1. Overview of Form Architecture and Patterns

### 1.1 State Management Pattern
All forms in Capital Fleet use **React controlled components** rather than third-party form libraries (such as React Hook Form or Formik). Form state is managed via React `useState`, ensuring immediate validation feedback, real-time character counting, and reactive field dependencies (such as toggling between Single-Day and Weekly recurring scheduling modes).

### 1.2 Multi-Tiered Validation Strategy
1. **Client-Side Immediate Validation:** Executed synchronously prior to network dispatch (e.g., verifying mandatory fields, ensuring return date follows departure date, checking passenger limits).
2. **Asynchronous Business Logic Validation:** Executed via API calls before final submission (e.g., calling `api.checkDuplicate` to detect overlapping trips).
3. **Backend Authoritative Validation:** NestJS `ValidationPipe` and `class-validator` enforce schema constraints, with structured error responses parsed and displayed by the frontend.

### 1.3 Duplicate Submission Prevention
To prevent accidental double-submits (e.g., double-clicking a "Submit Request" button):
- Every form maintains an `isSubmitting` (or `submitting`) boolean state.
- During API execution, submit buttons are disabled (`disabled={isSubmitting}`) and display an animated Lucide `Loader2` spinner.
- Network requests are awaited in a `try...catch...finally` block that resets the submitting state only after completion.

---

## 2. Comprehensive Inventory of Major Application Forms

### 2.1 Employee Transportation Request Form (`BookingRequestForm.tsx`)
- **Source File:** [apps/web/src/features/bookings/BookingRequestForm.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx)
- **Purpose:** Enables employees to submit daily or recurring weekly transportation requests.

| Field Name | Input Type | Required? | Default Value | Validation Rules | Error Presentation |
|---|---|---|---|---|---|
| **Request Mode** | Toggle Buttons | Yes | `'daily'` | Must be `'daily'` or `'weekly'` | UI Selection |
| **Pickup Location** | Text Input | Yes | `'Capital Real Estate HQ, Bole Tower'` | Non-empty string | Inline red text |
| **Destination** | Select / Text | Yes | `''` | Non-empty string | Inline red text |
| **Trip Purpose** | Text Area | Yes | `''` | Minimum 5 characters | Inline red text |
| **Contact Phone** | Tel Input | Yes | `currentUser?.phone` | Valid Ethiopian phone format (`+251 ...`) | Inline red text |
| **Departure Date** | Date Picker | Yes (Daily) | `''` | Cannot be in the past | Inline red text |
| **Departure Time** | Time Picker | Yes (Daily) | `'08:30'` | Valid HH:MM format | Inline red text |
| **Time Slot Preset**| Radio / Pill | No | `'MORNING'` | `'MORNING'`, `'AFTERNOON'`, or `'CUSTOM'` | UI Selection |
| **Return Date** | Date Picker | Yes (Daily) | `''` | Must be $\ge$ Departure Date | Inline red text |
| **Return Time** | Time Picker | Yes (Daily) | `'17:00'` | If same day, must be $>$ Departure Time | Inline red text |
| **Week Start Date** | Date Picker | Yes (Weekly) | Next upcoming Monday | Must be a valid date | Inline red text |
| **Weekly Days** | Checkbox Group | Yes (Weekly) | At least 1 day | At least one day selected | Warning banner |
| **Passenger Count** | Numeric Stepper| Yes | `1` | Integer between 1 and 25 | Clamped stepper buttons |
| **Additional Notes**| Text Area | No | `''` | Optional notes | None |

#### Duplicate Booking Prevention Mechanism
Prior to submission, the form invokes:
```typescript
const duplicateCheck = await api.checkDuplicate({
  tripDate: departureDate,
  destination: destination.trim(),
  departureTime,
});
```
If `duplicateCheck.isDuplicate` is true, the form displays a prominent amber warning card listing existing bookings for that destination and date, requiring explicit employee confirmation before proceeding.

---

### 2.2 User Authentication Form (`LoginPage.tsx`)
- **Source File:** [apps/web/src/pages/LoginPage.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/LoginPage.tsx)
- **Purpose:** Authenticates employees, logistics administrators, chauffeurs, and system administrators.

| Field Name | Input Type | Required? | Validation Rules | Error Presentation |
|---|---|---|---|---|
| **Identifier** | Email / Text Input | Yes | Non-empty string; trimmed | Red border & error text |
| **Password** | Password Input (with show/hide toggle) | Yes | Non-empty string | Red border & error text |

- **Error Handling:** Invalid credentials trigger a red Alert banner at the top of the form: *"Invalid email or password. Please verify your credentials or contact fleet dispatch."*

---

### 2.3 Administrative Rejection Form (`ReviewRequestsQueue.tsx`)
- **Source File:** [apps/web/src/features/logistics/ReviewRequestsQueue.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx)
- **Purpose:** Mandatory justification modal when a logistics officer rejects an employee transportation request.

| Field Name | Input Type | Required? | Validation Rules | Error Presentation |
|---|---|---|---|---|
| **Rejection Reason** | Text Area | Yes | Minimum 10 characters; whitespace trimmed | Modal error banner |
| **Rejection Preset** | Select Pill | No | Options: "No vehicles available", "Outside policy", "Route conflict" | Fills text area |

---

### 2.4 Chauffeur & Vehicle Dispatch Form (`AssignVehicleModal.tsx`)
- **Source File:** [apps/web/src/features/logistics/AssignVehicleModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx)
- **Purpose:** Matches an approved booking to an active vehicle and licensed chauffeur.

| Field Name | Input Type | Required? | Validation Rules | Error Presentation |
|---|---|---|---|---|
| **Vehicle Selection**| Smart Dropdown / Radio Card | Yes | Must select an operational vehicle with status `ACTIVE` | Disabled submit button |
| **Driver Selection** | Smart Dropdown / Radio Card | No (Optional if self-drive) | Must select a driver with status `AVAILABLE` | Form feedback |
| **Dispatch Notes** | Text Area | No | Maximum 500 characters | Character counter |

---

### 2.5 Vehicle Asset Management Form (`VehicleInventoryView.tsx`)
- **Source File:** [apps/web/src/features/vehicles/VehicleInventoryView.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/vehicles/VehicleInventoryView.tsx)
- **Purpose:** Adding or updating fleet vehicles.

| Field Name | Input Type | Required? | Validation Rules |
|---|---|---|---|
| **Make & Model** | Text Input | Yes | Non-empty string (e.g., "Toyota Land Cruiser Prado") |
| **License Plate** | Text Input | Yes | Unique Ethiopian license format (e.g., "3-56789 AA") |
| **Vehicle Category**| Select Dropdown | Yes | `EXECUTIVE_SEDAN`, `LUXURY_SUV`, `PASSENGER_VAN`, `PICKUP_TRUCK` |
| **Seating Capacity**| Number Input | Yes | Integer between 2 and 50 |
| **Fuel Type** | Select Dropdown | Yes | `PETROL`, `DIESEL`, `HYBRID`, `ELECTRIC` |
| **Odometer (km)** | Number Input | Yes | Non-negative integer |
| **Operational Status**| Select Dropdown | Yes | `ACTIVE`, `MAINTENANCE`, `OUT_OF_SERVICE`, `INACTIVE` |

---

### 2.6 Trip Execution & Mileage Logging Form (`TripExecutionModal.tsx`)
- **Source File:** [apps/web/src/features/logistics/TripExecutionModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/TripExecutionModal.tsx)
- **Purpose:** Chauffeur logs departure and arrival metrics.

| Field Name | Mode | Required? | Validation Rules |
|---|---|---|---|
| **Starting Odometer**| Trip Start | Yes | Must be $\ge$ vehicle's last recorded odometer |
| **Departure Notes** | Trip Start | No | Optional route notes |
| **Closing Odometer** | Trip Complete | Yes | Must be $>$ starting odometer |
| **Trip Log Notes** | Trip Complete | No | Optional feedback or incident notes |
| **Reported Problem** | Trip Complete | No | Flags vehicle maintenance issue if filled |

---

### 2.7 System User Management Form (`UsersManagementView.tsx`)
- **Source File:** [apps/web/src/features/admin/UsersManagementView.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/admin/UsersManagementView.tsx)
- **Purpose:** Administrative creation of organization accounts.

| Field Name | Input Type | Required? | Validation Rules |
|---|---|---|---|
| **Full Name** | Text Input | Yes | Non-empty string |
| **Corporate Email**| Email Input | Yes | Valid email format (`user@capitalrealestate.et`) |
| **Initial Password**| Password Input | Yes | Minimum 8 characters |
| **Role Assignment**| Select Dropdown | Yes | `EMPLOYEE`, `LOGISTICS_ADMIN`, `DRIVER`, `SYSTEM_ADMIN` |
| **Department** | Select Dropdown | No | Linked foreign key to department table |
| **Driver License** | Text Input | Required if `role === 'DRIVER'` | Non-empty license string |

---

## 3. Error Handling and Feedback Mechanisms

### 3.1 Toast Notification Feedback
The application uses [apps/web/src/components/ui/Toast.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Toast.tsx) to provide immediate, non-blocking feedback:
- **`toast.success(title, message)`:** Triggered on successful request creation, booking approval, vehicle assignment, and profile update.
- **`toast.error(title, message)`:** Triggered on API failure, network timeout, or authorization rejection.
- **`toast.warning(title, message)`:** Triggered on duplicate booking warnings or expiring sessions.
- **`toast.info(title, message)`:** Triggered on initial login to alert users to unread notifications.

### 3.2 Form-Level Alert Banners
When a form encounters a high-priority validation or server error, it renders [apps/web/src/components/ui/Alert.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Alert.tsx) directly above form action buttons, ensuring users do not miss critical warnings.

### 3.3 Form Accessibility Considerations
- **Semantic Labels:** Form fields use explicit `<label>` elements linked to inputs via unique `id` attributes.
- **Focus Management:** First input field is focused on modal mount (`autoFocus`).
- **Keyboard Navigation:** Forms can be submitted by pressing `Enter` within single-line inputs, and modals can be closed via `Escape`.
- **Disabled State Indication:** Buttons reflect `disabled` visually with `disabled:opacity-50 disabled:pointer-events-none`.
