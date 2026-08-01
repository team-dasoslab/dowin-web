---
name: dowin-frontend-performance-check
description: Use this skill after dowin-frontend-quality-check when the changed frontend path affects payload size, refetch frequency, render cost, or bundle size. Trigger it for large list rendering, repeated derived calculations, unstable query keys, or Cloudflare Worker bundle-size-sensitive changes.
---

# Dowin Frontend Performance Check

## Overview

Static code review for performance risk on the frontend path only — not a benchmark run.

Start with:

1. `references/frontend-performance-rules.md`
2. the changed implementation

## Workflow

### 1. Trace the render/fetch path

component → hook → query key → payload shape.

### 2. Look for static regression patterns

- unstable query keys or repeated mount logic causing repeated refetches
- requesting large payloads only to slice most of it on the client
- duplicated expensive derived calculations on every render without memoization
- large lists rendered without virtualization when the dataset can grow unbounded
- static assets placed in `src/app` that push the Cloudflare Worker bundle toward the 3MB free-tier limit (see `dowin-frontend-ui`'s asset-size rule)

### 3. Report concrete risks

Likely bottleneck, why the code shape is expensive, which screen/flow feels it, what change would reduce the cost, and residual uncertainty since no runtime measurement was done.

## Checklist

- Are query keys stable, and are refetches intentional rather than accidental?
- Are payloads scoped to what the UI actually needs?
- Are expensive derived values memoized instead of recomputed every render?
- Do large/unbounded lists use virtualization or pagination?
- Do new static assets in `src/app` stay within size limits?

## Output Contract

```text
stage: frontend-performance
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: backend-api-spec|frontend-ui|frontend-api-connect
next_step: 다음 단계
```

Categories: `performance_scan_risk`, `query_width_risk`.

Return rules:

- `pass` — 명확한 정적 회귀 패턴 없음, 또는 이미 처리됨
- `needs_revision` — 구체적인 지점을 `frontend-ui` 또는 `frontend-api-connect`에서 손봐야 함
- `fail` — 비용 구조가 너무 위험함; 지점을 명시하며 복귀

## Next Step

`pass`면 보호된 액션·권한 노출이 걸려있는 경우 `dowin-frontend-security-check`를 이어서 수행한다. 없으면 `dowin-commit`으로 이 스테이지 변경만 커밋한 뒤, `frontend-ui` 다음이면 `dowin-frontend-api-connect`로, `frontend-api-connect` 다음이면 `dowin-release`로 이동한다.
