FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-lock.yaml ./
RUN pnpm fetch

FROM deps AS dev
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3001
CMD ["pnpm", "dev"]

FROM deps AS prod
RUN pnpm install --frozen-lockfile --prod
COPY . .
RUN pnpm build
EXPOSE 3001
CMD ["pnpm", "start"]
