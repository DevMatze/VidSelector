# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*


FROM base AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM dependencies AS builder

WORKDIR /app

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/tmp/vidselector-build.db"

RUN npx prisma generate
RUN npx prisma migrate deploy
RUN npm run build


FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/data/vidselector.db"

COPY --from=builder --chown=node:node /app /app

RUN mkdir -p /data /app/backups /app/.next/cache \
  && chown -R node:node /data /app/backups /app/.next/cache \
  && chmod +x /app/scripts/docker-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
