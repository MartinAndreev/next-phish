FROM node:24-alpine AS base

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS dev

RUN apk add --no-cache supervisor

COPY . .

COPY .dev/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000 3001

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]

FROM base AS prod

RUN apk add --no-cache supervisor

COPY . .

RUN pnpm prisma:generate

RUN pnpm build && pnpm build:worker

COPY .dev/docker/supervisord.prod.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000 3001

CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
