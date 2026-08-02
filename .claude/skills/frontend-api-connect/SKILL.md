---
name: dowin-frontend-api-connect
description: Use this skill after dowin-frontend-ui to wire real server data into already-built UI — Orval hooks, TanStack Query, mutations, cache invalidation, toast, and rollback. Trigger it for API-to-UI wiring, data fetching, mutation handling, or query invalidation work.
---

# Dowin Frontend API Connect

## Overview

Use this skill to connect the UI built by `dowin-frontend-ui` to real backend data — `src/api/generated`, TanStack Query, domain hooks.

Start with:

1. `references/frontend-api-connect-rules.md`
2. `src/api-spec/openapi.yaml` and generated hooks in `src/api/generated`
3. the page/component built by `dowin-frontend-ui`

If contracts changed, regenerate the client first.

## Dowin Frontend API Connect Facts

- When a page owns both local client state and TanStack Query server-state logic, split them into domain hooks instead of keeping both concerns in the page component.
- Put local form state, field handlers, and client-side validation in a dedicated `use...Form` hook.
- Put TanStack Query mutations, cache invalidation, toast handling, and navigation side effects in a dedicated domain hook such as `use...Mutation`.
- Use Zod for form validation.
- For server state, use generated Orval hooks and TanStack Query patterns.
- After mutations, invalidate related queries.
- Do not introduce `useSearchParams()` in a page path unless wrapped by a `Suspense` boundary; prefer reading the page `searchParams` prop when the value can be resolved on the server.
- When creating commits, follow `docs/planning/2026.04.09-commit-convention.md`.

## JIT Search Strategy

- **API Integrations:** look for `useQuery`/`useMutation` hooks in `src/app/<domain>/_hooks/` or `src/api/generated/`.

## Workflow

### 1. Confirm data shape

1. inspect `src/api-spec/openapi.yaml`
2. inspect generated hooks in `src/api/generated`
3. inspect existing consumers before creating new fetch patterns

### 2. Wire hooks into the UI

If a data-fetching/state-handling point has more than one valid approach (e.g. optimistic update vs. wait-for-response, cache/invalidation strategy, retry behavior on mutation failure) and nothing already settles it, stop and ask the user before implementing it. Do not pick one on your own judgment — see `AGENTS.md`'s No Silent Gap-Filling rule.

- move mutation wiring, invalidation, toast calls, and navigation effects into domain hooks (`use...Mutation`)
- move form state and validation into `use...Form` hooks
- keep forms and buttons disabled during pending submissions when needed

### 3. Verify

```bash
yarn test --run <changed-or-affected-test-files>
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

If the API contract changed:

```bash
yarn gen:api
```

Broader check when substantial:

```bash
yarn test:frontend
yarn test --run
```

## Frontend API Connect Checklist

- If the page mixes local form state and TanStack Query mutation logic, are they split into domain hooks with clear responsibilities?
- If server state changed, were related queries invalidated?
- If query-string state is needed, was the choice between server `searchParams` and client `useSearchParams()` intentional, with `Suspense` when client-side?
- Is Zod validation applied strictly to all external inputs (form data, URL searchParams)?
- Were changed/affected frontend tests run?
- If API contracts changed, was `yarn gen:api` run?
- Did every data-fetching/state-handling point with more than one valid approach get decided by the user instead of picked silently?

## Output Contract

```text
stage: frontend-api-connect
status: pass|needs_revision|fail
summary: 한두 문장 요약
intent: 왜 이런 상태 관리(State handling) 결정을 내렸는지 의도(Why) 설명
findings:
- ...
focus_list:
- [집중 리뷰 대상 파일]: 이유 (예: 복잡한 상태 관리 로직, API 연동부 등)
- [스킵 가능 파일]: 이유
failure_categories:
- ...
return_to: planning|backend-api-spec|frontend-ui|frontend-api-connect
next_step: dowin-frontend-quality-check → dowin-commit → dowin-release
```

Use these categories when relevant: `api_contract_mismatch`, `state_handling_gap`, `rollback_gap`, `missing_test`, `doc_impl_drift`, `undecided_design_point`.

Return rules:

- `pass` — 데이터 연동과 상태 처리가 준비됨. `dowin-frontend-quality-check`로 이동.
- `needs_revision` — 이 스킬 안에서 수정 필요
- `fail` — 계약 문제면 `backend-api-spec`, UI 자체 문제면 `frontend-ui`, 범위 문제면 `planning`으로 복귀

## Next Step

연동이 끝나면 `dowin-frontend-quality-check`(+ 조건부 `dowin-frontend-performance-check`/`dowin-frontend-security-check`)를 이 단계 변경 범위에 대해 실행한다. 통과하면 `dowin-commit`으로 이 단계만 커밋(체인의 마지막 코드 커밋 스테이지 — 여러 의도가 섞여 있으면 여러 커밋)한 뒤 `dowin-release`로 이동한다.
