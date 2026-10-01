# Recover the deployed administrator

Local and production databases are separate. A local administrator does not
automatically exist in production. Password reset intentionally returns a generic
response for absent accounts and does not send email for them.

On the API host, use `node apps/api/scripts/start-production.cjs` as the start
command. It applies migrations and supports an explicit, temporary bootstrap.

Set these privately in the API host's environment settings:

- `BOOTSTRAP_ADMIN_ON_START=true`
- `BOOTSTRAP_ADMIN_EMAIL`: your existing administrator email
- `BOOTSTRAP_ADMIN_PASSWORD`: your chosen password (at least 16 characters)
- Only if recovering an existing admin: `BOOTSTRAP_ADMIN_RESET_PASSWORD=true`

Redeploy. New accounts receive SUPER_ADMIN; existing ADMIN/SUPER_ADMIN accounts
retain their role. Non-admin accounts are never promoted by this process.
Check the bootstrap completion log, then remove both flags and the password
from the host settings and redeploy. Sign in at `/admin/login`.

For password-reset delivery, configure `RESEND_API_KEY`, `EMAIL_FROM` (a sender
on a domain verified in Resend), and `WEB_APP_URL` (the live frontend origin).
Inspect provider delivery logs and the receiving inbox/spam folder after one
reset request. Never place secrets in NEXT_PUBLIC variables, source control,
screenshots, or chat. Bootstrap recovery does not depend on email delivery.
