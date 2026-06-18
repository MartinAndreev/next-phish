FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json apps/worker/package.json
COPY apps/next-app/package.json apps/next-app/package.json
COPY apps/static-server/package.json apps/static-server/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm fetch

FROM deps AS dev
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @next-phish/database exec prisma generate
CMD ["pnpm", "--filter", "@next-phish/worker", "dev"]

FROM deps AS prod
RUN pnpm install --frozen-lockfile --prod
COPY . .
RUN pnpm build
CMD ["pnpm", "--filter", "@next-phish/worker", "start"]
