# Capital Fleet — Technical Glossary & Architectural Terminology

**Purpose:** Comprehensive reference guide defining enterprise software engineering, web development, and architectural terminology, accompanied by practical examples directly from the **Capital Fleet Management System** codebase.

---

## 1. Architectural Concepts

### Monorepo (npm Workspaces)
- **Definition:** A software development strategy where code for multiple distinct projects or packages is stored in the same version control repository, sharing common configuration and dependencies.
- **In Capital Fleet:** The project root `package.json` specifies `"workspaces": ["apps/*"]`. This allows managing both `apps/api` (NestJS backend) and `apps/web` (React frontend) within a unified Git repository while executing centralized scripts such as `npm run build` and `npm run lint`.

### Feature-First Modular Architecture
- **Definition:** An architectural pattern that organizes code primarily around business domain capabilities (e.g. `booking-management`, `vehicle-management`) rather than purely technical layers (`controllers/`, `views/`, `models/`).
- **In Capital Fleet:** Located in `modules/01-authentication-security` through `modules/13-system-settings-policies`. Each module acts as a vertical slice linking frontend views, NestJS backend services, database models, and test suites.

### Separation of Concerns (SoC)
- **Definition:** A design principle for separating a computer program into distinct sections such that each section addresses a separate concern.
- **In Capital Fleet:** React components only handle DOM rendering and user interaction (`BookingRequestForm.tsx`); the API client manages HTTP transportation (`api.ts`); NestJS controllers validate request payloads (`BookingsController`); NestJS services enforce business rules (`BookingsService`); and Prisma handles database queries (`prisma.booking.create`).

### Single Responsibility Principle (SRP)
- **Definition:** The principle that every class, module, or function should have responsibility over a single part of the program's functionality, and that responsibility should be entirely encapsulated.
- **In Capital Fleet:** `MailService` only handles SMTP email dispatch; `SettingsService` only handles policy key-value caching; `AuditService` only handles immutable audit trail logging.

### Inversion of Control (IoC) & Dependency Injection (DI)
- **Definition:** A design pattern where a software framework controls the execution flow and provides dependent objects (services, repositories) to a class rather than the class instantiating them directly.
- **In Capital Fleet:** In `BookingsService`, `constructor(private prisma: PrismaService, private audit: AuditService, private settings: SettingsService) {}`. NestJS instantiates and injects `PrismaService`, `AuditService`, and `SettingsService` automatically via its IoC container.

---

## 2. Backend & API Terminology

### Data Transfer Object (DTO)
- **Definition:** An object that carries data between processes (e.g. from an HTTP request body to a controller method) without business logic.
- **In Capital Fleet:** `CreateBookingDto` in `apps/api/src/modules/bookings/bookings.dto.ts`. Uses `class-validator` decorators (`@IsString()`, `@IsDateString()`, `@IsInt()`, `@Min(1)`) to validate user input before controller methods execute.

### Controller
- **Definition:** The architectural component responsible for handling incoming HTTP requests, extracting route parameters and query strings, invoking services, and returning standard HTTP responses.
- **In Capital Fleet:** `BookingsController` (`@Controller('bookings')`) maps routes such as `POST /api/bookings` and `POST /api/bookings/:id/assign`.

### Service (Provider)
- **Definition:** A class annotated with `@Injectable()` where the core business logic, calculations, workflow rules, and data operations reside.
- **In Capital Fleet:** `VehiclesService` contains the overlap detection algorithm `doesAssignmentConflict()` and recommendation ranking logic.

### Guard
- **Definition:** A NestJS interface (`CanActivate`) that determines whether a given request will be handled by the route handler or rejected based on security permissions, roles, or authentication tokens.
- **In Capital Fleet:** `JwtAuthGuard` verifies the presence of a valid JWT token; `RolesGuard` checks whether the authenticated user's role matches `@Roles(...)` metadata.

### Exception Filter
- **Definition:** A middleware component that intercepts unhandled exceptions thrown across the application and transforms them into standard, client-friendly HTTP error responses.
- **In Capital Fleet:** `AllExceptionsFilter` (`apps/api/src/common/filters/http-exception.filter.ts`) intercepts Prisma and NestJS errors and formats them into `{ statusCode, message, timestamp, path }`.

---

## 3. Database & ORM Terminology

### Object-Relational Mapping (ORM)
- **Definition:** A programming technique for converting data between incompatible type systems using object-oriented programming languages.
- **In Capital Fleet:** Prisma ORM reads `prisma/schema.prisma` and generates a fully type-safe TypeScript client (`PrismaClient`) used by `PrismaService`.

### Foreign Key & Referential Integrity
- **Definition:** A field in one table that uniquely identifies a row in another table, establishing a relationship and preventing orphaned records.
- **In Capital Fleet:** In `model Booking`, `requesterId String` references `User.id` via `@relation("RequesterBookings", fields: [requesterId], references: [id])`. Deleting a user with active bookings is guarded or cascades cleanly.

### Database Index
- **Definition:** A data structure that improves the speed of data retrieval operations on a database table at the cost of additional writes and storage space.
- **In Capital Fleet:** `Booking` indexes `[status]`, `[requesterId]`, and `[departureAt, expectedReturnAt]`. This ensures availability queries across hundreds of records execute in milliseconds.

### Database Seeding
- **Definition:** Populating a database with an initial set of mock or default data for development, testing, and evaluation.
- **In Capital Fleet:** `prisma/seed.ts` populates 4 departments, 10 employees, 5 certified drivers, 12 vehicles (Sedans, SUVs, Pickups, Minibuses), system policies, and sample booking history.

---

## 4. Frontend & React Terminology

### Single-Page Application (SPA)
- **Definition:** A web application that loads a single HTML page and dynamically updates the document body as the user interacts with the app, without requiring full-page browser reloads.
- **In Capital Fleet:** `apps/web/index.html` loads `apps/web/src/main.tsx`, which mounts React onto `<div id="root"></div>`. Navigation occurs seamlessly using tab state and URL query parameters (`?tab=bookings`).

### Component State & Props
- **Definition:** State represents the internal, mutable data of a component; Props represent read-only inputs passed from a parent component to a child component.
- **In Capital Fleet:** `App.tsx` maintains `currentUser` and `activeTab` state; it passes `user={currentUser}` and `onSelect={setSelectedBooking}` props down to `BookingsTable`.

### React Hook
- **Definition:** Special functions that let function components use state, lifecycle methods, and other React features without writing class components.
- **In Capital Fleet:** `useState` for local component state, `useEffect` for URL parameter synchronization, and custom hooks like `useToast()` for system alert banners.

### Barrel Export
- **Definition:** An `index.ts` file that re-exports multiple individual module exports, providing a single consolidated import point.
- **In Capital Fleet:** `apps/web/src/features/bookings/index.ts` re-exports `BookingRequestForm`, `BookingsTable`, `BookingDetailsModal`, and `CancelBookingModal`, allowing consumers to import cleanly from `@/features/bookings`.

---

## 5. Security & Cryptography Terminology

### JSON Web Token (JWT)
- **Definition:** An open, industry-standard (RFC 7519) compact and self-contained method for securely transmitting information between parties as a JSON object.
- **In Capital Fleet:** Upon successful login, `AuthService` issues a signed JWT containing `{ sub: user.id, email: user.email, role: user.role }`. The frontend attaches this token as `Authorization: Bearer <token>` on all requests.

### Salted Hash (bcrypt)
- **Definition:** A cryptographic password-hashing function designed to protect against brute-force and rainbow table attacks by generating a random salt string before hashing.
- **In Capital Fleet:** When onboarding employees or updating passwords, `bcrypt.hash(password, 10)` generates a 60-character bcrypt hash stored in `User.passwordHash`. Plaintext passwords are never saved.

### Stateless Authentication
- **Definition:** An authentication architecture where the server does not store user session states in memory or a session table; the client sends credentials (JWT) with every request, and the server validates the signature mathematically.
- **In Capital Fleet:** `JwtStrategy` validates the cryptographic signature of incoming tokens against `JWT_SECRET` without needing a session store lookup.
