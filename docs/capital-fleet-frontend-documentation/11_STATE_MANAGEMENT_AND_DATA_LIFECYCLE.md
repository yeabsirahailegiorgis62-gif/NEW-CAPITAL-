# 11 — State Management and Data Lifecycle

This document provides a comprehensive technical audit of frontend state architecture, data lifecycle, caching mechanisms, URL state synchronization, and reactive UI updates in the **Capital Fleet** application.

---

## 1. Frontend State Architecture Overview

Capital Fleet utilizes an unopinionated, performant, and predictable React state architecture combining:
1. **Root Application State:** Lifted into [apps/web/src/App.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx) for system-level concerns (authentication, active tab navigation, global notifications, modal triggers).
2. **Feature-Level State:** Encapsulated inside domain components (tables, modals, forms) using React `useState` and `useReducer`.
3. **Global React Contexts:** Dedicated providers for cross-cutting application concerns:
   - [ThemeContext.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/context/ThemeContext.tsx) (Theme toggling & persistence).
   - [Toast.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Toast.tsx) (Global notification queue).
4. **Browser Session & Storage:** `sessionStorage` for authentication tokens, `localStorage` for UI preferences.
5. **URL Query State:** Bi-directional synchronization between the browser address bar and active workspace tabs.

```mermaid
graph TD
    subgraph Browser Storage & URL
        URL["window.location.search (?tab=..., ?verify=...)"]
        SS["sessionStorage ('capital_fleet_token')"]
        LS["localStorage ('capital_fleet_theme')"]
    end

    subgraph React Contexts
        TC[ThemeContext: theme, toggleTheme]
        ToC[ToastContext: toasts, toast.success/error]
    end

    subgraph App.tsx (Root State)
        User[currentUser: User | null]
        View["currentView: 'landing' | 'login' | 'workspace'"]
        Tab[activeTab: string]
        Notifs[notifications: InAppNotification[]]
        Bookings[bookings: Booking[]]
        Modals[Modal Visibility & Active Entity States]
    end

    subgraph Domain Feature Views
        BRF[BookingRequestForm State]
        RRQ[ReviewRequestsQueue State]
        VIV[VehicleInventoryView State]
        DP[DriverPortalPage State]
    end

    URL <-->|Bi-directional Sync| Tab
    SS <-->|Hydrate / Persist| User
    LS <-->|Hydrate / Persist| TC

    User --> Domain Feature Views
    Tab --> Domain Feature Views
    Bookings --> Domain Feature Views
    Notifs --> Domain Feature Views
    Modals --> Domain Feature Views
```

---

## 2. Root State Management (`App.tsx`)

### 2.1 Core State Variables
In [apps/web/src/App.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx), the primary operational state comprises:

| State Variable | Type | Responsibility |
|---|---|---|
| `currentUser` | `User \| null` | Authenticated user profile, roles, and department metadata |
| `currentView` | `'landing' \| 'login' \| 'workspace'` | Top-level view routing between public landing, login, and dashboard |
| `activeTab` | `string` | Currently selected workspace view (e.g., `'dashboard'`, `'bookings'`, `'vehicles'`) |
| `notifications`| `InAppNotification[]` | User in-app notifications and alert items |
| `bookings` | `Booking[]` | Central cache of transportation requests |
| `isAppLoading` | `boolean` | Global loading state for full-screen splash loader |

### 2.2 Modal Coordination States
Modal dialogs are controlled at the root level to allow seamless cross-component workflows:
- `selectedBookingForDetails`: Controls [BookingDetailsModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingDetailsModal.tsx).
- `selectedBookingForReceipt`: Controls [DigitalReceiptModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/DigitalReceiptModal.tsx).
- `assigningBooking`: Controls [AssignVehicleModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx).
- `cancellingBooking`: Controls [CancelBookingModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/CancelBookingModal.tsx).
- `tripModalBooking`: Controls [TripExecutionModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/TripExecutionModal.tsx).
- `isProfileOpen`: Controls [ProfileModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/ProfileModal.tsx).

---

## 3. URL Synchronization Engine

### 3.1 Tab Synchronization
The active workspace tab is mirrored in the browser URL using HTML5 `window.history.replaceState`:

```typescript
useEffect(() => {
  if (typeof window !== 'undefined' && currentView === 'workspace') {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== activeTab) {
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url.toString());
    }
  }
}, [activeTab, currentView]);
```

**Benefits:**
- Reloading the browser preserves the user's active page.
- Direct links (e.g., `http://localhost:5173/?tab=vehicles`) immediately navigate to the target tab upon login.
- Does not pollute browser history with every tab switch.

### 3.2 Deep Linking Parameters
The frontend inspects URL parameters during initial bootstrap:
- `?verify=<id>` or `?ref=<code>`: Bypasses authentication, opening [PublicVerificationPage.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx).
- `?receipt=<id>`: Automatically fetches and opens the digital receipt modal for that booking ID.
- `?view=login`: Opens directly to the login interface.

---

## 4. Derived State Computation

To maintain high performance and prevent stale duplicate state, authorization flags and filtered lists are derived during render rather than stored in redundant state variables:

```typescript
// Derived Role Predicates
const isEmployee = currentUser?.role === 'EMPLOYEE';
const isLogisticsAdmin = currentUser?.role === 'LOGISTICS_ADMIN';
const isDriver = currentUser?.role === 'DRIVER';
const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';
const canAssignVehicles = isLogisticsAdmin || isSystemAdmin;

// Derived Filtered Bookings
const weeklyBookings = bookings.filter((b) => b.requestType === 'WEEKLY');
const pendingApprovalsCount = bookings.filter((b) => b.status === 'PENDING_APPROVAL').length;

// Derived Unread Notification Count
const unreadNotificationCount = notifications.filter((n) => !n.readAt).length;
```

---

## 5. Data Lifecycle, Caching, and Invalidation

### 5.1 Re-Fetching and Imperative Invalidation
Instead of relying on heavy caching layers, Capital Fleet utilizes **predictable imperative invalidation**. Whenever a mutation occurs (approval, assignment, cancellation), the parent view re-executes `refreshAllData()`:

```typescript
const refreshAllData = async () => {
  try {
    const [notifs, bookingsData] = await Promise.all([
      api.getNotifications(),
      api.getBookings(),
    ]);
    setNotifications(notifs);
    setBookings(bookingsData);
  } catch (err) {
    console.error('Failed to refresh data', err);
  }
};
```

### 5.2 Real-Time Polling Strategy
- **Notification Heartbeat:** In [Navbar.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/Navbar.tsx), a `setInterval` timer executes every **30 seconds**:
  ```typescript
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
      } catch (err) {
        // Silently catch background network polling errors
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);
  ```
- **Cleanup Guarantee:** All timers and event listeners return cleanup callbacks to prevent memory leaks on component unmount.

---

## 6. Stale Data Risks and Concurrency Mitigation

| Concurrency Scenario | Potential Risk | Implemented Mitigation |
|---|---|---|
| **Dual Logistics Officer Approval** | Two officers attempt to approve the same pending request simultaneously. | Backend checks booking status before mutation. The second request receives `400 Bad Request` ("Booking is no longer pending approval"). Frontend displays error toast and triggers `refreshAllData()`. |
| **Vehicle Assignment Conflict** | An officer assigns a vehicle that another officer just dispatched to a different booking. | Backend transaction verifies vehicle operational status (`status === 'ACTIVE'`). If already assigned, throws `409 Conflict`. Dispatch modal catches error and prompts user to re-select an available vehicle. |
| **Session Expiration During Edit** | User's JWT token expires while filling a transportation request form. | Submission catches `401 Unauthorized`, clears `sessionStorage`, prompts user to re-authenticate, and prevents data corruption. |
