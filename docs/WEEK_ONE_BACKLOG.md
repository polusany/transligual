# Week-one delivery backlog

The target is a demonstrable Academy purchase-to-learning flow, not the full multi-service platform.

| ID | Owner | Task | Acceptance check |
|---|---|---|---|
| FND-01 | Dev 1 | Run Docker Postgres, Prisma initial migration, seed an admin and sample tutor | `pnpm db:migrate` succeeds from an empty database |
| FND-02 | Dev 2 | Confirm web and API dev servers run locally | Home page and `/api/v1/health` load |
| AUTH-01 | Dev 1 | Implement registration, Argon2id passwords, login, JWT guard and role decorator | Invalid login and protected route tests pass |
| AUTH-02 | Dev 2 | Connect registration/login and add authenticated dashboard state | User sees errors and a successful state |
| ACM-01 | Dev 1 | Add category, course, module, lesson and material models plus tutor/admin ownership checks | Tutor cannot modify another tutor's course |
| ACM-02 | Dev 2 | Build catalogue, course detail, tutor builder and admin approval screens | Published course is visible; draft is not |
| PAY-01 | Dev 1 | Add Paystack sandbox initialization and verified webhook-to-enrollment transaction | Forged/unverified payment cannot grant access |
| LRN-01 | Both | Student course page, protected material download and progress endpoint | Unenrolled user receives 403; enrolled user can learn |
| QA-01 | Both | Smoke test the end-to-end path and document demo credentials | Demo works on a fresh environment |
