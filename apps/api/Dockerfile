# Build context: repo root  (docker build -f apps/api/Dockerfile .)
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Install only what the API + shared package need
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @mentor/api...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

WORKDIR /app/apps/api
ENV NODE_ENV=production \
    PORT=4000 \
    STORAGE_LOCAL_DIR=/app/storage
RUN mkdir -p /app/storage
EXPOSE 4000

# Apply pending Drizzle migrations on every start (idempotent), then run the API
CMD ["sh", "-c", "node_modules/.bin/tsx src/db/migrate.ts && exec node_modules/.bin/tsx src/index.ts"]
