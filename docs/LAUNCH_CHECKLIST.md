# Launch checklist

## Current verification status
- Backend unit suite: 34 tests passed, including first-login verification and automatic sign-in; backend build and frontend type checking passed in the isolated Windows validation checkout.
- Earlier isolated PostgreSQL integration run passed course approval/publishing/enrollment, quiz gating, final assessment grading, certificate issuance, shared limits and interpretation fulfillment. Payment-provider responses in that run were simulated.
- Frontend type checking and compilation previously passed. Standalone packaging hit Windows symlink permissions; the Linux production build is still unverified.
- Resend sender/key, Google Translation key and Paystack key are missing locally. No production environment file exists. Provider delivery, real Paystack TEST-mode transactions and deployment are not verified.
- Backup/restore scripts are prepared but no production backup or recovery rehearsal has run. Mobile and authenticated browser acceptance checks are still pending.
- A read-only Prisma migration status check confirms all five migrations are applied to the local database. Install the updated dependencies, regenerate the Prisma client and restart development after applying these code changes.

## Owner inputs still required
- Full domain (for example a domain you own, including its suffix), hosting account, and deployment access.
- Paystack test key first, then approved live key and webhook configuration.
- Google Cloud Translation key restricted to the Translation API, billing enabled, provider quotas set.
- Resend verified sender and API key.
- Real contact details and approved privacy, terms, cancellation and refund wording.
- Real courses, prices, lessons and media. These are entered in the course studio; no invented paid courses are seeded.

## Suggested course structure (editable proposals, not published content)
1. French foundations: greetings, pronunciation, numbers, introductions.
2. Everyday French: shopping, travel, food, directions and conversation.
3. Intermediate French: grammar in context, listening and practical writing.
4. French for work: email, meetings, presentations and customer communication.
5. Translation practice: French-English meaning, tone, terminology and revision.
Choose prices after deciding teaching hours, materials and whether tutor support is included.

## Apply this release in Ubuntu
Stop pnpm dev. Back up the local database first if its data matters.
Run pnpm install, pnpm db:generate, then pnpm --filter @transligual/api prisma:deploy.
Restart pnpm dev. Migrations are additive; no database reset is required.

## Functional acceptance
Use separate verified tutor, student and administrator accounts.
- For an unverified account, submit the correct email/password on Login: an email should be sent without a session being created. Click its link to verify and sign in automatically. Sign out and log in again: the password should work without another email. Expired or reused links and suspended accounts must be rejected.
- Apply as tutor; approve as admin; create a draft course with lessons and media.
- Add a quiz for each QUIZ lesson and optionally a timed final exam.
- Submit and publish; unapproved tutors and other tutors must not edit the course.
- Enroll in a free course. Check private materials reject an unenrolled account.
- Fail a quiz: completion must be refused. Pass it, complete every lesson, and pass the final exam.
- Download the certificate and verify its code. Revoke it and confirm it is no longer valid.
- Use Paystack TEST mode: success, decline, abandoned checkout, repeated verification and duplicate webhook.
- Pending or failed payment must never unlock access. Refreshing successful verification must not reset completed progress.
- Submit an interpretation request; quote it; pay; assign an approved available interpreter; deliver session summary; request revision; redeliver; accept.
- Test translation with a real configured key and verify per-IP and daily limits.
- Test mobile navigation, keyboard forms, uploads, expired sessions and denied access.

## Production
The included Docker/Caddy deployment targets a Linux server.
Cloudinary can host media; it does not replace the API and PostgreSQL host.
Vercel can host the Next.js frontend but still needs an external API, database and persistent uploads.
Use one selected architecture and verify it in staging before live payments.
Run node ops/preflight.mjs .env.production without printing secret values.
Follow README deployment instructions. HTTPS, public callback URL and webhook URL must use the real domain.
Webhook: https://YOUR_DOMAIN/api/v1/payments/webhooks/paystack
Callback: https://YOUR_DOMAIN/payments/return
Do not expose database or API ports to the internet.

## Backups and monitoring
Run bash ops/backup.sh on the production server. It dumps PostgreSQL and archives persistent media with checksums.
Copy completed backups to private off-host storage and define retention.
Run bash ops/restore-check.sh /absolute/backup/directory to rehearse DB recovery in a disposable container and check the upload archive.
This does not perform a live restore.
Schedule the backup with the host scheduler after choosing frequency and retention.
Run MONITOR_ORIGIN=https://YOUR_DOMAIN node ops/monitor.mjs in your monitoring service; nonzero exit means failure.
Alert destination, off-host storage, schedules and real recovery verification remain deployment configuration.
