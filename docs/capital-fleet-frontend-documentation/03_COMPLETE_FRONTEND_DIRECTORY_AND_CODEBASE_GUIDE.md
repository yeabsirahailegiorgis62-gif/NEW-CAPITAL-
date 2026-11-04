# Capital Fleet Management System
## Deliverable 03: Complete Frontend Directory & Codebase Guide

**Document ID:** `DOC-03`  
**Classification:** Codebase Architecture & Source Reference  
**Status:** **Verified** against active repository filesystem (58 source files inspected)  

---

## 1. Frontend Directory Structure Overview

The frontend source code is organized into a feature-sliced directory structure located under [`apps/web/src/`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src):

```
apps/web/src/
├── App.tsx                                      # Root application shell & state-driven tab router
├── main.tsx                                     # Application bootstrap & provider hierarchy
├── index.css                                    # Design system tokens, Tailwind directives & print styles
│
├── components/                                  # Reusable presentation and layout components
│   ├── automotive/                              # Cockpit-themed visual elements
│   │   ├── AutomotiveJourneySpine.tsx           # Vertical trip milestone progress tracker
│   │   └── HighwaySectionConnector.tsx          # Visual road line separator element
│   ├── layout/                                  # Persistent chrome and navigation
│   │   ├── AppShell.tsx                         # Core wrapper with sidebar, navbar, and main viewport
│   │   ├── Navbar.tsx                           # Top bar with notifications, profile avatar, theme toggle
│   │   ├── ProfileModal.tsx                     # User profile inspector dialog
│   │   └── Sidebar.tsx                          # Role-filtered vertical navigation drawer
│   ├── loading/                                 # Visual feedback and loading screens
│   │   └── AutomotiveLoadingScreen.tsx          # Cockpit-themed vehicle radar loading overlay
│   ├── notifications/                           # Event alerts
│   │   └── NotificationDetailsModal.tsx         # Detailed inspection modal for in-app notifications
│   ├── telematics/                              # Fleet movement simulation
│   │   └── DynamicFleetRouteSimulation.tsx      # SVG canvas simulating vehicle transit progress
│   └── ui/                                      # Atomic reusable UI primitives
│       ├── Alert.tsx                            # Dismissible contextual alert banner
│       ├── Badge.tsx                            # Status pills (PENDING, APPROVED, ASSIGNED, COMPLETED)
│       ├── BrandLogo.tsx                        # Capital Real Estate corporate crest & typography
│       ├── Button.tsx                           # Polymorphic button (primary, outline, ghost, danger)
│       ├── Card.tsx                             # Glassmorphism container with header, content, footer
│       ├── ErrorBoundary.tsx                    # React error boundary preventing white-screen crashes
│       ├── Input.tsx                            # Form input with label, icon, and validation error
│       ├── Modal.tsx                            # Accessible backdrop dialog with focus trapping
│       ├── SmartDropdown.tsx                    # Filterable search select component
│       └── Toast.tsx                            # Global toast notification provider & banner
│
├── context/                                     # Global React Context providers
│   └── ThemeContext.tsx                         # Dark / Light theme provider with localStorage sync
│
├── features/                                    # Domain-specific business modules
│   ├── admin/                                   # Administrative management
│   │   ├── AddEmployeeModal.tsx                 # Staff user creation modal
│   │   ├── AuditLogsView.tsx                    # Immutable audit log search, filter & CSV export
│   │   ├── DepartmentsManagementView.tsx        # Department CRUD management
│   │   ├── SystemSettingsView.tsx               # Security, password & lockout configuration
│   │   └── UsersManagementView.tsx              # Staff directory, roles & password reset triggers
│   ├── auth/                                    # Authentication features
│   │   └── ForgotPasswordModal.tsx              # Password reset request modal
│   ├── availability/                            # Fleet scheduling views
│   │   └── AvailabilityCalendar.tsx             # Interactive fleet availability timeline view
│   ├── bookings/                                # Transportation requisition features
│   │   ├── BookingDetailsModal.tsx              # Full booking details modal with approval-aware actions
│   │   ├── BookingRequestForm.tsx               # Daily & Weekly multi-day requisition input form
│   │   ├── BookingsTable.tsx                    # Interactive filterable transport requests data grid
│   │   ├── BookingVerificationModal.tsx         # Quick QR scan verification dialog
│   │   ├── CancelBookingModal.tsx               # Booking cancellation with mandatory reason capture
│   │   ├── DigitalReceiptModal.tsx              # Cryptographic QR receipt voucher
│   │   └── PrintableTransportFormModal.tsx      # Printable corporate transport voucher (@media print)
│   ├── dashboard/                               # Role-specific primary cockpit dashboards
│   │   ├── AdminAnalyticsDashboard.tsx          # Executive fleet KPIs, utilization & cost analytics
│   │   ├── DriverDashboard.tsx                  # Chauffeur mobile cockpit with odometer inputs
│   │   ├── EmployeeDashboard.tsx                # Staff personal trip status & quick requisition hub
│   │   └── LogisticsDashboard.tsx               # Logistics dispatch command center & pending queues
│   ├── drivers/                                 # Chauffeur administration
│   │   └── DriversManagementView.tsx            # Chauffeur registry, licensing & shift assignments
│   ├── logistics/                               # Fleet allocation & dispatch operations
│   │   ├── AssignVehicleModal.tsx               # Vehicle & chauffeur allocation with conflict check
│   │   ├── ReviewRequestsQueue.tsx              # Pending review queue with approval/decline triggers
│   │   └── TripExecutionModal.tsx               # Chauffeur trip confirmation, start & completion
│   ├── maintenance/                             # Fleet workshop management
│   │   └── MaintenanceView.tsx                  # Service history, scheduled maintenance & tickets
│   ├── profile/                                 # User profile features
│   │   └── ProfileSettingsView.tsx              # Profile editing & self-service password changes
│   ├── reports/                                 # Operational reporting
│   │   └── ReportsHubView.tsx                   # Fleet analytics, trip metrics & sanitized CSV exports
│   └── vehicles/                                # Master fleet inventory
│       ├── VehicleInventoryView.tsx             # Vehicle catalog with status pills & specs
│       └── VehicleModal.tsx                     # Vehicle creation & editing dialog
│
├── lib/                                         # Shared utilities and network clients
│   ├── api.ts                                   # Centralized ApiClient class for all backend requests
│   ├── csvExport.ts                             # Formula-injection-safe CSV export utility
│   ├── imageUtils.ts                            # Fallback vehicle image generation & optimization
│   └── utils.ts                                 # Ethiopian DateTime formatter & Tailwind class merger
│
├── pages/                                       # Top-level standalone views
│   ├── LandingPage.tsx                          # Public corporate portal welcome view
│   ├── LoginPage.tsx                            # User login screen with role credentials demo helper
│   └── PublicVerificationPage.tsx               # Unauthenticated public QR gate clearance pass
│
└── types/                                       # TypeScript type definitions
    └── index.ts                                 # Master domain entities, enums & API response models
```

---

## 2. Key File Responsibilities & Symbol Inventory

### 2.1 Core Application Shell ([`apps/web/src/App.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx))
- **Responsibility:** Acts as the central state coordinator and application shell router. Manages `currentUser`, `activeTab`, `currentView` (`'landing' | 'login' | 'workspace'`), in-app notifications, and modal view states.
- **Key Hooks & State:**
  - `const [activeTab, setActiveTab] = useState<string>(...)`: Initialized from URL query param `?tab=...` and synchronized with `window.history.replaceState`.
  - `const [currentUser, setCurrentUser] = useState<User | null>(...)`: Holds authenticated user session.
- **Export:** `export function App()`

### 2.2 Application Bootstrap ([`apps/web/src/main.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/main.tsx))
- **Responsibility:** Bootstraps the React virtual DOM tree into `#root`.
- **Provider Chain:** Mounts `<ErrorBoundary>` -> `<ToastProvider>` -> `<ThemeProvider>` -> `<App />`.
- **Export:** Entry point (executes `ReactDOM.createRoot`).

### 2.3 Centralized Network Client ([`apps/web/src/lib/api.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/lib/api.ts))
- **Responsibility:** Singleton API client encapsulating all HTTP communication with the NestJS backend.
- **Key Methods:**
  - `login(credentials)`: Submits credentials, stores JWT in `sessionStorage('capital_fleet_token')`.
  - `getBookings()`, `createBooking()`, `approveBooking()`, `rejectBooking()`, `assignVehicle()`, `autoAssign()`: Full booking lifecycle API methods.
  - `getAuditLogs()`: Fetches immutable security journal entries.
- **Export:** `export const api = new ApiClient()`

### 2.4 Staff Requisition Form ([`apps/web/src/features/bookings/BookingRequestForm.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingRequestForm.tsx))
- **Responsibility:** Provides tabbed Daily and Weekly transportation request inputs. Enforces company policy notice checks and strictly bars vehicle/driver selection.
- **Export:** `export const BookingRequestForm: React.FC<Props>`

### 2.5 Dispatch Review Queue ([`apps/web/src/features/logistics/ReviewRequestsQueue.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/ReviewRequestsQueue.tsx))
- **Responsibility:** Renders incoming requests awaiting review. Exposes one-click approval and modal rejection. Assignment actions are strictly hidden on `PENDING_APPROVAL` items.
- **Export:** `export const ReviewRequestsQueue: React.FC<Props>`

### 2.6 Gate Security Scanner ([`apps/web/src/pages/PublicVerificationPage.tsx`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/pages/PublicVerificationPage.tsx))
- **Responsibility:** Unauthenticated standalone view for gate guards to scan physical/digital QR codes and verify pass authenticity in under 3 seconds.
- **Export:** `export const PublicVerificationPage: React.FC`

---

## 3. Codebase Quality & Coupling Observations

1. **Tight Coupling in App.tsx:** `App.tsx` directly renders modal dialogs and tab views. While highly reliable and easy to trace, decomposing sub-tab routing into dedicated route configurations will improve long-term modularity.
2. **Duplicated Modal Logic:** Modals (`BookingDetailsModal`, `AssignVehicleModal`, `CancelBookingModal`) independently manage escape-key listeners and backdrop rendering rather than always wrapping `<Modal>`.
3. **Absence of Dead Files:** All 58 inspected files are actively referenced within the import graph; no orphan or abandoned components were discovered.
