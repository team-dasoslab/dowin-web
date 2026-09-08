---
name: dowin-intake
description: Resolve scope, risk, tracking, and workflow for new features, material changes, or unclear Dowin requests. Clear low-risk maintenance can proceed directly.
---

# Dowin Intake

Use [AI workflow policy](../../../docs/dev/common/2026.09.08-ai-workflow-policy.md) for T0–T3 classification, completion boundaries, and verification.

## Route the request

- T0/T1 with clear scope: reuse the request as the brief and proceed to the relevant work. Do not require a new PRD or a timing interview.
- T2/T3 or unclear scope: establish intended behavior, non-goals, completion checks, and material decisions before dependent implementation.
- Reuse earlier decisions, Linear exceptions, Beads issues, and the existing task branch. “Continue” is not a new intake.
- Use `grill-with-docs` for unresolved product/contract decisions, not routine local implementation choices.
- Answer-only or review-only requests do not authorize edits, issue creation, branch switching, or release.

## Tracking and branch

Use Beads for implementation tracking. A scoped change needs a task; use an epic with child tasks for multi-stage work that needs separate ownership or handoff.
For a new T2/T3 task, establish whether Linear is required; reuse an existing issue or an explicit no-Linear decision. Never create an external issue silently.
If Linear tooling is unavailable, state that limit; do not assume a connection exists.

Create a work branch only if the current branch does not already belong to this task. Preserve unrelated changes; do not automatically stash them.
Use the repository's `<type>/<slug>` naming. Do not pull, switch to main, or recreate a branch on every continuation.

If a Beads write reports partial failure, verify the issue by ID before retrying. A successful DB write with failed Git export is a sync blocker, not a reason to create duplicate issues.
If the issue was not persisted, report the failed command and request help; never bypass filesystem permissions.

## Select only needed stages

- Feature/design planning → `dowin-planning`.
- Changed API contract/schema → `dowin-backend-api-spec` before implementation.
- Existing contract backend changes → `dowin-backend`.
- UI changes → `dowin-frontend-ui`; real data wiring → `dowin-frontend-api-connect` when needed.
- Review → relevant quality/performance/security Skill.
- Harness changes → `dowin-harness-security-check`.
- Run checks for stages actually performed. Local completion does not require a release.

## Output

Report briefly: risk level, scope, completion checks, tracking/branch reused or created, and next stage.
Use `pass` only when required material decisions are settled; otherwise `needs_revision` with the exact unresolved decision.
