FROM node:22-bookworm-slim AS build
WORKDIR /workspace
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @transligual/api prisma:generate
RUN pnpm --filter @transligual/api build

FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 app \
  && useradd --system --uid 1001 --gid app --home-dir /app app
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
COPY --from=build --chown=app:app /workspace /app
RUN mkdir -p /app/uploads && chown app:app /app/uploads
USER app
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
