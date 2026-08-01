---
name: dowin-backend-quality-check
description: Use this skill right after dowin-backend-api-spec or dowin-backend finishes (both stages commit separately) to verify business-rule correctness, auth/ownership safety, and regression risk before that stage's commit. Trigger it for backend test runs, regression checks, or backend release-readiness verification.
---

# Dowin Backend Quality Check

## Overview

Use this skill immediately after `dowin-backend` finishes, before moving to any frontend stage. It focuses only on the backend path.

Start with:

1. `docs/dev/common/2026.03.12-quality-strategy.md`
2. `references/backend-quality-rules.md`
3. the relevant domain docs
4. the changed implementation

## Dowin Backend Quality Facts

- Focus on business-rule correctness, auth/ownership safety, regression risk, and error-response behavior.
- Use the smallest useful verification set first, then broaden.
- Treat repository-wide `tsc`/`lint` results as potentially noisy until known baseline issues are fixed.

## Workflow

### 1. Pull the relevant checks

- business-rule tests for the changed domain
- auth and ownership checks
- error response behavior
- API contract vs. implementation match

### 2. Run verification

```bash
yarn test --run <changed-test-file>
yarn test:backend
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

### 3. Report findings

Report failing checks, missing tests, likely regressions, and residual risk if some checks could not run.

## Backend Quality Checklist

- Were the most relevant backend tests run first, then `yarn test:backend`?
- Were domain business rules checked (see `references/backend-quality-rules.md` for the domain list)?
- Are auth, ownership, and strict Zod validation applied correctly?
- Does the implementation match `src/api-spec/openapi.yaml`?
- Were type and lint checks run?

## Output Contract

Act as the "LLM-as-a-Judge" and evaluate against the O/X/N/A checklist in `docs/planning/2026.07.14-ai-work-evaluation-plan.md`.

```text
stage: backend-quality
status: pass|needs_revision|fail
summary: 한두 문장 요약
evaluation_result: O/X/N/A 채점 결과 및 위반 사항
findings:
- ...
failure_categories:
- ...
return_to: planning|backend-api-spec|backend|none
next_step: 다음 단계
```

Use the failure categories defined in `.agents/skills/CHANGELOG.md`.

Return rules:

- `pass`
  - 백엔드 경로가 다음 단계(frontend 또는 release)로 넘어갈 수 있음
- `needs_revision`
  - 문제가 명확하고 가장 가까운 구현 단계로 돌아가야 함
- `fail`
  - 진행 불가; `backend-api-spec`(계약/스키마 문제) 또는 `backend`(구현 문제)로 명시적으로 복귀

## Next Step

`pass`면 이 변경이 aggregation/쿼리 폭이 민감하면 `dowin-backend-performance-check`, auth/ownership이 걸려있으면 `dowin-backend-security-check`를 이어서 수행한다. 모두 끝나면(또는 둘 다 해당 없으면) `dowin-commit`으로 **이 스테이지(backend-api-spec 또는 backend)의 변경만** 커밋한다. 커밋 후: `backend-api-spec` 다음이면 `dowin-backend`로, `backend` 다음이면 `dowin-frontend-ui`(UI 필요 시) 또는 `dowin-release`로 이동한다.
