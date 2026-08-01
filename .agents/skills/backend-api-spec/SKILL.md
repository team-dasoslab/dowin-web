---
name: dowin-backend-api-spec
description: Use this skill when a Dowin backend change needs its API contract and/or DB schema fixed before implementation — new or changed endpoints, request/response shapes, or persisted data models. Trigger it for OpenAPI contract work, schema design for new tables/columns/relations, or any backend task where the contract is not yet settled. Runs before dowin-backend.
---

# Dowin Backend API Spec

## Overview

Use this skill to lock the OpenAPI contract and, when the feature needs persisted data, the DB schema — before any service/storage/route implementation starts. `dowin-backend` assumes both are already fixed by the time it runs.

Start with:

1. `references/backend-api-spec-rules.md`
2. the matching domain doc
3. `docs/dev/common/2026.03.09-database-schema.md` when the task adds a new feature or changes persisted data
4. `src/api-spec/openapi.yaml` and `src/db/schema.ts` (current state)

If docs conflict with code, verify the implementation and trust the current code path.

## JIT Search Strategy

- **API Contracts:** search the `operationId` or path in `src/api-spec/openapi.yaml` first.
- **Database Schema:** search table/column names in `src/db/schema.ts` and `docs/dev/common/2026.03.09-database-schema.md` first.

## Workflow

### 1. Confirm the target domain

Open the matching domain doc and extract business rules, error cases, auth rules, and validation rules before touching the contract.

### 2. Fix the API contract

Update `src/api-spec/openapi.yaml` first so the contract is explicit before any implementation. Cover request/response shapes, error responses, and auth requirements.

### 3. Design the schema when the feature needs it

For a new feature with new tables, columns, relations, or constraints:

- table and column shape
- nullable vs required fields
- unique constraints and indexes
- foreign keys and cascade behavior
- ownership and workspace boundaries implied by the data model

Reflect the design in `src/db/schema.ts`, then run:

```bash
yarn mig:local
```

Do not manually create or apply migration files with direct SQL/Drizzle/Wrangler commands. `yarn mig:remote` is a production-affecting command — per `AGENTS.md`'s Safety Guardrails, get explicit confirmation immediately before running it, every time, even if the task already said to apply the migration remotely.

### 4. Regenerate the client

```bash
yarn gen:api
```

## Backend API Spec Checklist

- Was `src/api-spec/openapi.yaml` updated before any implementation?
- If persisted data is involved, was the schema designed (table/column/constraint/index/ownership) before implementation?
- Was `yarn mig:local` used instead of manual migration commands?
- Was `yarn gen:api` run after a contract change?

## Output Contract

```text
stage: backend-api-spec
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|backend-api-spec
next_step: dowin-backend-quality-check → dowin-commit → dowin-backend
```

Use these categories when relevant:

- `api_contract_mismatch`
- `schema_design_gap`
- `doc_impl_drift`

Return rules:

- `pass`
  - 계약과 스키마가 모두 확정되어 `dowin-backend`로 넘어갈 수 있음
- `needs_revision`
  - 계약/스키마 방향은 맞지만 세부 수정이 필요함
- `fail`
  - 범위 자체가 잘못됨; `planning`으로 복귀

## Next Step

`pass`면 `dowin-backend-quality-check`(+ 스키마/인덱스가 민감하면 `dowin-backend-performance-check`, auth/ownership 스키마가 걸리면 `dowin-backend-security-check`)를 이 단계의 변경 범위에 대해 실행하고, 통과하면 `dowin-commit`으로 이 단계의 변경만 커밋한 뒤 `dowin-backend`로 이동해 validation/service/storage/route를 구현한다. 계약/스키마 단계는 아직 비즈니스 로직이 없으므로 quality-check는 주로 계약-스키마 일치와 네이밍/제약조건 타당성 확인에 그친다 — 이게 정상이다.
