# 06 — UI Components and Reusable Design System

This document provides a comprehensive, evidence-based technical specification of the frontend design system, CSS styling architecture, design tokens, and reusable UI components implemented in the **Capital Fleet** employee transportation management system.

---

## 1. Design System Overview and Token Architecture

The Capital Fleet frontend visual design is engineered using a custom Tailwind CSS configuration integrated with CSS custom variables and utility classes.

### 1.1 Color Palette & Tokens

The corporate palette defined in [apps/web/tailwind.config.js](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/tailwind.config.js) reflects Capital Real Estate's luxury automotive brand identity, anchored around flagship corporate crimson red, emerald green, and deep midnight navy:

| Token Category | Token Name | Hex Code | Semantic Role in UI |
|---|---|---|---|
| **Brand (Red)** | `brand-600` | `#dc2626` | Flagship corporate primary accent, primary CTA buttons, focus rings, brand badges |
| | `brand-50` to `brand-500` | `#fef2f2` - `#ef4444` | Light hover tints, error states, and gradient accents |
| | `brand-700` to `brand-950` | `#b91c1c` - `#450a0a` | Active button states, deep borders, and dark-theme red accents |
| **Brand Green** | `brandGreen-600` | `#16a34a` | Flagship corporate emerald green, approval buttons, active trip indicators |
| | `brandGreen-50` to `brandGreen-500` | `#f0fdf4` - `#22c55e` | Background washes for approved bookings and available fleet badges |
| | `brandGreen-700` to `brandGreen-950` | `#15803d` - `#052e16` | Active states for success CTAs and dark-mode green cards |
| **Navy / Slate** | `navy-900` | `#0f172a` | Midnight navy sidebar background, dark surface headers, primary brand contrast |
| | `navy-950` | `#090d16` | Ultra-dark background in dark mode, deep shell canvas |
| | `navy-800` | `#1c1917` | Neutral surface borders and elevated dark containers |
| **Status Tokens** | `status.available` | `#16a34a` | Fleet vehicle operational & ready status |
| | `status.assigned` | `#dc2626` | Vehicle dispatched to an active booking |
| | `status.pending` | `#f59e0b` | Transportation request pending administrative review |
| | `status.unavailable`| `#991b1b` | Out-of-service / maintenance lock |
| | `status.inactive` | `#64748b` | Decommissioned fleet asset |

### 1.2 Typography & Shadows

- **Font Family:** Configured in Tailwind as `'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`. Loaded via `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap')` in [apps/web/src/index.css](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/index.css).
- **Custom Shadows:**
  - `subtle`: `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)`
  - `card`: `0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)`
  - `floating`: `0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)`
  - `glow-red`: `0 0 20px -3px rgba(220, 38, 38, 0.35)`
  - `glow-green`: `0 0 20px -3px rgba(22, 163, 74, 0.35)`

### 1.3 Dark Mode Implementation

The application implements class-based dark mode (`darkMode: 'class'`) via [ThemeContext](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/context/ThemeContext.tsx). The root `<html>` element toggles the `dark` class, and styles adapt using standard Tailwind `dark:` variants (e.g., `bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800`).

---

## 2. Shared Core UI Primitives

All reusable UI atomic components reside in [apps/web/src/components/ui/](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/).

### 2.1 Button (`Button.tsx`)
- **Source File:** [apps/web/src/components/ui/Button.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Button.tsx)
- **Props Interface:**
  ```typescript
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'success' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  }
  ```
- **Variants:**
  - `primary`: Crimson red (`bg-brand-600 hover:bg-brand-700 text-white shadow-sm`)
  - `success`: Emerald green (`bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm`)
  - `secondary`: Navy dark (`bg-navy-900 hover:bg-navy-800 text-white`)
  - `outline`: Bordered card style (`border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200`)
  - `danger`: Critical action red (`bg-red-600 hover:bg-red-700 text-white`)
  - `ghost`: Transparent hover (`hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600`)
- **Key Features:** Forward ref support, loading state with Lucide `Loader2` spinner, automatic disabled propagation when `isLoading={true}`, micro-interaction click scale `active:scale-[0.99]`.

### 2.2 Card (`Card.tsx`)
- **Source File:** [apps/web/src/components/ui/Card.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Card.tsx)
- **Compound Components:**
  - `Card`: Root container with `rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm`.
  - `CardHeader`: Flex container for card titles and action menus.
  - `CardTitle`: Semantic heading (`<h3>`) with typography `text-lg font-bold text-slate-900 dark:text-white`.
  - `CardDescription`: Subtitle container (`text-sm text-slate-500 dark:text-slate-400`).
  - `CardContent`: Inner body padding container (`p-6 pt-0`).
  - `CardFooter`: Pinned bottom action tray (`flex items-center p-6 pt-0 border-t`).

### 2.3 Status Badge (`Badge.tsx`)
- **Source File:** [apps/web/src/components/ui/Badge.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Badge.tsx)
- **Props Interface:**
  ```typescript
  interface BadgeProps {
    status: BookingStatus | VehicleOperationalStatus | string;
    className?: string;
    size?: 'sm' | 'md';
  }
  ```
- **Status Mapping Table:**

| Input Status Key | Rendered Text Label | Pill Color Scheme | Dot Indicator Animation |
|---|---|---|---|
| `PENDING_APPROVAL` | "Pending approval" | Amber light / Dark amber | Static Amber dot |
| `APPROVED` | "Approved" | Blue light / Dark blue | Static Blue dot |
| `REJECTED` | "Rejected" | Red light / Dark red | Static Red dot |
| `ASSIGNED` | "Vehicle assigned" | Indigo light / Dark indigo | Static Indigo dot |
| `IN_PROGRESS` | "Trip in progress" | Emerald light / Dark emerald | **Animated pulsing dot** (`animate-pulse`) |
| `COMPLETED` | "Completed" | Slate light / Dark slate | Static Slate dot |
| `CANCELLED` | "Cancelled" | Slate light with line-through | Static Gray dot |
| `ACTIVE` / `AVAILABLE` | "Operational" / "Available" | Emerald green | Static Green dot |
| `MAINTENANCE` | "Under maintenance" | Amber warning | Static Amber dot |
| `OUT_OF_SERVICE` / `UNAVAILABLE` | "Out of service" / "Unavailable" | Crimson red | Static Red dot |
| `INACTIVE` | "Deactivated" | Slate muted | Static Muted dot |

### 2.4 Form Input (`Input.tsx`)
- **Source File:** [apps/web/src/components/ui/Input.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Input.tsx)
- **Features:**
  - Label association via `label` prop.
  - Left icon and right icon slots (e.g., search icon, calendar icon, password visibility toggle).
  - Validation error message rendering with `text-xs text-red-500 mt-1`.
  - Focus ring styled with `focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500`.

### 2.5 Modal Dialog (`Modal.tsx`)
- **Source File:** [apps/web/src/components/ui/Modal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Modal.tsx)
- **Architecture & Accessibility:**
  - **React Portal:** Renders directly into `document.body` via `createPortal`.
  - **Focus & Scroll Lock:** On open, sets `document.body.style.overflow = 'hidden'`, restored on unmount.
  - **Keyboard Esc:** Attaches window `keydown` listener for `Escape` to close modal.
  - **Aria Attributes:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="modal-title"`.
  - **Layout Sections:** Stationary header with title and close button, scrollable body (`overflow-y-auto overscroll-contain`), and stationary pinned footer.
  - **Max Width Configurations:** Supports `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`.

### 2.6 Smart Dropdown (`SmartDropdown.tsx`)
- **Source File:** [apps/web/src/components/ui/SmartDropdown.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/SmartDropdown.tsx)
- **Architecture:**
  - Computes viewport bounds on every open, scroll, or resize event using `getBoundingClientRect()`.
  - **Collision Prevention:** If distance below the trigger is less than 280px and space above is greater, flips placement from `bottom` to `top`.
  - **Viewport Clamping:** Clamps `maxHeight` dynamically so menus never exceed screen bounds or produce secondary viewport scrollbars.
  - **Portal Support:** Mounts to `document.body` when `portal={true}` to prevent CSS overflow clipping inside table cells or flex rows.
  - **Outside Click & Esc:** Closes automatically on outside click or `Escape` keypress.

### 2.7 Toast Notification System (`Toast.tsx`)
- **Source File:** [apps/web/src/components/ui/Toast.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Toast.tsx)
- **Types:** `success`, `error`, `warning`, `info`.
- **Display Position:** Fixed bottom-right corner (`fixed bottom-4 right-4 z-50 flex flex-col gap-2.5`).
- **Features:** Auto-dismissal timers (default 5000ms), manual dismissal button, optional action button callback.

### 2.8 Alert Banner (`Alert.tsx`)
- **Source File:** [apps/web/src/components/ui/Alert.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/Alert.tsx)
- **Variants:** `info` (blue), `success` (green), `warning` (amber), `danger` (red).
- **Features:** Integrated Lucide icons (`AlertCircle`, `CheckCircle2`, `AlertTriangle`, `Info`), optional close button callback.

### 2.9 Error Boundary (`ErrorBoundary.tsx`)
- **Source File:** [apps/web/src/components/ui/ErrorBoundary.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/ui/ErrorBoundary.tsx)
- **Features:** React class component implementing `componentDidCatch` and `getDerivedStateFromError`, capturing unhandled rendering errors and presenting a branded recovery screen with "Reload Page" or "Return to Dashboard" actions.

---

## 3. Specialized Automotive & Telematics Components

Capital Fleet features domain-specific automotive components designed for executive fleet coordination:

### 3.1 Automotive Journey Spine (`AutomotiveJourneySpine.tsx`)
- **Source File:** [apps/web/src/components/automotive/AutomotiveJourneySpine.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/automotive/AutomotiveJourneySpine.tsx)
- **Purpose:** Renders the end-to-end operational lifecycle of an employee transportation request across 5 distinct milestone nodes:
  1. `REQUESTED`: Initial booking creation with timestamp and requesting employee.
  2. `APPROVED`: Administrative logistics approval with officer audit stamp.
  3. `ASSIGNED`: Vehicle and chauffeur assignment with vehicle plate and driver badge.
  4. `IN_PROGRESS`: Active transit dispatch with live telemetry link.
  5. `COMPLETED`: Safe trip conclusion and odometer recording.
- **Visual Features:** Colored milestone node pills, active pulse animation on current step, connective highway lines with gradient fills, vehicle metadata card, and one-click Gate Pass verification button.

### 3.2 Highway Section Connector (`HighwaySectionConnector.tsx`)
- **Source File:** [apps/web/src/components/automotive/HighwaySectionConnector.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/automotive/HighwaySectionConnector.tsx)
- **Purpose:** Renders an animated SVG visual connector representing a multi-lane highway between booking timeline milestones.

### 3.3 Dynamic Fleet Route Simulation (`DynamicFleetRouteSimulation.tsx`)
- **Source File:** [apps/web/src/components/telematics/DynamicFleetRouteSimulation.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/telematics/DynamicFleetRouteSimulation.tsx)
- **Size & Complexity:** 50 KB, 1,200+ lines of specialized telematics simulation logic.
- **Addis Ababa Telematics Waypoints:** Contains geographic waypoints modeled along real corporate arterial corridors:
  - Bole International Airport -> Bole Medhanealem -> Atlas -> Meskel Square -> Capital Real Estate HQ (Gotera) -> Sarbet -> CMC Road.
- **Simulated Telematics Metrics:**
  - Real-time GPS coordinate interpolation ($60\text{ fps}$ requestAnimationFrame).
  - Vehicle speed ($0 - 65\text{ km/h}$) with realistic traffic deceleration.
  - Engine coolant temperature ($85^\circ\text{C} - 94^\circ\text{C}$).
  - Fuel level percentage and battery charge status.
  - Telematics ping latency ($12\text{ms} - 45\text{ms}$).
  - Dynamic bearing/heading rotation angle for SVG vehicle icon.

### 3.4 Automotive Loading Screen (`AutomotiveLoadingScreen.tsx`)
- **Source File:** [apps/web/src/components/loading/AutomotiveLoadingScreen.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/loading/AutomotiveLoadingScreen.tsx)
- **Purpose:** Full-screen initial bootloader with an animated tachometer gauge, RPM sweep, and cycling fleet telemetry status messages ("Initializing Telematics Grid...", "Connecting to Capital Fleet Gateway...").

### 3.5 Notification Details Modal (`NotificationDetailsModal.tsx`)
- **Source File:** [apps/web/src/components/notifications/NotificationDetailsModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/notifications/NotificationDetailsModal.tsx)
- **Purpose:** Specialized inspection dialog for push/event notifications, parsing JSON payloads, presenting route links, and allowing users to mark notifications as read.

---

## 4. Layout & Navigation Components

### 4.1 Application Shell (`AppShell.tsx`)
- **Source File:** [apps/web/src/components/layout/AppShell.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/AppShell.tsx)
- **Layout Architecture:**
  - Outer viewport wrapper with `min-h-screen bg-slate-50 dark:bg-slate-950 flex`.
  - Stationary or responsive collapsible sidebar on the left.
  - Main content column with stationary `Navbar` at top and scrollable `<main>` container with responsive padding (`p-4 sm:p-6 lg:p-8`).

### 4.2 Navigation Bar (`Navbar.tsx`)
- **Source File:** [apps/web/src/components/layout/Navbar.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/Navbar.tsx)
- **Features:**
  - Mobile hamburger toggle for sidebar drawer.
  - Global real-time search input (`Cmd+K` keyboard shortcut).
  - Quick "New Request" shortcut button.
  - Notification dropdown bell with unread badge counter and real-time polling listener.
  - Dark mode / light mode toggle button.
  - User profile avatar dropdown with role badge, profile modal trigger, and logout action.

### 4.3 Sidebar Navigation (`Sidebar.tsx`)
- **Source File:** [apps/web/src/components/layout/Sidebar.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/Sidebar.tsx)
- **Role-Based Tab Filtering:**
  - Filters navigation items based on active `user.role`:
    - `EMPLOYEE`: Dashboard, New Request, My Bookings, Profile.
    - `LOGISTICS_ADMIN`: Fleet Overview, Requests & Approvals, Dispatch & Assignment, Vehicle Inventory, Driver Directory, Maintenance Logs, Reports, Analytics, Audit Trail.
    - `DRIVER`: Chauffeur Portal, Assigned Trips, Vehicle Inspection, Trip Log.
    - `SYSTEM_ADMIN`: Full system access including User Management, Department Management, and System Settings.
- **Active State Highlighting:** Applies `bg-brand-600 text-white font-semibold shadow-sm` to currently active tab.

---

## 5. UI/UX Verification and Audit Summary

| Component | Status | Verified Capabilities | Observed Limitations / Notes |
|---|---|---|---|
| `Button.tsx` | **Verified** | 6 variants, 3 sizes, loading spinners, disabled states, ref forwarding | Works reliably across all pages |
| `Card.tsx` | **Verified** | Standard compound card layout, light/dark borders | Consistent surface styling |
| `Badge.tsx` | **Verified** | 11 status types, pulse animation for `IN_PROGRESS`, line-through for `CANCELLED` | Used in all tables and cards |
| `Input.tsx` | **Verified** | Form labels, left/right icons, error messages, focus rings | Controlled by React state |
| `Modal.tsx` | **Verified** | Body scroll lock, Escape key, backdrop click, responsive max widths, Portal | Stationary footer prevents overflow |
| `SmartDropdown.tsx`| **Verified** | Automatic top/bottom collision flip, viewport height clamping, Portal | Used in Navbar notifications and profile |
| `Toast.tsx` | **Verified** | Context integration, 4 toast variants, auto-timeout | Displayed in all form submissions |
| `AutomotiveJourneySpine.tsx` | **Verified** | 5-step milestone tracking, gate pass trigger, timestamp display | Renders complete booking lifecycle |
| `DynamicFleetRouteSimulation.tsx` | **Verified** | 60fps canvas/SVG animation, real Addis Ababa waypoints, speed/temp gauges | Verified in Live Telematics tab |
| `ErrorBoundary.tsx` | **Verified** | Catches rendering exceptions, fallback recovery button | Wrapped around page render area |

The design system demonstrates a cohesive, production-grade automotive aesthetic with high component reuse, consistent dark-mode styling, and zero reliance on heavy third-party UI component suites like Material UI or Ant Design.
