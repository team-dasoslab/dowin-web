---
name: dowin-backend-performance-check
description: Use this skill after dowin-backend-quality-check when the changed backend path is aggregation-heavy, query-heavy, or touches schema/index-sensitive access patterns. Trigger it for dashboard aggregation, weekly/monthly log calculation, new workspace-wide list endpoints, or schema changes that affect query cost.
---

# Dowin Backend Performance Check

## Overview

Static code review for performance risk on the backend path only — not a benchmark run.

Start with:

1. `references/backend-performance-rules.md`
2. the relevant domain doc
3. the changed implementation
4. `src/db/schema.ts` when new access patterns may need schema support

## Workflow

### 1. Trace the real hot path

route → service → storage → schema/query shape.

### 2. Look for static regression patterns

- repeated `filter`/`reduce`/`find` inside outer loops
- nested loops that multiply cost with data size (members × measures × logs)
- N+1 queries or repeated lookups in loops
- over-fetching rows or columns
- query shapes that likely need indexes
- expensive transformations repeated instead of reused/memoized

Typical Dowin hot paths: dashboard services, daily-log summary services, workspace-wide scoreboard summaries.

### 3. Report concrete risks

Likely bottleneck, why the code shape is expensive, which endpoint/path feels it, what change would reduce the cost, and residual uncertainty since no runtime measurement was done.

## Checklist

- Does the changed path repeatedly scan the same array/collection?
- Do nested loops grow with data size?
- Does storage fetch more data than the caller needs?
- Does the access pattern need an index, unique constraint, or narrower query?
- Was the real route → service → storage path traced?

## Output Contract

```text
stage: backend-performance
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: backend-api-spec|backend
next_step: 다음 단계
```

Categories: `performance_scan_risk`, `n_plus_one_risk`, `query_width_risk`.

Return rules:

- `pass` — 명확한 정적 회귀 패턴 없음, 또는 이미 처리됨
- `needs_revision` — 구체적인 hot path를 `backend`에서 손봐야 함
- `fail` — 비용 구조가 너무 위험함; hot path를 명시하며 `backend`(또는 스키마 문제면 `backend-api-spec`)로 복귀

## Next Step

`pass`면 auth/ownership이 걸려있는 경우 `dowin-backend-security-check`를 이어서 수행한다. 없으면 `dowin-commit`으로 이 스테이지 변경만 커밋한 뒤, `backend-api-spec` 다음이면 `dowin-backend`로, `backend` 다음이면 `dowin-frontend-ui` 또는 `dowin-release`로 이동한다.
