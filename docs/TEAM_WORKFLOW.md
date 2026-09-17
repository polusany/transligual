# Two-developer workflow

## Ownership for week one

- Developer 1 owns `apps/api`, `docker-compose.yml`, database migrations, security decisions, and API contracts.
- Developer 2 owns `apps/web`, UX states, API-client integration, and end-to-end test scenarios.
- Both review pull requests; neither merges their own pull request.

## Branches and hand-off

Create a short-lived branch per work item: `feat/auth-api`, `feat/auth-ui`, `fix/payment-webhook`. Rebase before requesting review. Do not edit another developer's in-flight feature without agreement.

The API must publish its request/response contract before UI work begins. Changes to `apps/api/prisma/schema.prisma` require a migration, generated Prisma client, and a note in the pull request.

## Definition of done

Every feature has validation, authorization behavior, one happy-path test, one forbidden-access test where applicable, and no secrets in committed files.
