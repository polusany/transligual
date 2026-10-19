# Enable automatic translation

The message "Automatic translation is not available yet" means that the API process has no GOOGLE_TRANSLATE_API_KEY. Editing the frontend will not activate Google Cloud.

## Google Cloud account setup

1. Sign in at https://console.cloud.google.com/ and select or create a project for Transligual.
2. Link a billing account to that project. Complete billing and any payment/terms steps yourself.
3. Open APIs & Services > Library, find **Cloud Translation API**, and enable it for that project. The app uses Basic v2.
4. Open APIs & Services > Credentials, create an API key, and restrict its API access to **Cloud Translation API**. Use an ordinary API key supported by Basic v2. Credential creation and changes to its access must be completed by the account owner.
5. This key is used by the server. Website/referrer restrictions do not suit server calls. If your API host has stable outbound IP addresses, restrict the key to those addresses. Do not guess the address or use the website's visitor IP.
6. Configure suitable Translation quotas for your budget and billing alerts in Google Cloud. Budget alerts alone do not stop charges.

Official instructions:
- https://docs.cloud.google.com/translate/docs/setup
- https://docs.cloud.google.com/translate/docs/authentication

## Configure the API

Local Ubuntu/WSL: edit the existing `apps/api/.env` and add:

```dotenv
GOOGLE_TRANSLATE_API_KEY=your-actual-key
```

Do not overwrite other environment values. Do not put the key in a browser variable or commit it.

Hosted API (for example Render): set **GOOGLE_TRANSLATE_API_KEY** in the API service's Environment settings, then restart/redeploy that API service. Adding it only to the frontend or to the local file does not configure the hosted API.

Docker Compose production: add it to the existing `.env.production`, then recreate the API container so it reads the new environment:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d api
```

For local development, restart the API process after editing its environment. Start PostgreSQL and the API/web services using the existing README steps.

## Verify

From the repository root, using Node 22.6 or newer:

```bash
pnpm translation:check
pnpm translation:check -- http://localhost:3000
# Substitute your actual deployed website origin to test production:
pnpm translation:check -- https://your-website.example
```

These commands send a few short, fixed test phrases to Google. They verify real English/French output, automatic detection and Arabic output. The optional website origin also exercises the website proxy and backend; the key is only sent to Google, never to the supplied website. No keys are printed.

In the browser, verify Translate, swap, Clear, Copy, editing while a request runs, mobile layout and Arabic text direction. A successful provider check with a failing website check means the deployed backend configuration or application services still need attention.

## Manual requests retired

Translation is automatic. Admin navigation and the reply endpoint are removed; `/admin/translations` redirects to `/admin`. Old student history remains accessible through its authenticated read API. New manual submissions return HTTP 410 so customers cannot submit work that no administrator will answer. No historical database records were deleted.
