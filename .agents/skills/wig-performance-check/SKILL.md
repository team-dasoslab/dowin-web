---
name: wig-performance-check
description: Use this skill when reviewing WIG code for likely performance regressions without relying on manual runtime measurement. Trigger it for requests about backend aggregation cost, query expansion, repeated scans, list endpoints, expensive loops, unnecessary data loading, or whether a code change is likely to slow down under scale.
---

# Wig Performance Check

## Overview

Use this skill when the main task is a static performance review of code rather than feature implementation.

Start with:

1. `references/performance-rules.md`
2. the relevant domain docs
3. the changed implementation

If docs conflict with code, verify the implementation and use the active code path as the baseline.

## WIG Performance Facts

- This skill is for code-based performance review, not benchmark execution.
- It should identify likely regression points from code structure even when runtime measurements are unavailable.
- WIG performance risk is usually concentrated in aggregation services, repeated array scans, wide DB reads, and workspace-wide list or summary endpoints.
- Backend paths such as dashboard aggregation and weekly or monthly log calculation deserve extra scrutiny.
- This skill should work independently even when no separate performance planning doc is available.
- When recommending follow-up commits, follow `docs/planning/2026.04.09-commit-convention.md`.

For concrete heuristics and reporting rules, read `references/performance-rules.md`.

## Workflow

### 1. Define the review scope

Classify the task:

- aggregation-heavy backend change
- query-heavy storage change
- schema change that affects index or query cost
- frontend change that increases payload size or repeated fetching
- release or pre-merge performance review

### 2. Review the hot path in code

Prefer tracing the real hot path:

- route
- service
- storage
- schema or query shape

### 3. Look for static regression patterns

Prioritize finding:

- repeated `map/filter/reduce` scans over the same dataset
- nested loops that scale with members x measures x logs
- loading more rows or columns than the response needs
- N+1 query patterns or duplicated lookups
- missing indexes or constraints implied by new access patterns
- unnecessary recomputation instead of reuse or indexing

### 4. Report concrete risks

When reporting, focus on:

- likely bottlenecks
- why the code shape is expensive
- which endpoint or path will feel it
- what change would reduce the cost
- residual uncertainty when no runtime measurement was done

## Performance Checklist

- Does the changed path repeatedly scan the same array or collection?
- Does the logic introduce nested loops that grow with data size?
- Does storage fetch more data than the caller needs?
- Does the access pattern need an index, unique constraint, or narrower query?
- Does the code repeat work that could be pre-grouped, memoized per request, or indexed once?
- Did the review trace the real route -> service -> storage path?

## Output Contract

When finishing performance review, report with this shape by default:

```text
stage: performance
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: backend|frontend|none
next_step: 다음 수정 단계 또는 후속 검토
```

Use these performance-oriented categories when relevant:

- `performance_scan_risk`
- `n_plus_one_risk`
- `query_width_risk`

Return rules:

- `pass`
  - no meaningful static regression pattern was found, or the risk is already handled
- `needs_revision`
  - a concrete hot path should be reworked in `backend` or `frontend`
- `fail`
  - the change should not proceed in its current form because the cost shape is too risky; return to the nearest implementation stage with the hot path called out explicitly

## Next Step

If the changed path has no obvious regression pattern or the risks are handled, continue with the normal workflow or treat the performance review as complete.
