---
name: dowin-release
description: Use this skill as the final stage of a Dowin task chain, after all relevant backend/frontend quality, performance, and security checks report pass. Trigger it to open a PR against the repository's template, squash-merge to main, sync the local branch back to main, delete the finished branch, and close out the Linear issue and beads epic. Do not run this until every prior stage in the chain has passed.
---

# Dowin Release

## Overview

This is the last skill in the chain. A task is not "done" until this skill completes — merged to `main`, local branch cleaned up, Linear issue closed, beads epic closed.

This is a repository-level policy decision, not a default: the repository's general git policy elsewhere (`AGENTS.md`, `CLAUDE.md`) is conservative (no commit/push without explicit approval). This skill is the explicit, scoped exception the user authorized for the Dowin task chain specifically — it only applies once every prior stage in `selected_workflow` has reported `pass`.

## Preconditions

Do not start this skill unless:

- every stage in the current task's `selected_workflow` (from `dowin-intake`) has reported `status: pass`
- there are no unresolved `needs_revision`/`fail` results anywhere upstream
- the working tree has no unrelated uncommitted changes (`git status` clean except this task's own work)

If any precondition fails, stop and report which stage is not actually done instead of proceeding.

## Workflow

### 1. Confirm the stage commits exist

By the time this skill runs, `dowin-commit` should already have produced at least one commit per stage that ran (`backend-api-spec`, `backend`, `frontend-ui`, `frontend-api-connect` — fewer if the task didn't need all of them, more if any stage split into multiple intents). Run `git log main..HEAD --oneline` to confirm.

If there is unexpected uncommitted work, that means a prior stage skipped its `dowin-commit` step — do not silently fold it into a new commit here. Go back and run `dowin-commit` for whichever stage it belongs to, scoped correctly, rather than bundling it into the release step.

### 2. Open the PR

```bash
gh pr create --title "<type>: <변경 요약>" --body "$(cat <<'EOF'
## 배경

<PRD의 배경/문제 정의를 요약>

## 주요 변경 사항

- ...
- ...

## 검증

- [ ] yarn lint
- [ ] yarn tsc --noEmit
- [ ] yarn test:backend
- [ ] yarn test:frontend
EOF
)"
```

Follow `.github/pull_request_template.md` exactly — same section headers, same checklist items. Check off only the verification items that actually ran and passed during the chain; leave the rest unchecked rather than guessing.

### 3. Squash-merge to main

```bash
gh pr merge --squash --delete-branch
```

`--delete-branch` removes the remote branch on merge (the repository has remote auto-delete behavior for merged branches; this flag makes it explicit either way).

### 4. Sync local state

```bash
git checkout main
git pull
git branch -d <task-branch>
```

Use `-d` (safe delete), not `-D` — if it refuses because the branch has unmerged commits, stop and investigate rather than forcing it.

### 5. Close out tracking

- Close the Linear issue tied to this task (via Linear MCP if available in this session; otherwise tell the user which issue to close manually — do not silently skip this).
- `bd close <epic-id> --reason="merged: <PR URL>"`

**CRITICAL SANDBOX RULE**: If `bd close` or `gh pr create` fails due to sandbox blocks, permission errors, or environment issues, **YOU MUST STOP** and ask the user to execute the commands for you. Do not silently skip them.

## Output Contract

```text
stage: release
status: pass|needs_revision|fail
summary: 한두 문장 요약
pr_url: <URL>
merge_commit: <sha 또는 none>
linear_issue_closed: true|false|manual-follow-up
beads_epic_closed: true|false
next_step: 체인 종료 또는 재시도 대상
```

Return rules:

- `pass`
  - PR이 머지되고, 로컬 브랜치가 정리되고, beads epic이 close됨
- `needs_revision`
  - PR은 열렸지만 머지 전 사소한 수정이 필요함 (예: 템플릿 체크리스트 항목 보정) — release 안에서 재시도
- `fail`
  - 사전 조건이 안 맞거나(선행 단계 미완료) 머지 중 충돌/실패가 있음 — 무엇이 막혔는지 구체적으로 보고하고 진행하지 않음

## Next Step

`pass`면 이 작업의 체인이 끝난 것이다. 후속 작업이 필요하면 새 `dowin-intake`부터 다시 시작한다.
