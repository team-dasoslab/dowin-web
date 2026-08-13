---
name: dowin-backend-security-check
description: Use this skill after dowin-backend-quality-check (and dowin-backend-performance-check if it ran) whenever the backend change touches auth, session, authorization, ownership, validation, or sensitive data handling. Trigger it for protected API changes, admin/permission changes, or ownership/IDOR review.
---

# Dowin Backend Security Check

## Overview

Focused security review of the backend path only.

Start with:

1. `docs/dev/common/2026.03.12-security.md`
2. `references/backend-security-rules.md`
3. the relevant domain docs
4. the changed implementation

## Workflow

### 1. 서브에이전트에게 채점 위임 (fresh-context evaluator)

같은 대화 컨텍스트에서 방금 자기가 만든 코드를 스스로 채점하면 후하게 나오는 경향이 있다 (self-grading bias). 보안 리뷰는 특히 이 편향의 비용이 커서, 구현 대화를 본 적 없는 새 서브에이전트에게 채점을 위임한다.

- Claude Code: `Agent` 툴로 `general-purpose` 서브에이전트를 새로 띄운다. 전달하는 것은 구현 과정의 대화 이력이 아니라 아래뿐이다.
  - 이 스테이지에서 변경된 파일의 `git diff`
  - 이 문서의 "Checklist"와 `references/backend-security-rules.md`
- 서브에이전트를 띄울 수 없는 하네스(Codex 등)에서는 최소한 요약·압축된 새 세션에서 채점을 시작해, 구현 당시 판단을 그대로 재확인하지 않도록 한다.
- 아래 2~4단계의 스코프 정의·리뷰·보고도 이 서브에이전트가 수행한다. 원 세션은 서브에이전트의 채점 결과를 그대로 Output Contract에 반영하고, 결과를 임의로 완화하지 않는다.

### 2. Define the scope

auth/session change, protected API change, workspace/admin permission change, or data-access/ownership change.

### 3. Review

- **Auth/session**: session lookup path, cookie usage, unauthenticated behavior on protected routes, session expiry/invalid-session handling (`src/lib/server/auth.ts`, `src/app/api/auth/*`)
- **Authorization**: ADMIN-only routes stay ADMIN-only, member routes don't allow cross-workspace actions, privileged mutations don't rely on client trust
- **Ownership/IDOR**: resource access queries include user/workspace constraints; query-level filtering preferred over fetch-then-check; update/delete paths match read-path constraints
- **Input validation**: Zod coverage on body/params/query for user-controlled input; error responses don't leak internals
- **Sensitive data**: passwords/recovery codes/session IDs/cookies/secrets not logged or echoed in error payloads; secrets sourced from env, not hardcoded

### 4. Report

Confirmed findings, high-risk open questions, areas not fully verified, recommended follow-up.

## Checklist

- Are protected routes enforcing session checks?
- Are ADMIN-only actions still restricted correctly?
- Are ownership filters applied at query level?
- Are request body, params, and query values validated?
- Are secrets/cookies/passwords/recovery codes kept out of logs and error payloads?

## Output Contract

```text
stage: backend-security
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|backend-api-spec|backend
next_step: 다음 단계
```

Categories: `missing_validation`, `auth_gap`, `ownership_gap`, `secret_exposure_risk`.

Return rules:

- `pass` — 이 경로에 막을 만한 보안 이슈 없음
- `needs_revision` — 구체적인 보안 수정이 `backend`에 필요함
- `fail` — 설계 자체가 안전하지 않으면 `planning`, 아니면 `backend`(또는 계약/스키마 문제면 `backend-api-spec`)로 복귀

## Next Step

`pass`면 `dowin-commit`으로 이 스테이지 변경만 커밋한다. 커밋 후: `backend-api-spec` 다음이면 `dowin-backend`로, `backend` 다음이면 UI 연동이 필요한 경우 `dowin-frontend-ui`로, 백엔드 단독 작업이면 `dowin-release`로 이동한다.
