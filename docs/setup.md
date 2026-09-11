# Local Environment Setup

## Prerequisites

- **Node.js** 24 (`.nvmrc` included — run `nvm use` or `fnm use`)
- **pnpm** >= 9 (enable via `corepack enable`)
- **Docker** + Docker Compose (for PostgreSQL, Redis, SMTP server)
- **PgAdmin** or `psql` (optional, for inspecting the database)

## Quick Start

```bash
# 1. Start infrastructure (PostgreSQL, Redis, Mailpit)
docker compose up -d

# 2. Install dependencies
pnpm install

# 3. Copy environment file and review variables
cp .env.example .env
pnpm setup

# 4. Run Prisma migrations
pnpm prisma migrate dev

# 5. Run database seed (optional)
pnpm prisma db seed

# 6. Start the development servers
pnpm dev              # Next.js (port 3000)
pnpm dev:static-server  # Hono landing pages (port 3001, separate terminal)

# Workers (for campaign delivery and event processing)
pnpm dev:worker
```

## Running via Supervisor (Docker)

The project includes supervisor configs that run all processes in a single container:

```bash
docker compose up -d
```

This starts Next.js dev, the Hono static server, and workers under supervisord inside the container. See `.dev/docker/supervisord.conf`.

## Environment Variables

Development emails are captured by [Mailpit](https://mailpit.axllent.org/docs/install/docker/), available at [http://localhost:1080](http://localhost:1080). SMTP is available at `localhost:1025` for local processes and `fakesmtp:1025` inside Docker. Start or update it with `docker compose up -d fakesmtp`.

`pnpm setup` links the root `.env` into `apps/next-app`, `apps/static-server`, `apps/worker`, and `packages/database`. Existing app-specific `.env` files are preserved. `pnpm dev:up` also runs this setup automatically.

Next.js loads its `.env` automatically. The static server and worker load it through Node's `--env-file-if-exists` flag in their `dev` and `start` commands, while still supporting environment variables supplied by Docker. Restart the development processes after changing `.env`.

Key variables in `.env`:

| Variable             | Default     | Description                                                      |
| -------------------- | ----------- | ---------------------------------------------------------------- |
| `APP_PORT`           | `80`        | Host port mapped to Next.js                                      |
| `STATIC_SERVER_PORT` | `3001`      | Host port mapped to Hono                                         |
| `DB_HOST`            | `localhost` | PostgreSQL host                                                  |
| `REDIS_HOST`         | `localhost` | Redis host (BullMQ)                                              |
| `BETTER_AUTH_SECRET` | —           | Auth encryption secret (generate with `openssl rand -base64 32`) |
| `SMTP_HOST`          | `localhost` | SMTP server for campaign emails                                  |

## Project Scripts

| Script                     | Description                          |
| -------------------------- | ------------------------------------ |
| `pnpm dev`                 | Next.js development server           |
| `pnpm dev:static-server`   | Hono landing page server (tsx watch) |
| `pnpm dev:worker`          | BullMQ worker (tsx watch)            |
| `pnpm build`               | Next.js production build             |
| `pnpm build:server`        | Compile Hono + workers to `dist/`    |
| `pnpm start`               | Next.js production server            |
| `pnpm start:static-server` | Hono landing page server (compiled)  |
| `pnpm start:worker`        | BullMQ worker (compiled)             |
| `pnpm lint`                | ESLint                               |
