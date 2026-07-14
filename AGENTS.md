# AGENTS.md

## Project Overview

Dowin is a goal-execution and weekly operations service for individuals and teams. This repository uses Next.js, React 19, Tailwind CSS 4, Cloudflare D1, Orval, TanStack Query, Zod, Vitest, and Storybook.

## Core Reading Order

Before making changes, read only the files needed for the task in this order:

1. `README.md`
2. `docs/onboarding.md`
3. the relevant `.agents/skills/*/SKILL.md`
4. relevant `docs/dev/common/*`
5. relevant domain docs in `docs/dev/**`
6. current implementation files

If documents conflict with code, verify the implementation and prefer the current code path.

## Repository Rules

- Use `yarn` only.
- For backend changes, follow `.agents/skills/backend/SKILL.md`.
- For frontend changes, follow `.agents/skills/frontend/SKILL.md`.
- For WebView bridge, native-web handoff, and app-shell-dependent frontend changes, follow `.agents/skills/frontend-webview/SKILL.md`.
- For planning and documentation work, follow `.agents/skills/planning/SKILL.md`.
- For production operations, runbooks, incident response, restore/rollback guidance, or release-operability docs, follow `.agents/skills/operations/SKILL.md`.
- Reuse existing patterns before introducing new structure.
- Use Zod for input validation.
- Use `apiSuccess`, `apiError`, and `withErrorHandler` patterns for API work.
- Auth currently uses the `dowin_sid` session cookie pattern in active code.
- Update `src/api-spec/openapi.yaml` first when API contracts change.
- Do not create or apply D1/Drizzle migrations manually. For local DB migrations, use `yarn mig:local`; use `yarn mig:remote` only when explicitly asked to apply remote migrations.
- Consider `docs/onboarding.md` and matching `docs/dev/` files for material skill, process, or architecture changes.
- For planning or documentation work, follow `docs/dev/common/2026.05.09-product-positioning-and-writing-rules.md` and do not describe Dowin as a book-based/framework-based product in current-facing docs.

## Collaboration Style

- Do not default to agreement when a request has weak assumptions, unnecessary scope, or avoidable risk.
- Push back clearly when a better technical option exists, and explain the reasoning briefly.
- Prefer explicit tradeoffs, concrete objections, and practical alternatives over polite but empty compliance.
- In review or planning work, prioritize bugs, regressions, missing tests, and scope problems before summaries or encouragement.

## AI Code Generation Constraints (Cognitive Load Mitigation)

To prevent human cognitive overload and "Rubber-Stamping" during reviews, all AI agents MUST adhere to these structural constraints:

- **Scope Constraint (작업 크기 강제 제한):** Do not generate massive, monolithic code blocks or refactor unrelated files. Keep changes strictly localized to the requested task. If a task requires modifying many files, break it down and ask the user for approval first.
- **Intent Verification (의도 설명 강제):** When generating code or updating files, do not just summarize _what_ changed. You MUST explicitly explain _why_ specific architectural or logic decisions were made, allowing the human reviewer to validate your intent.
- **Review Guidance (리뷰 집중 영역 안내):** When acting as a reviewer or handing off a completed task, you MUST highlight the "Core Changes" and explicitly list which specific files the human should focus their review on (e.g., complex business logic, security boundaries) and which can be skimmed (e.g., boilerplates, simple UI tweaks).

## Project Skills

This repository contains project-local skill drafts in `.agents/skills/`.

Available local skills:

- `dowin-orchestrator`
- `dowin-backend`
- `dowin-frontend`
- `frontend-webview`
- `dowin-planning`
- `dowin-operations`
- `dowin-quality-check`
- `dowin-performance-check`
- `dowin-security-check`
- `dowin-harness-security-check`
- `dowin-product-updates`

Skill file locations:

- `.agents/skills/orchestrator/SKILL.md`
- `.agents/skills/backend/SKILL.md`
- `.agents/skills/frontend/SKILL.md`
- `.agents/skills/frontend-webview/SKILL.md`
- `.agents/skills/planning/SKILL.md`
- `.agents/skills/operations/SKILL.md`
- `.agents/skills/quality-check/SKILL.md`
- `.agents/skills/performance-check/SKILL.md`
- `.agents/skills/security-check/SKILL.md`
- `.agents/skills/harness-security-check/SKILL.md`
- `.agents/skills/product-updates/SKILL.md`

How to use them:

- If a task clearly matches one of these skills, read the matching `SKILL.md` first.
- Use the skill as the repository-specific operating guide for that task, not as a replacement for reading the current code.
- If these skills are later installed into `$CODEX_HOME/skills`, keep the installed copies aligned with the repository versions.

Trigger examples:

- `dowin-orchestrator`
  - "이 기능 요청 어디서부터 시작해야 할지 정리하고 단계 나눠줘"
  - "기획부터 구현, 검토까지 어떤 순서로 갈지 오케스트레이션해줘"
  - "이 변경을 planning/backend/frontend 중 어디로 보내야 하는지 판단해줘"
- `dowin-backend`
  - "로그인 API 에러 응답 규격 맞춰줘"
  - "workspace 멤버 강퇴 API 추가해줘"
  - "daily log 미래 날짜 검증 버그 고쳐줘"
- `dowin-frontend`
  - "dashboard/my를 실제 API 데이터로 바꿔줘"
  - "공통 Button 변형 추가하고 story도 갱신해줘"
  - "모바일 점수판 테이블 인터랙션 다듬어줘"
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
- `dowin-quality-check`
  - "이번 변경 배포 전에 품질 체크해줘"
  - "이 PR 기준으로 회귀 위험 검토해줘"
  - "테스트/린트/타입/수동 검증 기준으로 점검해줘"
- `dowin-performance-check`
  - "이 변경 성능 저하 포인트 있는지 코드로 봐줘"
  - "집계/쿼리 관점에서 병목 생길 부분 체크해줘"
  - "실행 말고 코드만 보고 성능 리스크 리뷰해줘"
- `dowin-security-check`
  - "이 PR 보안 관점에서 검토해줘"
  - "auth/인가/소유권 누락 없는지 봐줘"
  - "민감정보 노출이나 validation 구멍 있는지 체크해줘"
- `dowin-harness-security-check`
  - "AGENTS.md나 codex.md에 위험한 지시 없는지 봐줘"
  - "우리 에이전트 스킬/프롬프트 보안 체크해줘"
  - "비밀값 노출이나 과한 권한 지시가 없는지 검토해줘"
- `dowin-product-updates`
  - "새 기능 모아보기에 이번 기능 추가해줘"
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
