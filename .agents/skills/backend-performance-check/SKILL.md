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

### 1. 서브에이전트에게 채점 위임 (fresh-context evaluator)

같은 대화 컨텍스트에서 방금 자기가 만든 코드를 스스로 채점하면 후하게 나오는 경향이 있다 (self-grading bias). 구현 대화를 본 적 없는 새 서브에이전트에게 채점을 위임한다.

- Claude Code: `Agent` 툴로 `general-purpose` 서브에이전트를 새로 띄운다. 전달하는 것은 구현 과정의 대화 이력이 아니라 아래뿐이다.
  - 이 스테이지에서 변경된 파일의 `git diff`
  - 이 문서의 "Checklist"와 `references/backend-performance-rules.md`
- 서브에이전트를 띄울 수 없는 하네스(Codex 등)에서는 최소한 요약·압축된 새 세션에서 채점을 시작해, 구현 당시 판단을 그대로 재확인하지 않도록 한다.
- 아래 2~4단계의 hot path 추적·정적 패턴 점검·보고도 이 서브에이전트가 수행한다. 원 세션은 서브에이전트의 채점 결과를 그대로 Output Contract에 반영하고, 결과를 임의로 완화하지 않는다.

### 2. Trace the real hot path

route → service → storage → schema/query shape.

### 3. Look for static regression patterns

- repeated `filter`/`reduce`/`find` inside outer loops
- nested loops that multiply cost with data size (members × measures × logs)
- N+1 queries or repeated lookups in loops
- over-fetching rows or columns
- query shapes that likely need indexes
- expensive transformations repeated instead of reused/memoized

Typical Dowin hot paths: dashboard services, daily-log summary services, workspace-wide scoreboard summaries.

### 4. Report concrete risks

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
