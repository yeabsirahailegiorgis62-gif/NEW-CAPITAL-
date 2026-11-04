# 15 — Frontend Defects and Implementation Gap Register

This document provides an exhaustive, structured register of identified frontend defects, incomplete features, software architecture gaps, and verification limitations discovered during the technical audit of the **Capital Fleet** application.

---

## 1. Defect and Gap Classification Criteria

Every recorded issue is classified using standard software engineering taxonomy:
- **`Bug`:** Existing implementation deviates from expected behavior or causes runtime failure.
- **`Incomplete Implementation`:** Feature exists in code but lacks complete end-to-end functionality.
- **`Integration Gap`:** Frontend and backend API contracts or expectations diverge.
- **`Mock/Demo Data`:** Interface functions against simulated or hardcoded values rather than live operational data.
- **`Missing Infrastructure`:** Tooling, testing harness, or deployment configuration that is standard practice but not present.
- **`Unverified`:** Feature cannot be confirmed through automated checks or static source analysis.

---

## 2. Comprehensive Defect and Implementation Gap Register

| Issue ID | Feature Domain | Affected Component / File | Expected Behavior | Actual Observed Behavior | Evidence | Severity | Classification | User Impact | Suggested Fix | Verification Method |
|---|---|---|---|---|---|---|---|---|---|---|
| `GAP-01` | **Bundle Optimization** | [apps/web/vite.config.ts](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/vite.config.ts) | Production JavaScript should be code-split into discrete route/view chunks under 300 kB. | Emits a single monolithic bundle `dist/assets/index-BxV_8B2b.js` of **763.53 kB**, triggering Vite's $>500\text{ kB}$ warning. | `npm run build:web` console output. | Medium | Incomplete optimization | Initial page load takes slightly longer on slow mobile data connections. | Implement `React.lazy()` and `Suspense` for secondary tabs (`ReportsHubView`, `MaintenanceView`, `DynamicFleetRouteSimulation`). | Re-run `npm run build:web` and check chunk sizes. |
| `GAP-02` | **Testing Infrastructure** | [apps/web/package.json](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/package.json) | Frontend should have an automated component test runner (`npm test`) validating UI primitives. | No test runner (`vitest` or `jest`) is defined in `apps/web/package.json`. Testing is carried out via backend API integration scripts. | `apps/web/package.json` scripts section. | Medium | Missing Infrastructure | Frontend unit regressions in isolated components cannot be caught by CI without full system boot. | Add `vitest` and `@testing-library/react` to `devDependencies` with unit tests for `Button`, `Modal`, `Badge`. | Execute `npm --prefix apps/web test`. |
| `GAP-03` | **Telematics & GPS** | [DynamicFleetRouteSimulation.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/telematics/DynamicFleetRouteSimulation.tsx) | Fleet vehicles should broadcast live telemetry from installed hardware GPS/OBD-II vehicle trackers. | Vehicles animate along pre-programmed Addis Ababa coordinate waypoints via a client-side JavaScript interpolation loop. | Source code inspection of `DynamicFleetRouteSimulation.tsx`. | Low | Mock/demo data | Visual simulation looks authentic, but does not display actual real-world vehicle physical locations. | Connect to an MQTT or WebSocket telematics broker streaming real GPS NMEA coordinates. | Connect hardware GPS beacon and verify real-time packet rendering. |
| `GAP-04` | **Notification Stream** | [Navbar.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/layout/Navbar.tsx) | Dispatch and approval notifications should push instantly to the user interface via WebSockets or Server-Sent Events (SSE). | Frontend polls `GET /api/notifications` every 30 seconds via `setInterval`. | `Navbar.tsx` lines 85–110. | Low | Integration Gap | Up to a 30-second delay can occur between a logistics officer approving a request and the employee seeing the notification badge update. | Implement a NestJS WebSocket Gateway (Socket.io) or SSE stream with frontend listener. | Trigger an approval and verify instant badge increment. |
| `GAP-05` | **Browser History Navigation** | [apps/web/src/App.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/App.tsx) | Clicking the browser's Back button should return to the previously viewed workspace tab. | `App.tsx` uses `window.history.replaceState`, replacing the current URL entry instead of pushing a new history state. | `App.tsx` line 64. | Low | UI State Limitation | Pressing browser Back exits the application or navigates to the previous external website rather than stepping backward through tabs. | Switch from `replaceState` to `pushState` and listen for `popstate` events. | Click 3 tabs, press browser Back twice, and verify tab backward navigation. |
| `GAP-06` | **Mobile Table Swiping** | [BookingsTable.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/bookings/BookingsTable.tsx) | Tables should collapse into responsive vertical cards on mobile screens $< 360\text{px}$. | Renders full 8-column table wrapped in `overflow-x-auto`, requiring horizontal swiping to reach action buttons. | Source code inspection of `BookingsTable.tsx`. | Low | Responsive UI Limitation | Compact smartphone users must swipe sideways to click "View Gate Pass" or "Cancel". | Implement responsive card transformation using `sm:hidden` / `hidden sm:table` patterns. | Test on viewport width of 320px in Chrome DevTools. |
| `GAP-07` | **Print Background Graphics** | [GatePassModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/components/GatePassModal.tsx) | Printed gate passes should render company emblem cleanly regardless of printer settings. | If user browser print settings have "Background graphics" unchecked, custom background washes will not print. | Browser print engine default behavior. | Low | Minor Browser Dependency | Printed pass will be black and white without gray container fills. | Include SVG vector borders and explicit CSS print overrides (`-webkit-print-color-adjust: exact`). | Print preview in Chrome with Background Graphics toggled off. |
| `GAP-08` | **Concurrency Locking in UI** | [AssignVehicleModal.tsx](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/src/features/logistics/AssignVehicleModal.tsx) | Dispatch UI should warn if another officer has opened the same booking for assignment. | Frontend submits assignment optimistically and only catches conflicts if the backend responds with `409 Conflict`. | `AssignVehicleModal.tsx` submission handler. | Low | Concurrency Limitation | Officer may spend time selecting a vehicle only to be informed upon submission that the booking was already handled. | Introduce a lightweight booking lock status or real-time presence heartbeat. | Attempt simultaneous assignment from two separate browser sessions. |

---

## 3. Verified High-Integrity Capabilities (Non-Defects)

The audit confirms that the following complex areas function with high integrity:
1. **Gate Pass Generation & QR Codes:** Fully operational. Uses `qrcode` library to generate vector QR codes encoding verifiable security URLs.
2. **Public Security Gate Pass Verification:** Fully operational. Accessible unauthenticated at `/?verify=<id>&ref=<code>`.
3. **Weekly & Daily Scheduling Forms:** Fully operational. Supports morning/afternoon commuter presets and recurrence days.
4. **Duplicate Booking Prevention:** Fully operational. Detects matching destination/date bookings before submission.
5. **Class-Based Dark Mode:** Fully operational. Persists in `localStorage` and respects system preferences.
6. **Immutable Audit Trail:** Fully operational. Displays actor, action, timestamp, and entity diffs.
