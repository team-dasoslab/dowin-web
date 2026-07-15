---
name: dowin-quality-check
description: Use this skill when verifying Dowin code quality before completion, review, or deploy. Trigger it for requests about tests, quality gates, regression checks, backend or frontend verification, security checks, mobile checks, release readiness, or validating whether a Dowin change is safe to merge.
---

# Dowin Quality Check

## Overview

Use this skill when the main task is verification rather than implementation.

Start with:

1. `docs/dev/common/2026.03.12-quality-strategy.md`
2. `references/quality-rules.md`
3. the relevant domain docs
4. the changed implementation

If the quality doc conflicts with current implementation, verify the code and use the active implementation as the baseline.

## Dowin Quality Facts

- Dowin quality work should focus on business-rule correctness, auth and ownership safety, regression risk, and release readiness.
- Use the smallest useful verification set first, then broaden.
- Backend verification should include business rules, auth, ownership, and error cases.
- Frontend verification should include loading, empty, error, responsive, and rollback behavior where relevant.
- Current auth implementation uses the `dowin_sid` session cookie pattern.
- Treat repository-wide `tsc` and `lint` results as potentially noisy until the known baseline issues are fixed.
- When recommending follow-up commits, follow `docs/planning/2026.04.09-commit-convention.md`.

For detailed gates, command sets, and domain-specific checks, read `references/quality-rules.md`.

## Workflow

### 1. Define the verification scope

Classify the task:

- backend change
- frontend change
- API contract change
- DB schema change
- release or deploy readiness

### 2. Pull the relevant checks

Read only the checks that match the scope:

- business-rule tests
- integration checks
- security checks
- mobile or UI checks
- release gates

### 3. Run focused verification first

Prefer focused checks before full-suite runs when possible.

### 4. Expand to quality gates

If the task is broad, pre-merge, or deploy-related, expand to the full relevant quality gates.

### 5. Report findings clearly

When reviewing or validating, report:

- failing checks
- missing tests
- likely regressions
- residual risks if some checks could not run

## Quality Checklist

- Were the most relevant tests run first?
- Were domain business rules checked?
- Were auth, ownership, and strict Zod validation risks checked where relevant?
- For frontend changes, was I18n (다국어 처리) verified to ensure no hardcoded UI strings exist?
- Were type and lint checks run when appropriate?
- Were responsive or UI state checks included for frontend work?
- If this is release-facing, were manual checks considered?

## Output Contract

When finishing quality review, act as the "LLM-as-a-Judge" and report with this shape by default. You MUST evaluate against the O/X/N/A checklist in `docs/planning/2026.07.14-ai-work-evaluation-plan.md`:

```text
stage: quality
status: pass|needs_revision|fail
summary: 한두 문장 요약
evaluation_result: 2026.07.14-ai-work-evaluation-plan.md 기준 O/X/N/A 채점 결과 및 위반 사항
findings:
- ...
focus_list:
- [집중 리뷰 대상 파일]: 이유 (예: 핵심 보안 로직)
- [스킵 가능 파일]: 이유 (예: 단순 보일러플레이트)
failure_categories:
- ...
return_to: planning|backend|frontend|none
next_step: 다음 수정 단계 또는 추가 검증
```

Use the failure categories defined in `.agents/skills/CHANGELOG.md` when reporting quality findings. Prefer the shared category names there over inventing local aliases.

Return rules:

- `pass`
  - the checked path is safe to move to the next gate or completion
- `needs_revision`
  - issues are actionable and should return to the nearest implementation stage
- `fail`
  - the current result should not proceed; explicitly choose `planning`, `backend`, or `frontend` based on the real source of the regression

## Next Step

After quality review passes, continue to `dowin-performance-check` or `dowin-security-check` when those gates still apply.
