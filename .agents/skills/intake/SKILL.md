---
name: dowin-intake
description: Use this skill first for any new, ambiguous, or scope-unclear Dowin request before planning or implementation begins. Trigger it to confirm whether a Linear issue should exist, whether the work is worth doing now, and which downstream skill chain (planning/backend/frontend/review) the task should enter. Skip it only for trivial fixes (typos, single-line changes) with explicit, fully-specified instructions.
---

# Dowin Intake

## Overview

This is the mandatory first stage for any non-trivial Dowin request. It replaces ad-hoc "which skill should I use" questions with a structured gate: confirm the Linear issue, confirm the work is actually worth doing now, then route into the rest of the chain.

This skill does not implement anything. It decides whether to proceed, and if so, into which chain.

## When To Skip

Trivial, fully-specified changes (typo fixes, single-line tweaks, a change the user has already fully specified down to the exact edit) can skip intake and go straight to the matching skill or direct implementation.

## Workflow

### 1. Confirm the Linear issue

- Check whether a Linear issue already exists for this request (via Linear MCP if it is available in the current session).
- If Linear MCP is not available in this session, say so explicitly and do not silently proceed as if no issue is needed. Ask the user for a manual issue ID/link, or get an explicit decision to proceed without one.
- If no issue exists, ask whether one should be created before continuing. Do not create it silently.
- When creating a Linear issue, use `.agents/skills/intake/references/linear-config.md` for this workspace's team/project, status set, priority scale, and label taxonomy. Ask the user to choose the priority, Issue Type label, Area label, and due date (or confirm none) before creating the issue — do not infer or default any of these yourself.

### 2. Discuss validity and timing

Before treating this as approved work, discuss with the user:

- why this is needed
- whether it is needed now, or could wait
- whether a simpler alternative already covers the need

Do not resolve open judgment calls yourself. When a decision point needs the user's input, call the `grill-with-docs` skill (`.agents/skills/grill-me/SKILL.md`) instead of asking ad hoc — it interviews one question at a time with a recommended answer for each, and keeps the discussion grounded in `AGENTS.md` and existing docs.

### 3. Classify the workflow

Once the work is confirmed as worth doing, decide which chain it needs:

- ambiguous or broad feature request → start with `dowin-planning`
- API/domain/data-model change → `dowin-backend-api-spec` → `dowin-backend` → `dowin-backend-quality-check` (+ performance/security as relevant), then `dowin-frontend-ui` → `dowin-frontend-api-connect` → `dowin-frontend-quality-check` (+ performance/security as relevant) if user-facing integration is needed
- UI/state-only change with no contract change → `dowin-frontend-ui` → `dowin-frontend-api-connect` → `dowin-frontend-quality-check`
- verification/release/readiness request on already-implemented work → go straight to the relevant `*-quality-check` skill(s)

Every chain that reaches `pass` on all its stages ends at `dowin-release` — it is not optional and not a separate decision; it is the terminal stage of `selected_workflow`.

### 4. Create the beads epic

If the work proceeds:

```bash
bd create --title="<짧은 제목>" --type=epic --priority=<0-4> --notes="linear: <이슈 ID 또는 URL, 없으면 'none - 사용자 승인'>"
```

Each downstream stage that actually runs creates its own child issue under this epic (`bd create ... --parent=<epic-id>`), claims it on entry, and closes it when that stage's Output Contract reports `pass`. This is what lets progress survive a session reset or a switch between Claude Code, Codex, or another LLM — `bd show <epic-id>` shows exactly which stages are done.

**CRITICAL SANDBOX RULE**: If `bd create` fails due to sandbox blocks, permission errors, or environment issues, **YOU MUST STOP** and ask the user to execute the command for you. Do not silently skip it and proceed to branch creation or implementation.

If the work does not proceed (held or rejected), do not create a beads issue — record the discussion outcome in the conversation only.

### 5. Create and switch to the work branch

Once the work is confirmed (`pass`), create the branch before entering `dowin-planning` or implementation — do not do implementation work on `main`.

Before switching, run `git status` and, if there is uncommitted work that is not part of this task, stash it (`git stash -u`) or ask the user rather than discarding it.

Follow the repository's existing branch naming pattern (`<type>/<kebab-slug>` off `main` — observed in git history, e.g. `feature/action-item`, `chore/fix-ci-errors`, `docs/glossary`; no separate convention doc exists, so this pattern is the source of truth):

```bash
git checkout main
git pull
git checkout -b <type>/<kebab-slug>
```

`<type>` follows the same set as the commit convention (`docs/planning/2026.04.09-commit-convention.md`): `feature|fix|docs|chore|refactor|style`. `<kebab-slug>` is a short English slug of the task (not the Linear ID — this repo's existing branches don't encode it in the name; the Linear ID lives in the beads epic's `notes` field instead).

## Output Contract

```text
stage: intake
status: pass|needs_revision|fail
linear_issue: <id 또는 none>
beads_epic_id: <id 또는 none>
branch: <생성된 브랜치명 또는 none>
selected_workflow:
- ...
summary: 한두 문장 요약
next_step: 다음에 들어갈 첫 스킬
```

`status`는 모든 Dowin 스킬 공통 3값(`pass|needs_revision|fail`)을 쓴다. intake에서는:

- `needs_revision` = 보류(hold) — 지금은 진행하지 않기로 함. 논의는 더 필요하지만 완전히 기각된 건 아님.
- `fail` = 기각(reject) — 타당성이 없다고 판단됨.

두 경우 모두 beads 이슈는 생성하지 않는다.

Use these intake-specific categories when relevant:

- `no_linear_issue`
- `timing_not_justified`
- `scope_undecided`

Return rules:

- `pass`
  - Linear 이슈(또는 명시적 예외)와 타당성 논의가 끝났고, 다음 체인이 명확함
- `needs_revision`
  - 지금은 보류 — 나중에 다시 논의 가능 (beads 이슈 생성 없음)
- `fail`
  - 타당성이 없다고 판단되어 진행하지 않음 (beads 이슈 생성 없음)

## Next Step

`pass`면 `selected_workflow`의 첫 스킬로 진입한다. 대부분의 새 기능은 `dowin-planning`에서 시작한다.
