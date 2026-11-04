# Capital Fleet — Project Architecture

## 1. What this system is

Capital Fleet is a **vehicle booking and logistics management** application for Capital Real Estate. Staff request vehicles, logistics officers approve and assign cars and chauffeurs, drivers execute trips, and system administrators manage users, departments, and policies.

It is a **client–server** system:

1. A **React** single-page application (SPA) in the browser.
2. A **NestJS** REST API on Node.js.
3. A **PostgreSQL** database accessed through **Prisma**.

The browser never talks to PostgreSQL. All business rules (approval, double-booking prevention, password hashing) run in the API.

## 2. Repository layout (npm workspaces monorepo)

Root package name: `capital-fleet-monorepo` (`package.json`). Workspaces: `apps/*`.

```
Capital Fleet/
├── apps/
│   ├── api/                 NestJS backend (@capital-fleet/api)
│   │   └── src/
│   │       ├── main.ts      HTTP server bootstrap
│   │       ├── app.module.ts  root module
│   │       ├── prisma/      PrismaService
│   │       ├── common/      guards, decorators, exception filter
│   │       └── modules/     feature modules (auth, bookings, …)
│   └── web/                 React + Vite frontend (@capital-fleet/web)
│       └── src/
│           ├── main.tsx     React mount
│           ├── App.tsx      screens, tabs, session
│           ├── lib/api.ts   HTTP client
│           ├── pages/       landing, login, public QR verify
│           ├── features/    dashboards, bookings, logistics, admin
│           └── components/  layout + UI primitives
├── prisma/
│   ├── schema.prisma        database schema (single source of truth)
│   └── seed.ts              demo departments, users, vehicles
├── docker-compose.yml       PostgreSQL 16 container only
├── start.sh                 compile API + start API and Vite
└── docs/technical/          this documentation set
```

Folder and naming conventions already follow common NestJS (`*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.dto.ts`) and React (`features/`, `components/`, `pages/`) practice. Feature logic was **not** rewritten; comments and this documentation were added on top of the existing structure.

## 3. Runtime topology

```
Browser (React SPA, port 5173)
    │  fetch('/api/...')
    │  Vite proxy (apps/web/vite.config.ts)
    ▼
NestJS API (port 4100, global prefix /api)
    │  PrismaService (Prisma Client)
    ▼
PostgreSQL 16 (Docker, host port 5435 → container 5432)
    database: capital_fleet_db
```

**Client–server split in this project**

| Layer | Process | Default port | Entry |
| --- | --- | --- | --- |
| Client | Vite + React | 5173 | `apps/web/src/main.tsx` |
| Server | Node.js + NestJS | 4100 | `apps/api/src/main.ts` |
| Database | `postgres:16-alpine` | 5435 (host) | `docker-compose.yml` |

`start.sh` (and root `npm start`) kills anything on 4100/5173, builds the API (`tsc`), starts `dist/main.js`, waits for `GET /api/health`, then starts the Vite dev server.

## 4. How the frontend reaches the backend

1. `ApiClient` in `apps/web/src/lib/api.ts` uses `const API_BASE = '/api'`.
2. Vite `server.proxy` forwards `/api` to `http://localhost:4100`.
3. NestJS `app.setGlobalPrefix('api')` in `main.ts`, so a call to `/api/bookings` hits `BookingsController` (`@Controller('bookings')`).
4. If a JWT exists, `ApiClient.request` sends `Authorization: Bearer <token>`.
5. CORS in `main.ts` also allows `http://localhost:5173` for cases that bypass the proxy.

Swagger/OpenAPI is generated from NestJS decorators and served at `/api/docs`.

## 5. Backend layering

Every feature follows the same NestJS pattern:

- **Module** — registers the controller and service (`AuthModule`, `BookingsModule`, …). `AppModule` imports all of them.
- **Controller** — HTTP routes, guards, Swagger metadata. No SQL.
- **Service** — business logic and Prisma queries.
- **DTO** — `class-validator` classes for request bodies.

Cross-cutting:

- `JwtAuthGuard` + `JwtStrategy` — authentication.
- `RolesGuard` + `@Roles(...)` — authorization.
- `AllExceptionsFilter` — JSON error shape `{ statusCode, message, path, method, error }`.
- `ValidationPipe` — DTO validation (`whitelist: true`).
- `PrismaModule` is `@Global()`, so every module can inject `PrismaService`.

## 6. Data layer

- Schema: `prisma/schema.prisma`.
- Client: generated `@prisma/client`, wrapped by `PrismaService`.
- Physical tables use `@@map` names (`users`, `bookings`, `vehicle_assignments`, …).
- There is **no `prisma/migrations` directory** in this repo. Schema is applied with Prisma migrate/push scripts in `apps/api/package.json` (`prisma:migrate`, `prisma:push`). Seed: `prisma/seed.ts`.

Core relationship (simplified):

`Department` 1—* `User` *—* `Booking` (as requester)  
`Booking` 1—* `VehicleAssignment` *—1 `Vehicle`  
`VehicleAssignment` *—0..1 `User` (driver)  
`Booking` 1—* `BookingDay` (weekly itinerary)

## 7. Authentication and authorization (architecture view)

1. `POST /api/auth/login` (`AuthController.login` → `AuthService.login`).
2. Password checked with **bcrypt** against `User.passwordHash`.
3. JWT signed with `JwtService` (`AuthModule`: expiry `7d`, secret `JWT_SECRET` / `auth.constants.ts`).
4. Payload: `{ sub, email, role, employeeId, mustChangePassword }`.
5. Frontend stores the token in **sessionStorage** key `capital_fleet_token`.
6. Later requests: Passport JWT strategy loads the user by `payload.sub` and attaches it to `request.user`.
7. `@Roles(UserRole.LOGISTICS_ADMIN, UserRole.SYSTEM_ADMIN)` is enforced by `RolesGuard`. `SYSTEM_ADMIN` is allowed on every role-restricted route.

Roles (`UserRole` enum): `EMPLOYEE`, `DRIVER`, `LOGISTICS_ADMIN`, `SYSTEM_ADMIN`.

## 8. Frontend architecture (architecture view)

- **No React Router.** `App.tsx` is the router:
  - `currentView`: `'landing' | 'login' | 'workspace'`
  - `activeTab`: dashboard, new-booking, requests-queue, vehicles, …
  - URL query `?tab=` is synced with `history.replaceState`
  - Public QR: `?verify=` / `?ref=` / `?token=` → `PublicVerificationPage`
- **State:** React `useState` in `App` (user, bookings, notifications, modals). Feature views often fetch their own data via `api`.
- **TanStack React Query is listed in `apps/web/package.json` but the live data path uses `ApiClient` + `useState`/`useEffect`, not React Query hooks.**
- Styling: Tailwind CSS (`dark` class via `ThemeContext`).

## 9. Infrastructure and configuration

Environment template: `.env.example` (do not commit real secrets).

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Prisma PostgreSQL connection |
| `POSTGRES_*` | Docker Compose database |
| `PORT` | Nest listen port (code default **4100**; `.env.example` currently shows 4000 — the running app and Vite proxy use 4100) |
| `JWT_SECRET` | Token signing |
| `CORS_ORIGIN` | Documented; CORS origins are **hardcoded** in `main.ts` |
| `SMTP_*` | Optional; `MailService` logs email if SMTP is missing |
| `VITE_API_URL` | Present in `.env.example`; the web client uses `/api` + Vite proxy, not this variable |

**Docker:** only PostgreSQL. The API and web apps are **not** containerized. Volume: `capital_fleet_data`.

**Build:**

- API: `tsc -p apps/api/tsconfig.build.json` → `apps/api/dist/main.js`
- Web: `tsc && vite build` (production static assets)

## 10. Feature modules (backend) mapped to UI

| Nest module | Controller prefix | Main UI |
| --- | --- | --- |
| AuthModule | `/api/auth` | `LoginPage`, `ForgotPasswordModal`, admin reset in `UsersManagementView` |
| UsersModule | `/api/users` | `UsersManagementView`, `ProfileModal` |
| DepartmentsModule | `/api/departments` | `DepartmentsManagementView` |
| VehiclesModule | `/api/vehicles` | `VehicleInventoryView`, `AssignVehicleModal`, `AvailabilityCalendar` |
| BookingsModule | `/api/bookings` | `BookingRequestForm`, queues, trip modals, QR verify |
| IssuesModule | `/api/vehicle-issues` | `MaintenanceView` |
| MaintenanceModule | `/api/maintenance` | `MaintenanceView` |
| FuelModule | `/api/fuel` | reports / maintenance-related fuel screens |
| NotificationsModule | `/api/notifications` | `AppShell` / `Navbar` inbox |
| AuditModule | `/api/audit-logs` | `AuditLogsView` |
| SettingsModule | `/api/settings` | `SystemSettingsView` |
| HealthModule | `/api/health` | `start.sh` readiness |
| MailModule | (no HTTP controller) | used by `AuthService` |

## 11. What to say if asked “why this architecture?”

- **Separation of concerns:** UI in React, HTTP in controllers, rules in services, persistence in Prisma.
- **Role-based access** is enforced on the server (`RolesGuard`), not only hidden in the sidebar.
- **Transactional assignment** (`BookingsService.assignVehicle` uses `prisma.$transaction` and `SELECT … FOR UPDATE`) prevents two officers assigning the same vehicle at the same time.
- **Public QR verification** is a dedicated unauthenticated GET so a gate/security officer can validate a trip without logging in.
