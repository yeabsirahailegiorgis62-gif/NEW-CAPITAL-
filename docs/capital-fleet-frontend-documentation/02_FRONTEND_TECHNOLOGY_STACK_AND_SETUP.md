# Capital Fleet Management System
## Deliverable 02: Frontend Technology Stack & Local Environment Setup

**Document ID:** `DOC-02`  
**Classification:** Technical Architecture & Developer Environment Manual  
**Status:** **Verified** against active repository configuration  

---

## 1. Verified Frontend Technology Inventory

The frontend architecture was inspected directly from [`apps/web/package.json`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/package.json), [`apps/web/vite.config.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/vite.config.ts), and the `apps/web/src/` source tree.

### 1.1 Complete Technology Matrix

| Technology / Library | Exact Version | Classification | Architectural Role in Capital Fleet | Verification Source |
|:---|:---|:---|:---|:---|
| **React** | `18.2.0` | Core UI Framework | Component composition, virtual DOM reconciliation, state & effect hooks (`useState`, `useEffect`, `useMemo`, `useRef`). | `apps/web/package.json:17` |
| **ReactDOM** | `18.2.0` | DOM Renderer | Root application mounting (`createRoot`), modal portal rendering (`createPortal`). | `apps/web/src/main.tsx:9` |
| **TypeScript** | `5.2.2` | Programming Language | Static typing, interface contracts (`Booking`, `Vehicle`, `User`), compile-time defect prevention. | `apps/web/package.json:29` |
| **Vite** | `5.1.6` | Build Tool & Dev Server | Fast ESM Hot Module Replacement (HMR), production Rollup bundling, local reverse proxy. | `apps/web/vite.config.ts` |
| **Tailwind CSS** | `3.4.1` | Styling Framework | Utility-first styling, corporate color palette, dark mode classes, glassmorphism filters. | `apps/web/tailwind.config.js` |
| **PostCSS** | `8.4.38` | CSS Tooling | CSS transformation pipeline enabling vendor prefixing and Tailwind nesting. | `apps/web/package.json:27` |
| **Autoprefixer** | `10.4.19` | CSS Postprocessor | Injects browser vendor prefixes (`-webkit-`, `-moz-`) for cross-browser visual consistency. | `apps/web/package.json:26` |
| **Lucide React** | `0.359.0` | Icon Library | High-scannability SVG icons (automotive, logistics, navigation, action indicators). | `apps/web/package.json:15` |
| **node-qrcode** | `1.5.4` | Security Utilities | Client-side 2D barcode generation for transport gate clearance passes. | `apps/web/package.json:16` |
| **date-fns** | `3.6.0` | Date Processing | Date calculations, difference intervals, formatting utilities. | `apps/web/package.json:14` |
| **clsx / tailwind-merge** | `2.1.0 / 2.2.2` | Class Utilities | Dynamic CSS class merging without utility conflicts (`cn(...)` helper). | `apps/web/src/lib/utils.ts:4` |
| **@tanstack/react-query** | `5.28.4` | Data Tooling (Installed) | Installed dependency; core data fetching currently uses unified `ApiClient`. | `apps/web/package.json:12` |
| **Fetch API (Native)** | Built-in | Network Client | Centralized HTTP client (`ApiClient`) in `apps/web/src/lib/api.ts` with JWT Bearer injection. | `apps/web/src/lib/api.ts:25` |

---

## 2. Distinction Between Stack Categories

For academic accuracy in internship reports:
- **Language (TypeScript):** Provides compile-time contracts, eliminating undefined property errors common in enterprise JavaScript SPAs.
- **Framework (React):** Manages view lifecycle and declarative state binding; does not dictate backend protocols or styling.
- **Build Tool (Vite):** Pre-bundles dependencies with esbuild, serves source files over native ESM, and bundles production assets via Rollup.
- **Styling (Tailwind CSS):** Compiles utility classes into an optimized production stylesheet (`index.css`), avoiding CSS runtime overhead.

---

## 3. Configuration Files & Path Aliases

### 3.1 Vite Configuration ([`apps/web/vite.config.ts`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/vite.config.ts))
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Standard path alias for clean imports
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4100', // Automatic forwarding to NestJS API
        changeOrigin: true,
      },
    },
  },
});
```

### 3.2 TypeScript Configuration ([`apps/web/tsconfig.json`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/tsconfig.json))
- Target: `ES2020`
- Module: `ESNext`
- Module Resolution: `bundler`
- Strict Mode: Enabled (`"strict": true`)
- JSX: `react-jsx`

---

## 4. Package Scripts Reference

The following npm scripts are defined in [`package.json`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/package.json) and [`apps/web/package.json`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/package.json):

```bash
# Monorepo Scripts (Root package.json)
npm run dev          # Concurrently runs API (port 4100) and Web (port 5173)
npm run dev:web      # Launches Vite frontend dev server only
npm run build:web    # Executes tsc typecheck and compiles production Vite bundle
npm run lint         # Executes full-monorepo TypeScript static analysis (tsc --noEmit)
npm run test:api     # Executes 35 Jest unit tests in apps/api

# Workspace Scripts (apps/web/package.json)
npm run dev          # Starts Vite dev server with Hot Module Replacement
npm run build        # Executes "tsc && vite build"
npm run preview      # Serves production build locally for verification
```

---

## 5. Local Development Environment Setup Guide

### 5.1 Prerequisites
- **Node.js:** `>= 20.11.0` (Active environment: Node.js v22.22.1)
- **Package Manager:** `npm >= 10.0.0`
- **Database Engine:** PostgreSQL 16 (Running via Docker on port 5435)

### 5.2 Step-by-Step Launch Procedure

1. **Clone & Install Dependencies:**
   ```bash
   git clone <repository_url>
   cd "Capital Fleet"
   npm install
   ```

2. **Verify Database Container:**
   ```bash
   npm run db:up   # Spins up capital_fleet_db container on port 5435
   ```

3. **Verify Environment Configurations:**
   - Frontend environment ([`apps/web/.env`](file:///home/yeabsira-hailegiorgis/Documents/Capital%20Fleet/apps/web/.env)):
     ```ini
     VITE_API_BASE_URL="http://localhost:4100/api"
     VITE_APP_TITLE="Capital Fleet Management"
     ```
   - Backend environment (`apps/api/.env`): Contains database URL, JWT secret, and port.

4. **Launch Application:**
   ```bash
   npm run dev
   ```
   - Frontend is accessible at: `http://localhost:5173`
   - Backend API is accessible at: `http://localhost:4100/api`
   - Swagger OpenAPI Documentation: `http://localhost:4100/api/docs`
