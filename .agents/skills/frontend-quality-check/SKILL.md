---
name: dowin-frontend-quality-check
description: Use this skill right after dowin-frontend-ui or dowin-frontend-api-connect finishes (both stages commit separately) to verify UI state handling, i18n, mobile behavior, and regression risk before that stage's commit. Trigger it for frontend test runs, regression checks, or frontend release-readiness verification.
---

# Dowin Frontend Quality Check

## Overview

Use this skill immediately after `dowin-frontend-api-connect` finishes. It focuses only on the frontend path.

Start with:

1. `docs/dev/common/2026.03.12-quality-strategy.md`
2. `references/frontend-quality-rules.md`
3. `docs/dev/common/2026.06.12-frontend-test-strategy.md`
4. the changed implementation

## Dowin Frontend Quality Facts

- Focus on loading/empty/error state handling, i18n coverage, mobile layout, and rollback behavior.
- Use the smallest useful verification set first, then broaden.

## Workflow

### 1. Pull the relevant checks

- loading, empty, and error states
- optimistic update rollback when relevant
- i18n coverage (no hardcoded UI strings)
- mobile layout and interaction

### 2. Run verification

```bash
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
yarn test:frontend
```

Manual checks when relevant: mobile layout, table interaction, toast and pending states.

### 3. Report findings

Report failing checks, missing tests, likely regressions, and residual risk if manual checks could not run.

## Frontend Quality Checklist

- Were loading, empty, and error states handled?
- Are new/changed UI strings in both `src/messages/ko.json` and `src/messages/en.json` (no hardcoded copy)?
- Is Zod validation applied to all external inputs (forms, searchParams)?
- Were related queries invalidated after mutations, and is rollback handled for optimistic updates?
- Was mobile layout checked?
- Were `yarn tsc --noEmit`, `yarn lint`, and `yarn test:frontend` run?

## Output Contract

Act as the "LLM-as-a-Judge" and evaluate against the O/X/N/A checklist in `docs/planning/2026.07.14-ai-work-evaluation-plan.md`.

```text
stage: frontend-quality
status: pass|needs_revision|fail
summary: 한두 문장 요약
evaluation_result: O/X/N/A 채점 결과 및 위반 사항
findings:
- ...
failure_categories:
- ...
return_to: planning|backend-api-spec|frontend-ui|frontend-api-connect|none
next_step: 다음 단계
```

Use the failure categories defined in `.agents/skills/CHANGELOG.md`.

Return rules:

- `pass`
  - 프론트 경로가 다음 단계로 넘어갈 수 있음
- `needs_revision`
  - 문제가 명확하고 가장 가까운 구현 단계(`frontend-ui` 또는 `frontend-api-connect`)로 돌아가야 함
- `fail`
  - 진행 불가; 계약 문제면 `backend-api-spec`, 범위 문제면 `planning`으로 복귀

## Next Step

`pass`면 번들 크기/렌더링 비용이 민감하면 `dowin-frontend-performance-check`, 보호된 액션·권한 노출이 걸려있으면 `dowin-frontend-security-check`를 이어서 수행한다. 모두 끝나면(또는 둘 다 해당 없으면) `dowin-commit`으로 **이 스테이지(frontend-ui 또는 frontend-api-connect)의 변경만** 커밋한다. 커밋 후: `frontend-ui` 다음이면 `dowin-frontend-api-connect`로, `frontend-api-connect` 다음이면 `dowin-release`로 이동한다.
