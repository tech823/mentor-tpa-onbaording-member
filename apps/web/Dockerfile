# Build context: repo root  (docker build -f apps/web/Dockerfile .)
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --filter @mentor/web...

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/web apps/web

# Set by the workflow: https://enrollapi.mentortpa.com/api (empty would mean same-origin "/api")
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @mentor/web build

FROM nginx:alpine
COPY apps/web/nginx.spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
