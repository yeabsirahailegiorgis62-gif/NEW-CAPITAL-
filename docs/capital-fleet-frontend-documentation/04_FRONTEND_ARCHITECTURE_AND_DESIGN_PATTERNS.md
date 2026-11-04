# Capital Fleet Management System
## Deliverable 04: Frontend Architecture & Design Patterns

**Document ID:** `DOC-04`  
**Classification:** Software Architecture & Structural Design Document  
**Status:** **Verified** against active React implementation  

---

## 1. Architectural Style & Composition

The Capital Fleet frontend is built as a **Component-Based Single Page Application (SPA)** using React 18 and TypeScript. The application does not follow a strict backend pattern like Clean Architecture or MVVM; rather, it implements a pragmatic **Feature-Sliced Container/Presenter Architecture** organized around domain workflows:

```
┌────────────────────────────────────────────────────────┐
│                   App (Root Shell)                     │
│         Manages Session, View State & Active Tab       │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      AppShell (Layout)         Public Views (Unauthenticated)
    ┌─────────┴─────────┐         - LandingPage
    │                   │         - LoginPage
Sidebar (Nav)       Navbar (Status) - PublicVerificationPage
    │                   │
    └─────────┬─────────┘
              ▼
    Active Feature Container
    - EmployeeDashboard / BookingRequestForm
    - LogisticsDashboard / ReviewRequestsQueue
    - DriverDashboard / TripExecutionModal
    - AdminAnalyticsDashboard / AuditLogsView
```

---

## 2. Application Bootstrap Pipeline

The startup sequence from browser load to rendered DOM is traced below:

```mermaid
sequenceDiagram
    autonumber
    actor User as Browser Client
    participant Main as apps/web/src/main.tsx
    participant ErrB as ErrorBoundary
    participant Toast as ToastProvider
    participant Theme as ThemeProvider
    participant App as App.tsx
    participant API as ApiClient (api.ts)

    User->>Main: Loads index.html & executes main.tsx
    Main->>ErrB: Mounts ErrorBoundary (Crash Protection)
    ErrB->>Toast: Mounts ToastProvider (Context)
    Toast->>Theme: Mounts ThemeProvider (Dark/Light DOM Class)
    Theme->>App: Mounts App Component
    App->>App: Checks URL params (?token, ?verify, ?tab)
    App->>API: Checks sessionStorage('capital_fleet_token')
    alt Token Exists
        App->>API: GET /api/auth/me (Validate Active Session)
        API-->>App: Returns Authenticated User Object
        App->>App: setCurrentUser(user) & setCurrentView('workspace')
        App->>API: Fetches Bookings & Notifications
    else No Token / Public Scan
        App->>App: setCurrentView('landing' or 'public_verify')
    end
    App-->>User: Renders Cockpit Dashboard or Gate Scanner
```

---

## 3. Component Composition Hierarchy

The application organizes UI elements into clear hierarchical levels:

1. **Top-Level Root Containers:**
   - [`App.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx): Coordinates global state, active tabs, and modals.
   - [`AppShell.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/AppShell.tsx): Manages responsive sidebar drawer and header chrome.
2. **Domain-Specific Feature Views (`src/features/*`):**
   - Encapsulate data fetching, form handling, and user actions for a specific workflow (e.g., `ReviewRequestsQueue`, `AssignVehicleModal`, `DriverDashboard`).
3. **Atomic UI Primitives (`src/components/ui/*`):**
   - Stateless, reusable design primitives (`Button`, `Card`, `Badge`, `Input`, `Modal`, `SmartDropdown`).
4. **Automotive & Telematics Widgets (`src/components/automotive/*`):**
   - Visual progress indicators (`AutomotiveJourneySpine`, `DynamicFleetRouteSimulation`).

---

## 4. State Ownership & Data Flow Architecture

Data flows strictly downward via props and upward via event callbacks, complemented by React Context for cross-cutting concerns:

```mermaid
graph TD
    subgraph GlobalContexts ["Cross-Cutting Contexts"]
        TC["ThemeContext (Dark/Light)"]
        TC2["ToastContext (Global Alerts)"]
    end

    subgraph StateCoordinator ["App.tsx (Root State)"]
        UserSession["currentUser: User | null"]
        ActiveTab["activeTab: string (?tab=...)"]
        ModalState["selectedBookingForDetails / Receipt / Assign"]
        BookingsList["bookings: Booking[]"]
    end

    subgraph FeatureComponents ["Feature Modules"]
        ReqForm["BookingRequestForm (Local Form State)"]
        RevQueue["ReviewRequestsQueue (Filter Tabs)"]
        DriverConsole["DriverDashboard (Odometer Inputs)"]
        AuditView["AuditLogsView (Search & Action Filters)"]
    end

    subgraph APIClient ["lib/api.ts (Singleton)"]
        HTTP["ApiClient (Bearer JWT Injection)"]
    end

    StateCoordinator -->|Props & Callbacks| FeatureComponents
    FeatureComponents -->|Mutations| HTTP
    HTTP -->|Resolved Entities| StateCoordinator
    StateCoordinator --> GlobalContexts
```

---

## 5. Architectural Design Patterns Formally Identified

The codebase demonstrates several well-established software engineering patterns:

### 5.1 Singleton Pattern (`ApiClient`)
- **Evidence:** [`apps/web/src/lib/api.ts:494`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts#L494) exports a single shared instance: `export const api = new ApiClient()`.
- **Purpose:** Centralizes authorization header management, base URL resolution, and network error parsing.

### 5.2 Provider Pattern (`ThemeContext`, `ToastContext`)
- **Evidence:** [`ThemeContext.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/context/ThemeContext.tsx) and [`Toast.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Toast.tsx).
- **Purpose:** Avoids prop-drilling for theme toggling and notification banners across deeply nested views.

### 5.3 Compound Component Pattern (`Card`, `Modal`)
- **Evidence:** [`Card.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Card.tsx) exports `Card`, `CardHeader`, `CardTitle`, `CardContent`, and `CardFooter`.
- **Purpose:** Enables flexible, declarative visual composition while maintaining unified styling rules.

### 5.4 Controlled Component Pattern (Forms)
- **Evidence:** [`BookingRequestForm.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx#L40-L75).
- **Purpose:** Form inputs bind strictly to React state (`formData.destination`, `formData.departureAt`), validating constraints prior to submission.
