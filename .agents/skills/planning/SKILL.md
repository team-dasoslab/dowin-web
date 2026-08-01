---
name: dowin-planning
description: Use this skill when planning new Dowin features, refining product flows, updating onboarding or planning docs, creating a new planning document, or turning rough ideas into repository-aligned action items. Trigger it for requests about feature planning, documentation updates, scoping MVP versus Post-MVP, or creating planning artifacts in this repository.
---

# Dowin Planning

## Overview

Use this skill for planning and documentation work in `docs/` and for feature-definition work that should precede implementation.

Read only what is needed.

Start with:

1. `references/planning-rules.md`
2. the relevant existing planning docs
3. the relevant domain docs
4. implementation only when feasibility or status matters

Read implementation only when feasibility or current status matters.

## Planning Rules

- Do not create fragmented planning docs unless there is a clear reason.
- Prefer extending the primary planning document for the feature or milestone.
- Keep YAML frontmatter at the top of planning docs.
- Planning should produce concrete action items, not only abstract ideas.
- Follow `docs/dev/common/2026.05.09-product-positioning-and-writing-rules.md`.
- Treat Dowin as an independent product. Do not justify current product direction by external books or frameworks in planning docs.
- Keep `docs/onboarding.md` current enough that another agent can start work quickly.
- When creating commits for planning/doc changes, follow `docs/planning/2026.04.09-commit-convention.md`. Prefer `docs: <변경 요약>` unless the change is clearly another type.

For detailed file paths and planning priorities, read `references/planning-rules.md`.

## Workflow

Planning moves through three stages: requirements → analysis → PRD. Do not skip straight to a PRD without the first two.

### 1. 요구사항 정리 (Requirements)

Define:

- what problem is being solved
- why it matters now
- whether this is MVP or Post-MVP
- which domains are affected

When the requirement itself is fuzzy, do not resolve it yourself — call the `grill-with-docs` skill (`.agents/skills/grill-me/SKILL.md`) to interview the user one question at a time, each with a recommended answer, grounded in `AGENTS.md` and existing docs.

### 2. 분석 (Analysis)

Cross-check the requirement against:

- existing domain docs and current implementation state
- shared constraints such as auth, workspace, scoreboard, and dashboard rules
- alternatives that might already cover the need

Use the repository's existing planning sections where applicable (background/context, priority/rationale, expected impact, cost/estimation). When a judgment call comes up here (scope trade-off, MVP boundary, alternative approach), call `grill-with-docs` again rather than deciding it silently.

### 3. PRD 작성 (Produce the PRD)

The planning doc is not done until it contains a PRD section covering:

- 배경 및 문제 정의
- 요구사항 (기능/비기능)
- 범위 (MVP vs Post-MVP)
- 영향 도메인/파일
- 성공/실패 기준
- 오픈 이슈 (진짜 미해결인 것만 — 채워 넣지 말 것)
- 다음 단계로 넘길 action item (`dowin-backend-api-spec`/`dowin-frontend-ui`가 그대로 쓸 수 있는 수준으로 구체적으로)

This PRD lives inside the primary planning document for the feature (`docs/planning/<date>-<feature>.md`) as a dedicated section, not a separate file — keep the repository's "extend the primary planning document" convention.

## Planning Checklist

- Did the document extend an existing planning thread when possible?
- Is the frontmatter present and valid?
- Does the plan distinguish MVP from Post-MVP?
- **Is there an actual PRD section (배경/요구사항/범위/영향 도메인/성공 기준/오픈 이슈/action item)?**
- Are action items concrete enough for engineering work?
- Does the plan align with existing domain rules and current Dowin product language?
- Should `docs/onboarding.md` also be updated?

## Output Contract

When finishing planning work, report with this shape by default:

```text
stage: planning
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|none
next_step: 다음 단계 또는 후속 작업
```

Use these planning-oriented categories when relevant:

- `scope_gap`
- `mvp_boundary_gap`
- `doc_impl_drift`

Return rules:

- `pass`
  - a PRD section exists and scope, boundaries, and next actions are clear enough for implementation
- `needs_revision`
  - planning is directionally correct, but scope, success criteria, or the PRD itself needs tightening
- `fail`
  - planning is not usable yet (including: no PRD written) and should stay in `planning`

## When To Escalate To Engineering Docs

If planning decisions harden into implementation constraints, update or create the matching docs in:

- `docs/dev/common/`
- `docs/dev/<domain>/`
- `docs/onboarding.md`

## Next Step

After planning scope and action items are concrete, move to `dowin-backend` for the backend implementation phase.
