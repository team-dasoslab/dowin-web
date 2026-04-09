---
name: wig-orchestrator
description: Use this skill as the top-level WIG router when a request needs workflow selection, stage orchestration, multi-step handoff, or review-gate coordination across planning, backend, frontend, quality, performance, and security skills. Trigger it for broad feature work, cross-domain changes, ambiguous requests, or when WIG should act like an orchestrator rather than a single implementation worker.
---

# Wig Orchestrator

## Overview

Use this skill as the top-level controller for WIG work.

This skill does not replace domain skills.
It selects them, sequences them, and enforces handoff and review rules.

Start with:

1. `docs/planning/2026.04.09-wig-agent-orchestration.md`
2. `AGENTS.md`
3. `codex.md`
4. the relevant downstream skill `SKILL.md`
5. implementation only after the stage and scope are clear

If docs conflict with live implementation, verify the implementation and use the active code path as the baseline.

## WIG Orchestrator Facts

- The orchestrator is the top-level working mode, not a separate product runtime.
- Default to a single-session orchestration loop unless splitting work materially reduces context or risk.
- Use downstream skills for actual domain work:
  - `wig-planning`
  - `wig-backend`
  - `wig-frontend`
  - `wig-quality-check`
  - `wig-performance-check`
  - `wig-security-check`
- Do not hand the full conversation to downstream work by default; pass only the task-local context needed for that stage.
- Review gates should send work back to the nearest responsible stage instead of escalating every problem to planning.

## Workflow

### 1. Classify the request

First decide:

- is this planning, backend, frontend, or review-led work?
- is the request ambiguous enough to require planning first?
- can the task stay in one session?
- does the task need handoff across multiple stages?

### 2. Select the workflow

Use these defaults:

- ambiguous or broad feature request
  - start with `wig-planning`
- API/domain/data-model change
  - `wig-backend`
  - then `wig-frontend` if user-facing integration is needed
- UI/state-only change
  - `wig-frontend`
- verification/release/readiness request
  - start with `wig-quality-check`
  - add `wig-performance-check` and `wig-security-check` when relevant

### 3. Choose single-session vs multi-session

Prefer single-session when:

- the task is small
- only one domain is changing
- the context is already clear

Use multi-session orchestration when:

- planning and implementation should be separated
- backend and frontend need independent handoff
- review gates should evaluate a narrowed change set

### 4. Prepare handoff context

When handing work to another stage, pass only:

- problem summary
- expected behavior
- known facts
- in-scope files or domains
- out-of-scope areas
- done criteria
- artifacts from the previous stage

Use the repository handoff contract from `docs/planning/2026.04.09-wig-agent-orchestration.md`.

### 5. Enforce review gates

After implementation work, run the relevant review path:

1. `wig-quality-check`
2. `wig-performance-check` when the path is query-heavy, aggregation-heavy, or payload-heavy
3. `wig-security-check` when auth, ownership, validation, or protected actions are involved

When a review stage returns `needs_revision` or `fail`, send the task back to the nearest responsible stage with:

- the review summary
- findings
- failure categories
- the required return target

### 6. Stop conditions

Treat the orchestration as complete when:

- the final implementation stage reports `pass`
- the required review gates report `pass`, or remaining risks are explicitly accepted
- the final answer can explain what changed, what was verified, and what remains risky

## Output Contract

When using this skill as the top-level controller, report with this shape by default:

```text
stage: orchestrator
status: pass|needs_revision|fail
summary: 한두 문장 요약
selected_workflow:
- planning
- backend
- frontend
- quality
- performance
- security
findings:
- ...
failure_categories:
- ...
return_to: orchestrator|planning|backend|frontend|none
next_step: 다음 단계 또는 종료 조건
```

Use these orchestrator-oriented categories when relevant:

- `scope_gap`
- `mvp_boundary_gap`
- `api_contract_mismatch`
- `state_handling_gap`
- `missing_test`
- `performance_scan_risk`
- `auth_gap`
- `ownership_gap`
- `doc_impl_drift`

Return rules:

- `pass`
  - the workflow selection and stage progression are clear and usable
- `needs_revision`
  - the task can continue, but the orchestration plan or handoff needs tightening
- `fail`
  - the task should not proceed yet because the scope, workflow, or return target is still wrong

## Checklist

- Did you classify the task before acting?
- Did you pick the smallest valid workflow instead of blindly chaining every stage?
- Did you keep single-session as the default unless real separation helps?
- Did you pass only task-local context to the next stage?
- Did review findings return to the nearest responsible stage?
- Did the final answer clearly state what was done, what was verified, and what remains risky?

## Next Step

After the workflow is selected, move into the first concrete downstream skill and keep this orchestrator skill as the control plane for handoff and review decisions.
