# Dowin Backend API Spec Rules

## Read Order

1. `package.json`
2. `docs/onboarding.md`
3. `docs/dev/common/2026.03.12-api-conventions.md`
4. `docs/dev/common/2026.03.09-database-schema.md`
5. the relevant `docs/dev/**/2026.03.12-domain-*.md`
6. `src/api-spec/openapi.yaml`, `src/db/schema.ts`

## Repository Conventions

- Update `src/api-spec/openapi.yaml` before any route/service/storage code changes.
- For new persisted data, design the DB schema (table/column/constraint/index/ownership boundary) before implementation.
- Do not create or apply D1/Drizzle migrations manually. Use `yarn mig:local` for local schema migration work; `yarn mig:remote` requires explicit confirmation immediately before running it (Safety Guardrails in `AGENTS.md`), every time, regardless of prior instruction.
- Do not run `drizzle-kit generate`, `drizzle-kit push`, or `wrangler d1 migrations apply` directly.
- Keep backend date storage and API-facing canonical date values in UTC unless a domain doc explicitly says otherwise.

## Verification Defaults

```bash
yarn gen:api
yarn tsc --noEmit
```

If the schema changed:

```bash
yarn mig:local
```
