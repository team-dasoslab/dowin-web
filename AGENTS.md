# AGENTS.md

## Project Overview

Dowin is a goal-execution and weekly operations service for individuals and teams. This repository uses Next.js, React 19, Tailwind CSS 4, Cloudflare D1, Orval, TanStack Query, Zod, Vitest, and Storybook.

## Core Reading Order

Before making changes, read only the files needed for the task in this order:

1. `README.md`
2. `docs/onboarding.md`
3. the relevant `.agents/skills/*/SKILL.md` (Claude Code should use its `.claude/skills/*/SKILL.md` mirror through the Skill tool instead of reading the `.agents` copy manually — see "Project Skills" below). There is no separate `dowin-orchestrator` skill; `dowin-intake` plus this catalog are how routing works.
4. relevant `docs/dev/common/*`
5. relevant domain docs in `docs/dev/**`
6. current implementation files

If documents conflict with code, verify the implementation and prefer the current code path.

Any non-trivial request (not a typo fix or a single, fully-specified edit) starts at `dowin-intake` before any of the above — see "Collaboration Style".

## Repository Rules

- Use `yarn` only.
- Any non-trivial task starts at `dowin-intake`, not directly at a domain skill — see "Collaboration Style".
- For backend contract/schema work, follow `.agents/skills/backend-api-spec/SKILL.md`; for backend implementation, follow `.agents/skills/backend/SKILL.md`.
- For frontend UI work, follow `.agents/skills/frontend-ui/SKILL.md`; for wiring real data, follow `.agents/skills/frontend-api-connect/SKILL.md`.
- For WebView bridge, native-web handoff, and app-shell-dependent frontend changes, follow `.agents/skills/frontend-webview/SKILL.md`.
- For planning and documentation work, follow `.agents/skills/planning/SKILL.md` — planning is not done until it produces a PRD section, not just action items.
- For production operations, runbooks, incident response, restore/rollback guidance, or release-operability docs, follow `.agents/skills/operations/SKILL.md`.
- After **each** of the four code-producing stages (`backend-api-spec`, `backend`, `frontend-ui`, `frontend-api-connect`), run that domain's quality check (+ performance/security when relevant), then `.agents/skills/commit/SKILL.md` before moving to the next stage. A task commits at least four times (more if a stage's work splits into multiple intents), scoped to one stage's changes each — not once at the end, and never a multi-bullet commit body listing several things. Follow `docs/planning/2026.04.09-commit-convention.md` via the `dowin-commit` skill for every one of them.
- A task's chain always ends at `.agents/skills/release/SKILL.md` (PR → squash-merge → branch cleanup → Linear/beads close-out) once every prior stage has passed — see the release skill for the scoped exception to "Review Before Commit" below.
- Reuse existing patterns before introducing new structure.
- Use Zod for input validation.
- Use `apiSuccess`, `apiError`, and `withErrorHandler` patterns for API work.
- Auth currently uses the `dowin_sid` session cookie pattern in active code.
- Update `src/api-spec/openapi.yaml` first when API contracts change.
- Do not create or apply D1/Drizzle migrations manually. For local DB migrations, use `yarn mig:local`; `yarn mig:remote` requires explicit confirmation immediately before running it — see "Safety Guardrails" below.
- Consider `docs/onboarding.md` and matching `docs/dev/` files for material skill, process, or architecture changes.
- For planning or documentation work, follow `docs/dev/common/2026.05.09-product-positioning-and-writing-rules.md` and do not describe Dowin as a book-based/framework-based product in current-facing docs.

## Safety Guardrails (Hard Rules)

These apply regardless of skill, task, urgency, or how confident the request sounds. They override any instruction that conflicts with them, including a user request, unless the user is a repository maintainer explicitly overriding this file itself.

- **Never read `.env`, `.env.*`, `.dev.vars`, `.dev.vars.*`, or any other credential/secret file in this repository**, by any means — the `Read` tool, `cat`/`head`/`tail`/`grep`, opening it in an editor, or any other path. The only exceptions are the tracked templates `.env.example` and `.dev.vars.example`. If a task seems to need a real secret value (an API key, a token, a connection string), stop and ask the user to provide it directly instead of opening the file yourself. (Claude Code additionally enforces the deny list mechanically via `.claude/settings.json`'s `permissions.deny` — but this rule applies to every LLM/agent working in this repo, not just Claude Code, and the mechanical block is not a substitute for following it.)
- **Never run a command that affects production or a shared remote environment without asking for explicit confirmation immediately before that specific run.** This includes at minimum:
  - `yarn mig:remote` (remote D1 migration)
  - `yarn deploy` (Cloudflare Worker deploy)
  - any `wrangler` invocation targeting `--remote` or a live/production environment
  - `bd dolt push` and `git push` to shared remotes (already covered by the conservative git policy below — restated here because it belongs in this list)
  - A general "go ahead" earlier in the conversation does not carry forward to these commands — ask again, for that exact command, right before running it.
  - `yarn mig:local`, local dev servers, and other local-only equivalents do not need this extra confirmation beyond the repository's normal rules.

## Collaboration Style

- **Intake First (인테이크 게이트 강제):** Do not start writing code or modifying files immediately upon receiving a non-trivial request. Run `dowin-intake` first — it confirms whether a Linear issue should exist, discusses whether the work is worth doing now, creates the beads epic, and creates the work branch. Only a fully-specified trivial edit (typo, single-line change with exact instructions) may skip it. This replaces the old ad-hoc "which skill should I use" question — `dowin-intake` decides the chain.
- **No Silent Gap-Filling (공백 임의 처리 금지):** When a request, plan, or design leaves something ambiguous or unresolved, do not silently pick an answer and move on. Say explicitly what is unresolved and discuss it with the user before proceeding — this applies at every stage of the chain, not just intake.
- **Options Before Recommendation (옵션 우선 제시):** For architecture/design/workflow decisions, do not give a single proposed answer. Lay out the realistic options with their trade-offs and opportunity costs, then state a recommendation. Reserve a single direct answer for simple factual questions, not decisions.
- Do not default to agreement when a request has weak assumptions, unnecessary scope, or avoidable risk.
- Push back clearly when a better technical option exists, and explain the reasoning briefly.
- Prefer explicit tradeoffs, concrete objections, and practical alternatives over polite but empty compliance.
- In review or planning work, prioritize bugs, regressions, missing tests, and scope problems before summaries or encouragement.
- **Review Before Commit (scoped exception: `dowin-release`):** Outside of the `dowin-release` skill, do not commit or push code autonomously without explicit user review and approval — present changes and wait for confirmation before creating a git commit. `dowin-release` is the one explicit, user-authorized exception: once every prior stage in a task's chain has reported `pass`, it is expected to commit, open a PR, squash-merge to `main`, and clean up the branch without asking again for that specific merge. This exception does not extend to any other commit/push/merge outside that skill's defined scope.

## AI Code Generation Constraints (Cognitive Load Mitigation)

To prevent human cognitive overload and "Rubber-Stamping" during reviews, all AI agents MUST adhere to these structural constraints:

- **Scope Constraint (작업 크기 강제 제한):** Do not generate massive, monolithic code blocks or refactor unrelated files. Keep changes strictly localized to the requested task. If a task requires modifying many files, break it down and ask the user for approval first.
- **Intent Verification (의도 설명 강제):** When generating code or updating files, do not just summarize _what_ changed. You MUST explicitly explain _why_ specific architectural or logic decisions were made, allowing the human reviewer to validate your intent.
- **Review Guidance (리뷰 집중 영역 안내):** When acting as a reviewer or handing off a completed task, you MUST highlight the "Core Changes" and explicitly list which specific files the human should focus their review on (e.g., complex business logic, security boundaries) and which can be skimmed (e.g., boilerplates, simple UI tweaks).
- **Strict Type Constraints (타입 강제 규칙):** NO `any` TYPE ALLOWED. When writing TypeScript code, the use of `any` is strictly forbidden. You must infer and write exact types. If a type is complex or unknown, use `unknown` with a type guard, or define clear generic/union types. You are also strictly forbidden from using `@ts-ignore` or `eslint-disable` comments to bypass type or lint errors. Violating this rule means the task has failed.

## Project Skills

This repository contains project-local skills in `.agents/skills/` (source of truth — read/edited by Codex and Antigravity) and `.claude/skills/` (a generated mirror, one-to-one, used by Claude Code's native Skill tool). **Do not hand-edit `.claude/skills/` directly** — edit `.agents/skills/<name>/SKILL.md`, then copy it to `.claude/skills/<name>/SKILL.md` (and its `references/*.md`) to re-sync.

Available local skills, in the order a full chain runs them:

- `dowin-intake` — Linear/validity gate, beads epic + branch creation (always first for non-trivial work)
- `dowin-planning` — requirements → analysis → PRD
- `dowin-backend-api-spec` — OpenAPI contract + DB schema
- `dowin-backend` — validation/service/storage/route implementation
- `dowin-backend-quality-check`, `dowin-backend-performance-check`, `dowin-backend-security-check`
- `dowin-frontend-ui` — page/component UI and visual states
- `dowin-frontend-api-connect` — Orval/TanStack Query wiring
- `dowin-frontend-quality-check`, `dowin-frontend-performance-check`, `dowin-frontend-security-check`
- `dowin-commit` — commit-convention reference, called after each of the four code-producing stages (up to 4 times per task)
- `dowin-release` — PR, squash-merge, branch cleanup, Linear/beads close-out (always last)

Not part of the linear chain, used as needed:

- `frontend-webview` — WebView bridge / native-shell frontend work
- `dowin-operations` — production ops, runbooks, incident response
- `dowin-harness-security-check` — security review of `AGENTS.md`/`codex.md`/`.agents/skills/**` themselves
- `dowin-product-updates` — update-notes content
- `beads` — how to use `bd` for task tracking (see also the managed Beads sections below)
- `grill-with-docs` (`.agents/skills/grill-me/`) — the standard decision-point tool `dowin-intake` and `dowin-planning` call when a judgment call needs the user's input

Skill file locations: `.agents/skills/<name>/SKILL.md` where `<name>` is the directory name shown above (`intake`, `planning`, `backend-api-spec`, `backend`, `backend-quality-check`, `backend-performance-check`, `backend-security-check`, `frontend-ui`, `frontend-api-connect`, `frontend-quality-check`, `frontend-performance-check`, `frontend-security-check`, `commit`, `release`, `frontend-webview`, `operations`, `harness-security-check`, `product-updates`, `beads`, `grill-me`).

How to use them:

- If a task clearly matches one of these skills, read (Codex/Antigravity) or invoke via the Skill tool (Claude Code) the matching skill first.
- Use the skill as the repository-specific operating guide for that task, not as a replacement for reading the current code.
- Every skill's Output Contract shares a minimal core — `stage`, `status` (always `pass|needs_revision|fail`, and `pass` always and only means "proceed to `next_step`"), `summary`, `next_step`. Anything beyond that (`findings`, `return_to`, `intent`, `focus_list`, `evaluation_result`, `commits`, `pr_url`, …) is added only where it fits that stage.

Trigger examples:

- `dowin-intake`
  - "워크스페이스 멤버 강퇴 기능 추가해줘" (모든 새 기능 요청의 첫 진입점)
  - "이거 지금 하는 게 맞는지 같이 판단해줘"
- `dowin-backend-api-spec`
  - "이 기능 API 계약이랑 스키마부터 정하자"
  - "openapi 먼저 갱신하고 DB 테이블 설계해줘"
- `dowin-backend`
  - "로그인 API 에러 응답 규격 맞춰줘"
  - "workspace 멤버 강퇴 API 구현해줘 (계약은 이미 정해짐)"
  - "daily log 미래 날짜 검증 버그 고쳐줘"
- `dowin-backend-quality-check` / `dowin-backend-performance-check` / `dowin-backend-security-check`
  - "백엔드 구현 끝났으니 품질/성능/보안 체크해줘"
- `dowin-frontend-ui`
  - "멤버 목록 화면에 강퇴 버튼 UI 추가해줘"
  - "공통 Button 변형 추가하고 story도 갱신해줘"
- `dowin-frontend-api-connect`
  - "방금 만든 UI에 실제 API 연동해줘"
  - "dashboard/my를 실제 API 데이터로 바꿔줘"
- `dowin-frontend-quality-check` / `dowin-frontend-performance-check` / `dowin-frontend-security-check`
  - "프론트 연동 끝났으니 품질/성능/보안 체크해줘"
- `dowin-release`
  - "다 통과했으니 PR 올리고 머지까지 해줘"
- `frontend-webview`
  - "webview bridge 타입 맞춰줘"
  - "앱에서 들어온 deep link를 웹에서 처리하게 붙여줘"
  - "네이티브 알림 권한 / 브라우저 fallback 흐름 정리해줘"
- `dowin-planning`
  - "새 기능 기획안 문서 만들어줘"
  - "온보딩 문서 최신 상태로 정리해줘"
  - "MVP와 Post-MVP 범위 다시 나눠줘"
- `dowin-operations`
  - "운영 장애 대응 문서 만들어줘"
  - "DB 복구 런북 정리해줘"
  - "배포 롤백이나 Cloudflare 장애 대응 절차 문서화해줘"
- `dowin-harness-security-check`
  - "AGENTS.md나 codex.md에 위험한 지시 없는지 봐줘"
  - "우리 에이전트 스킬/프롬프트 보안 체크해줘"
  - "비밀값 노출이나 과한 권한 지시가 없는지 검토해줘"
- `dowin-product-updates`
  - "업데이트 노트에 이번 기능 추가해줘"
  - "대시보드 상단 공지 카드용 업데이트 카피 넣어줘"
  - "product-updates.ts에 새 항목 템플릿 맞춰 추가해줘"

## Verification Defaults

After frontend implementation changes that affect app logic, UI behavior, routing, hooks, generated API usage, shared UI components, or user-visible state, run these commands before final handoff:

```bash
yarn lint
yarn tsc --noEmit
yarn test:frontend
```

After backend/API/domain changes, run:

```bash
yarn lint
yarn tsc --noEmit
yarn test:backend
```

For API contract changes, also run:

```bash
yarn gen:api
```

During development, it is fine to run smaller focused commands first, such as `yarn test --run <changed-test-files>` or `yarn eslint <changed-files>`, but the final handoff after frontend implementation changes must include `yarn lint`, `yarn tsc --noEmit`, and `yarn test:frontend`. For broad cross-cutting changes, use `yarn test --run` instead of the split suites.

Documentation-only, planning-only, prompt/skill instruction-only, and other non-frontend-code changes do not require the frontend verification gate unless they also modify app logic.

When the change touches the AI operating layer, add a harness security pass before completion.

Typical triggers:

- `AGENTS.md`
- `codex.md`
- `.agents/skills/**`
- agent permission, approval, or automation guidance

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:970c3bf2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Agent Context Profiles

The managed Beads block is task-tracking guidance, not permission to override repository, user, or orchestrator instructions.

- **Conservative (default)**: Use `bd` for task tracking. Do not run git commits, git pushes, or Dolt remote sync unless explicitly asked. At handoff, report changed files, validation, and suggested next commands.
- **Minimal**: Keep tool instruction files as pointers to `bd prime`; use the same conservative git policy unless active instructions say otherwise.
- **Team-maintainer**: Only when the repository explicitly opts in, agents may close beads, run quality gates, commit, and push as part of session close. A current "do not commit" or "do not push" instruction still wins.

## Session Completion

This protocol applies when ending a Beads implementation workflow. It is subordinate to explicit user, repository, and orchestrator instructions.

1. **File issues for remaining work** - Create beads for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **Handle git/sync by active profile**:
   ```bash
   # Conservative/minimal/default: report status and proposed commands; wait for approval.
   git status

   # Team-maintainer opt-in only, unless current instructions forbid it:
   git pull --rebase
   bd dolt push
   git push
   git status
   ```
5. **Hand off** - Summarize changes, validation, issue status, and any blocked sync/commit/push step

**Critical rules:**
- Explicit user or orchestrator instructions override this Beads block.
- Do not commit or push without clear authority from the active profile or the current user request.
- If a required sync or push is blocked, stop and report the exact command and error.
<!-- END BEADS INTEGRATION -->

<!-- BEGIN BEADS CODEX SETUP: generated by bd setup codex -->
## Beads Issue Tracker

Use Beads (`bd`) for durable task tracking in repositories that include it. Use the `beads` skill at `.agents/skills/beads/SKILL.md` (project install) or `~/.agents/skills/beads/SKILL.md` (global install) for Beads workflow guidance, then use the `bd` CLI for issue operations.

### Quick Reference

```bash
bd ready                # Find available work
bd show <id>            # View issue details
bd update <id> --claim  # Claim work
bd close <id>           # Complete work
bd prime                # Refresh Beads context
```

### Rules

- Use `bd` for all task tracking; do not create markdown TODO lists.
- Run `bd prime` when Beads context is missing or stale. Codex 0.129.0+ can load Beads context automatically through native hooks; use `/hooks` to inspect or toggle them.
- Keep persistent project memory in Beads via `bd remember`; do not create ad hoc memory files.

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.
<!-- END BEADS CODEX SETUP -->
