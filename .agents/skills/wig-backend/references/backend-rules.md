# WIG Backend Rules

## Read Order

1. `package.json`
2. `docs/onboarding.md`
3. `.agents/workflows/backend-tdd.md`
4. `docs/dev/common/2026.03.12-api-conventions.md`
5. `docs/dev/common/2026.03.12-security.md`
6. `docs/dev/common/2026.03.14-common-utilities.md`
7. the relevant `docs/dev/**/2026.03.12-domain-*.md`
8. the current implementation in `src/app/api`, `src/domain`, `src/lib`, `src/db`

## Repository Conventions

- Keep route handlers thin.
- Use Zod where request data enters.
- Use `apiSuccess`, `apiError`, and `withErrorHandler`.
- Use `getSession` for auth-required routes.
- Keep DB access in storage classes or modules.
- Keep business rules in services.
- Prefer ownership filtering in queries rather than fetch-then-check patterns.
- Use Drizzle or bound parameters only.

## Verification Defaults

```bash
yarn test --run <changed-test-file>
yarn test
yarn eslint <changed-files>
```

Current repo caveat:

- `yarn tsc --noEmit` may fail because of existing unrelated type errors.
- `yarn lint` is currently not a reliable gate because the script itself is broken.

If API contracts changed:

```bash
yarn gen:api
```
