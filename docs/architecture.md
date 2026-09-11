# Architecture

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript (strict)
- **Database:** PostgreSQL + Prisma (migrations, client)
- **Auth:** BetterAuth (Prisma adapter)
- **API Layer:** tRPC (type-safe endpoints)
- **Validation:** Zod
- **DI:** TypeDI (constructor-based injection)
- **Serialization:** class-transformer (`@Expose`/`@Exclude` + groups)
- **Queue:** BullMQ + Redis (background jobs)
- **Static Server:** Hono (lightweight companion for public/redirect pages)
- **UI:** Tailwind CSS v4 + PrimeReact
- **Lint:** ESLint (next config)
- **Monorepo:** Turborepo + pnpm workspaces
- **Package Manager:** pnpm

## Project Structure

```
next-phish/
├── apps/
│   ├── next-app/                    # Next.js (web + tRPC backend)
│   │   ├── app/
│   │   │   ├── (auth)/login/        # Login page (server component)
│   │   │   ├── (auth)/register/     # Register page (server component)
│   │   │   ├── api/auth/[...all]/
│   │   │   │   └── route.ts         # BetterAuth HTTP handler
│   │   │   ├── api/trpc/[trpc]/
│   │   │   │   └── route.ts         # tRPC HTTP handler
│   │   │   ├── layout.tsx           # Root layout
│   │   │   └── page.tsx             # Home page
│   │   ├── src/
│   │   │   ├── server/
│   │   │   │   ├── auth.ts          # BetterAuth instance + config
│   │   │   │   ├── queue.ts         # BullMQ connection + queue/worker factories
│   │   │   │   ├── container.ts     # TypeDI global container setup
│   │   │   │   ├── trpc/
│   │   │   │   │   ├── router.ts    # Root tRPC router (merges modules)
│   │   │   │   │   ├── context.ts   # tRPC context (injects auth session)
│   │   │   │   │   └── procedures.ts # publicProcedure, protectedProcedure
│   │   │   │   ├── modules/         # Domain modules (DDD)
│   │   │   │   │   └── <domain>/    # e.g. auth, user, campaign
│   │   │   │   │       ├── enums/   # Zod enums / TS const enums
│   │   │   │   │       ├── types/   # Domain-specific TS types
│   │   │   │   │       ├── services/ # @Service() business logic
│   │   │   │   │       ├── commands/ # Write operations (Zod-validated input)
│   │   │   │   │       ├── queries/  # Read operations (Zod-validated input)
│   │   │   │   │       ├── repositories/ # Prisma data access layer
│   │   │   │   │       └── transformers/ # class-transformer DTOs
│   │   │   │   └── lib/             # Shared server utilities
│   │   │   ├── components/          # Atomic design system
│   │   │   │   ├── atoms/           # Smallest UI primitives
│   │   │   │   ├── molecules/       # Composite components
│   │   │   │   ├── organisms/       # Complex sections
│   │   │   │   ├── templates/       # Page layouts
│   │   │   │   └── ui/             # PrimeReact re-exports / wrappers
│   │   │   └── lib/                 # Shared client/server utilities
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tsconfig.json
│   │   ├── postcss.config.mjs
│   │   ├── eslint.config.mjs
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── static-server/               # Hono (serves landing pages from DB)
│   │   ├── src/index.ts
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── worker/                      # BullMQ background job processor
│       ├── src/index.ts
│       ├── tsconfig.json
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── database/                    # Prisma schema + generated client
│   │   ├── prisma/schema.prisma     # Database models
│   │   ├── src/client.ts            # PrismaClient singleton
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared/                      # Shared types, Zod schemas, utilities
│       ├── src/
│       ├── tsconfig.json
│       └── package.json
│
├── docker/
│   └── docker-compose.yml           # Multi-service compose (postgres, redis, next-app, static-server, worker)
├── turbo.json                       # Turborepo pipeline config
├── pnpm-workspace.yaml              # Workspace definition (apps/*, packages/*)
├── tsconfig.base.json               # Shared TypeScript config
├── package.json                     # Root: dev tooling + convenience scripts
├── commitlint.config.cjs
├── .husky/
│   ├── pre-commit                   # Runs lint-staged
│   └── commit-msg                   # Runs commitlint
├── docs/
│   └── architecture.md
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

## Monorepo Conventions

### Package layout

- **`apps/*`** — independently deployable applications. Each has its own `package.json`, `tsconfig.json`, `Dockerfile`, and exposes no public API to other packages (they are end-points).
- **`packages/*`** — shared libraries consumed by apps via `workspace:*` protocol (e.g. `"@next-phish/database": "workspace:*"`). They have no Dockerfiles and are not deployed standalone.

### Dependency flow

```
  apps/next-app  ──►  packages/database
  apps/next-app  ──►  packages/shared
  apps/static-server ──►  packages/database
  apps/worker    ──►  packages/database
  apps/worker    ──►  packages/shared
```

No circular dependencies between packages.

### Node.js SDK

`packages/sdk` is the publishable `@next-phish/sdk` ESM client for PAT-scoped tRPC queries and mutations. It uses `x-api-key` authentication and SuperJSON. Callers pass an explicit `organizationId` for scoped operations. See [SDK usage and publishing](../packages/sdk/README.md).

The SDK's build reads the app router's types to generate a standalone wire contract. This is a build-time exception to the app boundary: it does not import or execute application code at runtime. The npm package contains no private workspace dependencies. SDK contract tests check generated inputs and outputs against the app router, and SDK Turbo tasks include server/package source files as cache inputs because this dependency is not represented by a workspace runtime dependency.

### Root scripts

All common operations run from the project root via `turbo`. Examples:

| Command           | Behaviour                                       |
| ----------------- | ----------------------------------------------- |
| `pnpm dev`        | Runs all apps in parallel (dev mode)            |
| `pnpm build`      | Builds all packages + apps                      |
| `pnpm lint`       | Lints all packages                              |
| `pnpm typecheck`  | TypeScript checks all packages                  |
| `pnpm db:migrate` | Runs Prisma migrations (in `packages/database`) |
| `pnpm db:studio`  | Opens Prisma Studio                             |
| `pnpm format`     | Prettier across the entire repo                 |

## Principles

### Pages: server-first

- Pages are **server components** by default.
- Only interactive islands (forms, live updates) use `"use client"`.
- Data flows: `server component → tRPC caller (RSC-compatible) → render`.

### API: tRPC + BetterAuth

- Every route is a tRPC procedure (no raw API routes for business logic).
- `publicProcedure` — no auth required.
- `protectedProcedure` — requires valid BetterAuth session (injected via context).
- BetterAuth routes live at `/api/auth/*` as a single catch-all handler.

### Database: Prisma

- PrismaClient is a singleton via `packages/database/src/client.ts` (guards against hot-reload instantiation).
- Schema changes via `pnpm db:migrate` (runs `prisma migrate dev` in the database package).
- Queries/repositories **select all fields by default**; transformers whittle down via class-transformer groups.

### Validation: Zod

- Every command, query, and tRPC procedure input is validated with Zod.
- Types are inferred from Zod schemas (no manual type duplication).
- Shared Zod schemas live in `packages/shared` and are consumed by tRPC procedures and workers.

### Dependency Injection: TypeDI

- `@Service()` decorates services, commands, queries, repositories.
- Constructor injection for dependencies (Prisma client, repositories, other services).
- Container is pre-wired in `apps/next-app/src/server/container.ts`.

### Serialization: class-transformer

- Transformers define DTO classes with `@Expose()` / `@Exclude()`.
- `@SerializeOptions({ groups: ['admin', 'self'] })` controls visibility per context.
- Repositories return raw Prisma objects; transformers map them to DTOs before procedure output.

### Static Server: Hono

- Lives in `apps/static-server/`, deployed as an independent container on port `3001`.
- All routes resolve at `/` — looks up the request path in the `Page` Prisma model and returns the stored HTML.
- Health check endpoint at `/health`.
- Keeps public/phishing landing pages off the Next.js server, prevents session/CSRF leaks.

### Frontend: PrimeReact + Atomic Design

- PrimeReact components are wrapped in `apps/next-app/src/components/ui/` for theme consistency.
- Atomic hierarchy: `atoms → molecules → organisms → templates → pages`.
- Pages compose templates (or organisms directly for simple layouts).

### Worker

- Lives in `apps/worker/`, deployed as an independent container.
- Processes BullMQ jobs from Redis.
- Shares business logic via `packages/shared` and database access via `packages/database`.
