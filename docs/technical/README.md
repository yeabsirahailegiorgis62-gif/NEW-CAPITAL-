# Capital Fleet — Technical Documentation (University Reference)

These files describe the **actual** Capital Fleet Management System in this repository. They are written so you can explain the implementation to an examiner.

| File | Contents |
| --- | --- |
| [PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md) | How frontend, backend, database, and Docker fit together |
| [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md) | React SPA structure, state, routing, API client |
| [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md) | NestJS modules, controllers, services, auth, APIs |
| [DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md) | Prisma schema, tables, keys, relationships |
| [TECHNICAL_GLOSSARY.md](./TECHNICAL_GLOSSARY.md) | Terms plus Capital Fleet examples |
| [PROJECT_EXECUTION_FLOW.md](./PROJECT_EXECUTION_FLOW.md) | Login → request → approve → assign → trip complete |

**How to present:** start with architecture, then the execution flow, then answer follow-up questions using the glossary and the named files/classes.

Runtime (local):

- Frontend: Vite on `http://localhost:5173`
- API: NestJS on `http://localhost:4100/api`
- OpenAPI: `http://localhost:4100/api/docs`
- Database: PostgreSQL container on host port `5435`
