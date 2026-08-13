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

### 1. 서브에이전트에게 채점 위임 (fresh-context evaluator)

같은 대화 컨텍스트에서 방금 자기가 만든 코드를 스스로 채점하면 후하게 나오는 경향이 있다 (self-grading bias). 구현 대화를 본 적 없는 새 서브에이전트에게 채점을 위임한다.

- Claude Code: `Agent` 툴로 `general-purpose` 서브에이전트를 새로 띄운다. 전달하는 것은 구현 과정의 대화 이력이 아니라 아래뿐이다.
  - 이 스테이지에서 변경된 파일의 `git diff`
  - 이 문서의 "Frontend Quality Checklist"와 `references/frontend-quality-rules.md`
  - `docs/planning/2026.07.14-ai-work-evaluation-plan.md`의 O/X/N/A 체크리스트
- 서브에이전트를 띄울 수 없는 하네스(Codex 등)에서는 최소한 요약·압축된 새 세션에서 채점을 시작해, 구현 당시 판단을 그대로 재확인하지 않도록 한다.
- 아래 2~4단계의 검증 명령 실행과 findings 수집도 이 서브에이전트가 수행한다. 원 세션은 서브에이전트의 채점 결과를 그대로 Output Contract에 반영하고, 결과를 임의로 완화하지 않는다.

### 2. Pull the relevant checks

- loading, empty, and error states
- optimistic update rollback when relevant
- i18n coverage (no hardcoded UI strings)
- mobile layout and interaction

### 3. Run verification

```bash
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
yarn test:frontend
```

Manual checks when relevant: mobile layout, table interaction, toast and pending states.

### 4. Report findings

Report failing checks, missing tests, likely regressions, and residual risk if manual checks could not run.

## Frontend Quality Checklist

- Were loading, empty, and error states handled?
- Are new/changed UI strings in both `src/messages/ko.json` and `src/messages/en.json` (no hardcoded copy)?
- Is Zod validation applied to all external inputs (forms, searchParams)?
- Were related queries invalidated after mutations, and is rollback handled for optimistic updates?
- Was mobile layout checked?
- Were `yarn tsc --noEmit`, `yarn lint`, and `yarn test:frontend` run?
- If this change fixes an already-deployed bug (`fix:` type) and the root cause was a pattern AI kept missing, was it logged in `.agents/skills/CHANGELOG.md`'s failure categories (not just this task's `findings`) so future sessions inherit the lesson?

## Output Contract

Relay the fresh-context 서브에이전트(1단계)가 `docs/planning/2026.07.14-ai-work-evaluation-plan.md`의 O/X/N/A 체크리스트로 채점한 결과를 그대로 정리해 보고한다.

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
