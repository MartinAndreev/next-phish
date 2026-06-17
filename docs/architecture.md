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
- **UI:** Tailwind CSS v4 + PrimeReact
- **Lint:** ESLint (next config)

## Project Structure

```
next-phish/
├── app/
│   ├── (auth)/login/             # Login page (server component)
│   ├── (auth)/register/          # Register page (server component)
│   ├── api/auth/[...all]/
│   │   └── route.ts              # BetterAuth HTTP handler
│   ├── api/trpc/[trpc]/
│   │   └── route.ts              # tRPC HTTP handler
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── prisma/
│   └── schema.prisma             # Database models
│
├── src/
│   ├── server/
│   │   ├── db.ts                 # PrismaClient singleton
│   │   ├── auth.ts               # BetterAuth instance + config
│   │   ├── queue.ts              # BullMQ connection + queue/worker factories
│   │   ├── container.ts          # TypeDI global container setup
│   │   ├── trpc/
│   │   │   ├── router.ts         # Root tRPC router (merges modules)
│   │   │   ├── context.ts        # tRPC context (injects auth session)
│   │   │   └── procedures.ts     # publicProcedure, protectedProcedure
│   │   │
│   │   ├── modules/              # Domain modules (DDD)
│   │   │   └── <domain>/         # e.g. auth, user, campaign
│   │   │       ├── enums/        # Zod enums / TS const enums
│   │   │       ├── types/        # Domain-specific TS types
│   │   │       ├── services/     # @Service() business logic
│   │   │       ├── commands/     # Write operations (Zod-validated input)
│   │   │       ├── queries/      # Read operations (Zod-validated input)
│   │   │       ├── repositories/ # Prisma data access layer
│   │   │       └── transformers/ # class-transformer DTOs (serialization groups)
│   │   │
│   │   └── lib/                  # Shared server utilities
│   │
│   ├── components/               # Atomic design system
│   │   ├── atoms/                # Smallest UI primitives
│   │   ├── molecules/            # Composite components
│   │   ├── organisms/            # Complex sections
│   │   ├── templates/            # Page layouts
│   │   └── ui/                   # PrimeReact re-exports / wrappers
│   │
│   └── lib/                      # Shared client/server utilities
│
├── public/
├── docs/
│   └── architecture.md
├── AGENTS.md
├── eslint.config.mjs
├── next.config.ts
├── tsconfig.json
└── package.json
```

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
- PrismaClient is a singleton via `src/server/db.ts` (guards against hot-reload instantiation).
- Schema changes via `prisma migrate dev`.
- Queries/repositories **select all fields by default**; transformers whittle down via class-transformer groups.

### Validation: Zod
- Every command, query, and tRPC procedure input is validated with Zod.
- Types are inferred from Zod schemas (no manual type duplication).

### Dependency Injection: TypeDI
- `@Service()` decorates services, commands, queries, repositories.
- Constructor injection for dependencies (Prisma client, repositories, other services).
- Container is pre-wired in `src/server/container.ts`.

### Serialization: class-transformer
- Transformers define DTO classes with `@Expose()` / `@Exclude()`.
- `@SerializeOptions({ groups: ['admin', 'self'] })` controls visibility per context.
- Repositories return raw Prisma objects; transformers map them to DTOs before procedure output.

### Frontend: PrimeReact + Atomic Design
- PrimeReact components are wrapped in `src/components/ui/` for theme consistency.
- Atomic hierarchy: `atoms → molecules → organisms → templates → pages`.
- Pages compose templates (or organisms directly for simple layouts).
