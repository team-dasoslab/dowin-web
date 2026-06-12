# Dowin Backend Rules

## Read Order

1. `package.json`
2. `docs/onboarding.md`
3. `docs/dev/common/2026.03.12-api-conventions.md`
4. `docs/dev/common/2026.03.12-security.md`
5. `docs/dev/common/2026.03.14-common-utilities.md`
6. `docs/dev/common/2026.03.09-database-schema.md` when the task adds a new feature or changes persisted data
7. `.agents/skills/performance-check/SKILL.md` when the task changes heavy reads, aggregation, loops, or query volume
8. the relevant `docs/dev/**/2026.03.12-domain-*.md`
9. the current implementation in `src/app/api`, `src/domain`, `src/lib`, `src/db`

## Repository Conventions

- Keep route handlers thin.
- Use Zod where request data enters.
- Use `apiSuccess`, `apiError`, and `withErrorHandler`.
- Use `getSession` for auth-required routes.
- Keep DB access in storage classes or modules.
- Keep business rules in services.
- Prefer ownership filtering in queries rather than fetch-then-check patterns.
- Use Drizzle or bound parameters only.
- For new features that need persisted data, design the DB schema before backend implementation.
- Do not create or apply D1/Drizzle migrations manually. Use `yarn mig:local` for local schema migration work; use `yarn mig:remote` only when explicitly asked to apply remote migrations.
- Do not run `drizzle-kit generate`, `drizzle-kit push`, or `wrangler d1 migrations apply` directly unless the repository instructions are changed.
- For query-heavy or aggregation-heavy backend changes, run `dowin-performance-check` before considering the work complete.

## Verification Defaults

```bash
yarn test --run <changed-test-file>
yarn test:backend
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

Use focused `yarn test --run <changed-test-file>` while developing. Before handoff for backend/API/domain implementation changes, run `yarn test:backend` unless a narrower run is explicitly accepted for a small documentation-adjacent change.

If API contracts changed:

```bash
yarn gen:api
```
