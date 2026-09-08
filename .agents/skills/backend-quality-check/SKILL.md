---
name: dowin-backend-quality-check
description: Use this skill right after dowin-backend-api-spec or dowin-backend finishes (both stages commit separately) to verify business-rule correctness, auth/ownership safety, and regression risk before that stage's commit. Trigger it for backend test runs, regression checks, or backend release-readiness verification.
---

# Dowin Backend Quality Check

## Overview

Use this skill after `dowin-backend-api-spec` or `dowin-backend` finishes. It focuses only on the backend path.

Start with:

1. `docs/dev/common/2026.03.12-quality-strategy.md`
2. `references/backend-quality-rules.md`
3. the relevant domain docs
4. the changed implementation

## Dowin Backend Quality Facts

- Focus on business-rule correctness, auth/ownership safety, regression risk, and error-response behavior.
- Use the smallest useful verification set first, then broaden.
- Treat repository-wide `tsc`/`lint` results as potentially noisy until known baseline issues are fixed.

## Workflow

For a small T1 change, same-session review is sufficient; identify it honestly in the output. The independent evaluation below applies to T2/T3. Reuse the available tools rather than assuming a harness cannot delegate. An unavailable required review is a reported limitation, not a fabricated pass.

### 1. 서브에이전트에게 채점 위임 (fresh-context evaluator)

같은 대화 컨텍스트에서 방금 자기가 만든 코드를 스스로 채점하면 후하게 나오는 경향이 있다 (self-grading bias). 구현 대화를 본 적 없는 새 서브에이전트에게 채점을 위임한다.

- Claude Code: `Agent` 툴로 `general-purpose` 서브에이전트를 새로 띄운다. 전달하는 것은 구현 과정의 대화 이력이 아니라 아래뿐이다.
  - 이 스테이지에서 변경된 파일의 `git diff`
  - 이 문서의 "Backend Quality Checklist"와 `references/backend-quality-rules.md`
  - `docs/planning/2026.07.14-ai-work-evaluation-plan.md`의 O/X/N/A 체크리스트
- 서브에이전트를 띄울 수 없는 하네스(Codex 등)에서는 최소한 요약·압축된 새 세션에서 채점을 시작해, 구현 당시 판단을 그대로 재확인하지 않도록 한다.
- 아래 2~4단계의 검증 명령 실행과 findings 수집도 이 서브에이전트가 수행한다. 원 세션은 서브에이전트의 채점 결과를 그대로 Output Contract에 반영하고, 결과를 임의로 완화하지 않는다.

### 2. Pull the relevant checks

- business-rule tests for the changed domain
- auth and ownership checks
- error response behavior
- API contract vs. implementation match

### 3. Run verification

Use AGENTS.md Verification Defaults. Reuse passing results only while relevant source, dependencies, configuration, and test environment remain unchanged. Repeat checks affected by subsequent edits or failures. Documentation-only changes do not require app test suites.

```bash
pnpm test --run <changed-test-file>
pnpm test:backend
pnpm tsc --noEmit
pnpm lint
```

### 4. Report findings

Report failing checks, missing tests, likely regressions, and residual risk if some checks could not run.

## Backend Quality Checklist

- Were the most relevant backend tests run first, then `pnpm test:backend`?
- Were domain business rules checked (see `references/backend-quality-rules.md` for the domain list)?
- Are auth, ownership, and strict Zod validation applied correctly?
- Does the implementation match `src/api-spec/openapi.yaml`?
- Were type and lint checks run?
- If this change fixes an already-deployed bug (`fix:` type) and the root cause was a pattern AI kept missing, was it logged in `.agents/skills/CHANGELOG.md`'s failure categories (not just this task's `findings`) so future sessions inherit the lesson?
- Was `intent_check.where_to_look` written as specific file/line pointers (not a restatement of the full diff), and did it explicitly call out any parts of the diff that match intent and need no re-review?

## Output Contract

선택한 검토 방식(T1 동일 세션 또는 T2/T3 독립 검토)을 명시하고 검토자가 `docs/planning/2026.07.14-ai-work-evaluation-plan.md`의 O/X/N/A 체크리스트로 채점한 결과를 그대로 정리해 보고한다. `intent_check`는 diff를 다시 나열하는 필드가 아니라, 사람이 실제로 봐야 할 지점을 좁혀주기 위한 필드다 — 의도와 일치하는 부분은 "재검토 불필요"로 명시해 리뷰 범위를 줄인다 (근거: `docs/planning/2026.08.14-ai-code-review-scale-research.md` §5).

```text
stage: backend-quality
status: pass|needs_revision|fail
summary: 한두 문장 요약
intent_check:
  intended: 이 스테이지가 구현하려 한 것 한 줄
  diff_vs_intent: 실제 diff가 의도와 일치하는지, 벗어난 지점이 있다면 어디인지
  where_to_look:
  - 사람이 반드시 봐야 할 지점 (파일:라인 + 이유)
  - 의도와 일치해 재검토 불필요한 범위가 있다면 명시
evaluation_result: O/X/N/A 채점 결과 및 위반 사항
findings:
- ...
failure_categories:
- ...
return_to: planning|backend-api-spec|backend|none
next_step: 다음 단계
```

Use the failure categories defined in `.agents/skills/CHANGELOG.md`.

Return rules:

- `pass`
  - 백엔드 경로가 다음 단계(frontend 또는 release)로 넘어갈 수 있음
- `needs_revision`
  - 문제가 명확하고 가장 가까운 구현 단계로 돌아가야 함
- `fail`
  - 진행 불가; `backend-api-spec`(계약/스키마 문제) 또는 `backend`(구현 문제)로 명시적으로 복귀

## Next Step

`pass`면 이 변경이 aggregation/쿼리 폭이 민감하면 `dowin-backend-performance-check`, auth/ownership이 걸려있으면 `dowin-backend-security-check`를 이어서 수행한다. 모든 관련 검토가 끝나면 요청에 필요한 다음 구현 단계로 이동하거나 결과를 인계한다. 커밋은 승인된 경우에만 `dowin-commit`을 사용한다. 이미 충족된 검사와 승인 여부를 인계에 포함한다.
