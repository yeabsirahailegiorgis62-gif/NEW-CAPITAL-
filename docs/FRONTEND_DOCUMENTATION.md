# Capital Fleet — Frontend Architecture & Component Guide

**Target Application:** `apps/web` (@capital-fleet/web)  
**Framework:** React 18 with Vite 5 and TypeScript  
**Design System:** Automotive Dark/Light Theme with Tailwind CSS  
**Document Version:** 2.0  

---

## 1. Frontend Technology Stack & Design Decisions

| Library / Tool | Role in Frontend | Architectural Reason |
| :--- | :--- | :--- |
| **React 18** | UI component tree, lifecycle hooks | Functional components with reactive hooks (`useState`, `useEffect`, `useCallback`). |
| **Vite 5** | Development server & production bundler | Sub-second HMR, optimized Rollup chunking, native ESM dev serving. |
| **Tailwind CSS** | Design system styling & responsive layout | Zero runtime overhead utility classes, dark-mode CSS variables (`dark:`). |
| **Lucide React** | Consistent iconography | Vector icons for automotive metrics (gauges, fuel, keys, calendars, alerts). |
| **qrcode** | QR code generation | Client-side Canvas rendering of verification URLs for transport vouchers. |
| **sessionStorage** | Authentication token persistence | Stores JWT securely during active browser session; clears automatically on tab close. |

> **Architectural Note:** The frontend intentionally does **not** rely on heavy external routing libraries (like `react-router-dom`) or state stores (like `Redux`). Instead, it uses clean URL query synchronization (`?tab=...`), state promotion, and modular barrel exports (`index.ts`).

---

## 2. Directory Structure & Feature Barrels

```
apps/web/src/
├── main.tsx                         # React entrypoint mounting App onto #root
├── App.tsx                          # Top-level workspace shell, tabs, session
├── index.css                        # Tailwind directives, theme variables
├── types/index.ts                   # Domain entity TypeScript interfaces
├── lib/
│   ├── api.ts                       # Singleton ApiClient with fetch & auth bearer
│   ├── utils.ts                     # Tailwind class merging cn()
│   ├── csvExport.ts                 # Browser CSV export generator
│   └── imageUtils.ts                # Base64 photo compression helper
├── context/
│   └── ThemeContext.tsx             # Dark/Light theme toggle with localStorage
├── pages/
│   ├── LandingPage.tsx              # Public welcoming and system overview screen
│   ├── LoginPage.tsx                # Secure staff credential authentication screen
│   └── PublicVerificationPage.tsx   # Unauthenticated gate security QR verification
├── components/
│   ├── layout/                      # AppShell, Navbar, Sidebar, ProfileModal
│   ├── ui/                          # Alert, Badge, Button, Card, Input, Modal, SmartDropdown, Toast
│   ├── notifications/               # NotificationDetailsModal
│   ├── loading/                     # AutomotiveLoadingScreen
│   ├── automotive/                  # AutomotiveJourneySpine, HighwaySectionConnector
│   └── telematics/                  # DynamicFleetRouteSimulation
└── features/                        # 11 FEATURE MODULE BARRELS
    ├── admin/index.ts               # UsersManagementView, DepartmentsManagementView, SettingsView, AuditLogsView
    ├── auth/index.ts                # ForgotPasswordModal
    ├── availability/index.ts        # AvailabilityCalendar
    ├── bookings/index.ts            # BookingRequestForm, BookingsTable, BookingDetailsModal, CancelBookingModal, DigitalReceiptModal, PrintableTransportFormModal
    ├── dashboard/index.ts           # EmployeeDashboard, LogisticsDashboard, DriverDashboard, AdminAnalyticsDashboard
    ├── drivers/index.ts             # DriversManagementView
    ├── logistics/index.ts           # ReviewRequestsQueue, AssignVehicleModal, TripExecutionModal
    ├── maintenance/index.ts         # MaintenanceView
    ├── profile/index.ts             # ProfileSettingsView
    ├── reports/index.ts             # ReportsHubView
    └── vehicles/index.ts            # VehicleInventoryView, VehicleModal
```

---

## 3. Top-Level State Management & Navigation Flow

In `apps/web/src/App.tsx`, state is categorized into four primary concerns:

1. **Session & Identity:**
   - `currentUser: User | null`: Authenticated staff profile.
   - `isAppLoading: boolean`: Loading splash controller during session bootstrap.
2. **View & Tab Routing:**
   - `currentView: 'landing' | 'login' | 'workspace'`: Primary screen switcher.
   - `activeTab: string`: Active navigation tab (synchronized bidirectionally with `window.location.search` `?tab=...`).
3. **Data Caching:**
   - `bookings: Booking[]`: Active bookings cache.
   - `notifications: InAppNotification[]`: User inbox alerts.
4. **Modal Dialog Controllers:**
   - `selectedBookingForDetails: Booking | null`
   - `selectedBookingForReceipt: Booking | null`
   - `assigningBooking: Booking | null`
   - `cancellingBooking: Booking | null`
   - `tripModalBooking: { booking: Booking; mode: 'start' | 'complete' } | null`

---

## 4. API Client Integration (`apps/web/src/lib/api.ts`)

All communication between the React client and the NestJS backend flows through the `ApiClient` singleton:

```typescript
// Automatic Bearer Token Attachment
private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (this.token) {
    headers['Authorization'] = `Bearer ${this.token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  // Robust error extraction from NestJS validation responses
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Request failed');
  }
  return response.json();
}
```

---

## 5. Reusable UI Component Library

Located in `apps/web/src/components/ui/`:
- **`Button.tsx`:** Standardized variants (`primary`, `secondary`, `danger`, `outline`, `ghost`) with disabled states and loading spinners.
- **`Input.tsx`:** Styled form input supporting floating labels, helper text, and validation error messages.
- **`Modal.tsx`:** Accessible modal dialog with backdrop blur, Escape key dismissal, and backdrop click handling.
- **`Card.tsx`:** Container card with subtle border and dark/light shadow tokens.
- **`Badge.tsx`:** Color-coded status badge (`PENDING_APPROVAL`: amber, `APPROVED`: emerald, `REJECTED`: rose, `IN_PROGRESS`: cyan).
- **`SmartDropdown.tsx`:** Searchable autocomplete dropdown for vehicle and employee selection.
- **`Toast.tsx`:** Notification toast manager providing `useToast()` hook.
- **`ErrorBoundary.tsx`:** React error boundary preventing UI crashes from unexpected component render failures.

