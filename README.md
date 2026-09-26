# Transligual

Transligual is a language learning and services platform built with Next.js, NestJS, Prisma, and PostgreSQL. Its product areas are the public course library, learner workspace, administrator console, instant text translation, interpretation bookings, and course certificates.

## Run locally (Ubuntu 24.04 on WSL)

Enable Docker Desktop's Ubuntu 24.04 integration first. From the repository root in Ubuntu:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
docker compose up -d postgres
pnpm install
pnpm db:generate
pnpm db:migrate -- --name init
pnpm db:seed
pnpm dev
```

Open the web app at `http://localhost:3000`. The API health endpoint is `http://localhost:4000/api/v1/health`.

Keep the services running in Ubuntu. If the browser says “Failed to fetch”, check the API health endpoint and the Ubuntu API terminal first; a Next.js page cannot reach the database without the API process.

## First administrator

Before the first seed, set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in `apps/api/.env` (use a unique password of at least 16 characters). Run `pnpm db:seed` once. The seed creates a super-administrator only if that email is not already registered. Remove the bootstrap values after the account is created. Never paste secrets into chat or commit `.env` files.

## Current product flows

- The public home page and course library list published courses only. A course detail page includes its public outline.
- Learners verify email before signing in, can request a password reset, enroll in free courses, and see their active course room and lesson progress. Browser sessions use short-lived HttpOnly cookies.
- Tutors apply for approval. An approved tutor can create a draft, add curriculum sections and lessons, then submit it for administrator review. An administrator can publish a complete course.
- Paid course checkout is server-initialized and access is granted only after the payment provider confirms the expected amount and currency. The payment return page checks the transaction again with the API.
- Learners can translate text immediately with the public translator. Interpretation bookings remain request-based and appear on the learner dashboard.
- Certificate-enabled courses issue a verification code when a learner completes all lessons. Learners can print the certificate page or save it as PDF, and the public verification page checks its status.

## Configuration and known launch requirements

- Paid checkout needs a valid `PAYSTACK_SECRET_KEY` in `apps/api/.env`, plus a Paystack webhook pointed at `/api/v1/payments/webhooks/paystack`. Until configured, paid checkout returns a clear unavailable response; free enrollment works.
- `AUTH_JWT_SECRET` must be a long, random secret and must be identical for all API instances.
- Account email verification and password recovery use Resend. Configure `RESEND_API_KEY`, a verified sender in `EMAIL_FROM`, and `WEB_APP_URL`. In local development without those values, the API logs a one-time link for manual use; production startup rejects missing email configuration.
- Public instant translation uses Google Cloud Translation Basic. Set `GOOGLE_TRANSLATE_API_KEY` in the API environment only; never expose it in the web app. Google currently includes the first 500,000 translated characters per month in a monthly credit and charges for usage beyond that, so set a billing budget and API restrictions in Google Cloud before inviting public traffic.
- Admins can upload MP4/WebM videos, MP3/WAV/OGG audio, PDFs, and PNG/JPEG images up to 50 MB per lesson. Uploads are stored in the API's private `UPLOAD_DIR`; learners need an active course enrollment to stream or download course materials. The production Compose file keeps uploads in the `course_uploads` volume, which must be included in host backups. The instant translator handles text only.
- Interpretation currently supports request intake and customer status views. Staff quoting, assigning specialists, secure delivery, revisions, and interpretation-payment workflows remain operational work before offering these as fulfilled paid services. Instant translation uses an in-memory per-IP limit; use a shared rate limit and provider quotas for multi-instance public traffic.
- Course lessons currently record learner completion from the course room. Quiz/exam authoring and grading, downloadable PDF certificate generation, durable shared rate limiting for multi-instance deployments, backups, and monitoring need completion before a broad public launch. Account endpoints currently use a per-process IP rate limit; use a shared store if running multiple API instances.

## Production deployment (single Linux server)

The production Compose stack builds the API and Next.js app, keeps PostgreSQL and the API on a private Docker network, applies checked-in Prisma migrations before starting the API, and puts Caddy in front of the website for automatic HTTPS. It expects a Linux host with Docker Engine and the Compose plugin, a DNS name whose A/AAAA records point to that host, and inbound ports 80 and 443 open. Do not expose PostgreSQL or the API directly to the public internet.

1. Copy `.env.production.example` to `.env.production` on the deployment host. Set `SITE_DOMAIN`, `APP_URL`, `PAYSTACK_CALLBACK_URL`, strong unique database credentials, and a random `AUTH_JWT_SECRET` of at least 32 characters. Keep `DATABASE_URL` and `DIRECT_DATABASE_URL` consistent and URL-encode special characters in credentials. Leave Paystack keys empty until live payments are configured.
   Set `RESEND_API_KEY` and `EMAIL_FROM` to a verified sender; account verification and password recovery cannot work in production without mail delivery. Keep `UPLOAD_DIR=/app/uploads`; Compose mounts persistent storage there for uploaded course media.
2. From the repository root, build and start the stack:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```

3. For the first administrator only, fill in `BOOTSTRAP_ADMIN_EMAIL` and a unique `BOOTSTRAP_ADMIN_PASSWORD` of at least 16 characters in `.env.production`, then run:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml run --rm api pnpm --filter @transligual/api prisma:seed
   ```

   Remove both bootstrap values after successful seeding. Check `docker compose --env-file .env.production -f docker-compose.production.yml ps` and the public HTTPS site. The API readiness check is available internally at `/api/v1/health/ready`.

Prisma production migrations use `prisma migrate deploy`; local development continues to use `prisma migrate dev`. Back up both PostgreSQL and the `course_uploads` Docker volume before each release and confirm a restore procedure. `docker-compose.production.yml` is a small single-host starting point, not a managed high-availability database or a substitute for monitoring, backups, account recovery, abuse prevention, or the outstanding service-fulfillment workflows described above.

## Useful commands

```bash
pnpm db:generate
pnpm db:migrate -- --name <migration-name>
pnpm db:seed
pnpm --filter @transligual/api lint
pnpm --filter @transligual/web lint
pnpm build
```

Do not commit `.env` files, database credentials, JWT secrets, or payment-provider keys.
