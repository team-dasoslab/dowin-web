---
name: dowin-commit
description: Use this skill whenever a Dowin task chain stage is about to commit — after dowin-backend-api-spec, dowin-backend, dowin-frontend-ui, or dowin-frontend-api-connect finishes and its relevant quality/performance/security checks report pass. Trigger it to write a commit message consistent with the repository's commit convention. Do not commit without consulting this skill first.
---

# Dowin Commit

## Overview

This is not an implementation stage — it is the mandatory reference point every code-producing stage calls right before running `git commit`. It exists so commit messages stay consistent regardless of which stage, task, or LLM produced the change.

Use `docs/planning/2026.04.09-commit-convention.md` as the convention source. Read it when first preparing a commit; reuse it within the session unless it changed or a convention question remains.

## When This Runs

Commit only stages actually performed, with one intent per commit and explicit authorization for the scope. There is no minimum commit count. Keep changes reviewable; authorization for local implementation is not authorization to commit or publish. A pending commit need not block independent authorized local work.

## Workflow

### 1. Read the convention

Read the convention if it has not been read in this session, changed, or does not settle the current case.

### 2. Pick the type

Use `feat|fix|docs|chore|refactor|style` — never `feature`. Match the type to what the stage actually did:

- `backend-api-spec` commit — usually `feat` (new contract/schema) or `fix`
- `backend` commit — `feat`/`fix` depending on whether it's new behavior or a correction
- `frontend-ui` commit — `feat`/`fix`/`style` depending on scope
- `frontend-api-connect` commit — usually `feat`/`fix`

### 3. Write the title — one line, nothing else

- `<type>: <변경 요약>`, one line, no body
- Korean, describes user impact/result over implementation mechanics
- no trailing period
- no manual PR number; the PR platform supplies it when applicable
- **do not write a multi-line commit body that lists several things.** A commit message body with multiple bullets ("- A 추가\n- B 수정\n- C 정리") is a sign the diff contains multiple intents. Split the diff into separate `git add`/`git commit` calls instead — one commit per bullet you were about to write.

### 4. Split before you stage, not after

Before running `git add`, look at everything changed since the last commit in this stage. Group it by intent, not by file type. Commit each group separately:

```bash
git add <files for intent 1 only>
git commit -m "<type>: <intent 1 요약>"
git add <files for intent 2 only>
git commit -m "<type>: <intent 2 요약>"
```

Do not `git add -A` — check `git status` first and stage precisely one intent's files at a time, so unrelated changes (including a later stage's uncommitted work) never land in the same commit.

### 5. Diff 크기 신호

하나의 intent라도 diff가 대략 300~400줄(생성 파일/lockfile 제외)을 넘으면 리뷰 탐지율이 급락한다는 근거가 있다(Cisco/Google 코드 리뷰 연구 — `docs/planning/2026.08.14-ai-code-review-scale-research.md` §2 참고). 이 기준을 넘으면:

- 정말 하나의 intent인지 다시 확인한다 — 더 쪼갤 수 있는 하위 단계가 있는지 본다.
- 못 쪼개는 경우(예: 일괄 리팩터), 그대로 커밋하되 다음 quality-check 단계에 이 커밋이 크다는 것과 `intent_check.where_to_look`을 반드시 구체적으로 채워야 한다는 것을 인계한다.

## Checklist

- Was the current convention consulted or its unchanged session context reused?
- Is the type one of `feat|fix|docs|chore|refactor|style` (not `feature`)?
- Does the title describe result/impact, not just "수정" / "업데이트"?
- Is the message a single line with no multi-bullet body?
- Is exactly one intent in this commit — if not, was it split into separate commits instead of listed in one message?
- Is the staged diff scoped to this stage's work only?
- If this commit's diff exceeds ~300~400 lines, was a split re-checked, and if not splittable, was that flagged for the next quality-check stage?

## Output Contract

```text
stage: commit
status: pass|needs_revision|fail
summary: 한두 문장 요약
commits:
- sha: <sha>
  message: <실제 커밋 메시지>
- sha: <sha>
  message: <실제 커밋 메시지>
next_step: 이 스테이지 커밋 완료 후 이동할 다음 스킬
```

(하나 이상의 커밋이 나올 수 있다 — 스테이지 diff가 여러 의도를 담고 있었다면 그만큼 항목이 늘어난다.)

Return rules:

- `pass` — 커밋(들)이 컨벤션대로 완료됨
- `needs_revision` — 메시지나 스코프를 고쳐서 다시 커밋해야 함 (아직 되돌릴 상위 스테이지는 없음, 이 스킬 안에서 재시도)
- `fail` — 컨벤션 문서를 읽지 않았거나, 의도가 섞여 분리가 필요하거나, 스코프가 안 맞아서 커밋하지 않음 — 무엇이 문제인지 보고

## Next Step

커밋 후 체인의 다음 스테이지로 이동한다 (예: `backend-api-spec` 커밋 후 → `dowin-backend`). 마지막 단계 이후에는 사용자가 요청한 완료 지점에서 결과를 인계한다. PR/merge는 별도 요청과 원격 승인 범위에 따른다.
