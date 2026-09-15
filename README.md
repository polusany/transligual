# Transligual

Week-one MVP foundation for the Transligual French Academy.

## First run on Ubuntu

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate -- --name init
pnpm dev
```

Open `http://localhost:3000`; API health is `http://localhost:4000/api/v1/health`.

## Boundaries

This initial scaffold intentionally implements only the foundation. Day 2 adds real authentication and Prisma persistence; Day 3 begins Academy models and APIs. Never commit `.env` files or production payment keys.
