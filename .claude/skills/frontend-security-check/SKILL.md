---
name: dowin-frontend-security-check
description: Use this skill after dowin-frontend-quality-check (and dowin-frontend-performance-check if it ran) whenever the frontend change touches protected actions, role-gated UI, or generated API usage for sensitive operations. Trigger it for permission-dependent UI surfaces or WebView bridge/native permission flows.
---

# Dowin Frontend Security Check

## Overview

Focused security review of the frontend path only.

Start with:

1. `docs/dev/common/2026.03.12-security.md`
2. `references/frontend-security-rules.md`
3. the changed implementation

## Workflow

### 1. Define the scope

Frontend change that calls protected APIs, exposes role-gated actions, or touches WebView bridge/native permission flows.

### 2. Review

- protected actions are not exposed to the wrong role in visible UI flows
- privileged mutations still depend on server-side enforcement, not just hidden UI
- client code does not embed private keys or server secrets
- generated API usage for sensitive operations passes the right auth context

### 3. Report

Confirmed findings, high-risk open questions, areas not fully verified, recommended follow-up.

## Checklist

- Are protected/role-gated actions hidden or disabled for users without the role, not just visually de-emphasized?
- Do privileged mutations still enforce authorization server-side (not just client-side hiding)?
- Are there no secrets/private keys embedded in client code or bundles?
- If this touches the WebView bridge or native permission flow, was `.agents/skills/frontend-webview/SKILL.md` also consulted?

## Output Contract

```text
stage: frontend-security
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|backend-security|frontend-ui|frontend-api-connect
next_step: 다음 단계
```

Categories: `missing_validation`, `auth_gap`, `ownership_gap`, `secret_exposure_risk`.

Return rules:

- `pass` — 이 경로에 막을 만한 보안 이슈 없음
- `needs_revision` — 구체적인 보안 수정이 `frontend-ui` 또는 `frontend-api-connect`에 필요함
- `fail` — 서버 쪽 강제가 빠져있으면 `backend-security`로, 설계 자체 문제면 `planning`으로 복귀

## Next Step

`pass`면 `dowin-commit`으로 이 스테이지 변경만 커밋한다. 커밋 후: `frontend-ui` 다음이면 `dowin-frontend-api-connect`로, `frontend-api-connect` 다음이면 `dowin-release`로 이동한다.
