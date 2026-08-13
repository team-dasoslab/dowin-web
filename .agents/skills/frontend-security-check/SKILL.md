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

### 1. 서브에이전트에게 채점 위임 (fresh-context evaluator)

같은 대화 컨텍스트에서 방금 자기가 만든 코드를 스스로 채점하면 후하게 나오는 경향이 있다 (self-grading bias). 보안 리뷰는 특히 이 편향의 비용이 커서, 구현 대화를 본 적 없는 새 서브에이전트에게 채점을 위임한다.

- Claude Code: `Agent` 툴로 `general-purpose` 서브에이전트를 새로 띄운다. 전달하는 것은 구현 과정의 대화 이력이 아니라 아래뿐이다.
  - 이 스테이지에서 변경된 파일의 `git diff`
  - 이 문서의 "Checklist"와 `references/frontend-security-rules.md`
- 서브에이전트를 띄울 수 없는 하네스(Codex 등)에서는 최소한 요약·압축된 새 세션에서 채점을 시작해, 구현 당시 판단을 그대로 재확인하지 않도록 한다.
- 아래 2~4단계의 스코프 정의·리뷰·보고도 이 서브에이전트가 수행한다. 원 세션은 서브에이전트의 채점 결과를 그대로 Output Contract에 반영하고, 결과를 임의로 완화하지 않는다.

### 2. Define the scope

Frontend change that calls protected APIs, exposes role-gated actions, or touches WebView bridge/native permission flows.

### 3. Review

- protected actions are not exposed to the wrong role in visible UI flows
- privileged mutations still depend on server-side enforcement, not just hidden UI
- client code does not embed private keys or server secrets
- generated API usage for sensitive operations passes the right auth context

### 4. Report

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
