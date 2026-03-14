# AGENTS.md

## Project Overview

WIG is a goal-management service built around 4DX concepts. This repository uses Next.js, React 19, Tailwind CSS 4, Cloudflare D1, Orval, TanStack Query, Zod, Vitest, and Storybook.

## Core Reading Order

Before making changes, read only the files needed for the task in this order:

1. `README.md`
2. `docs/onboarding.md`
3. `.agents/workflows/*.md`
4. relevant `docs/dev/common/*`
5. relevant domain docs in `docs/dev/**`
6. current implementation files

If documents conflict with code, verify the implementation and prefer the current code path.

## Repository Rules

- Use `yarn` only.
- For backend changes, follow `.agents/workflows/backend-tdd.md`.
- For frontend changes, follow `.agents/workflows/frontend.md`.
- For planning and documentation work, follow `.agents/workflows/planning.md`.
- Reuse existing patterns before introducing new structure.
- Use Zod for input validation.
- Use `apiSuccess`, `apiError`, and `withErrorHandler` patterns for API work.
- Auth currently uses the `wig_sid` session cookie pattern in active code.
- Update `src/api-spec/openapi.yaml` first when API contracts change.
- Consider `docs/onboarding.md` and matching `docs/dev/` files for material workflow or architecture changes.

## Project Skills

This repository contains project-local skill drafts in `.agents/skills/`.

Available local skills:

- `wig-backend-tdd`
- `wig-frontend`
- `wig-planning`
- `wig-quality-check`

Skill file locations:

- `.agents/skills/wig-backend-tdd/SKILL.md`
- `.agents/skills/wig-frontend/SKILL.md`
- `.agents/skills/wig-planning/SKILL.md`
- `.agents/skills/wig-quality-check/SKILL.md`

How to use them:

- If a task clearly matches one of these skills, read the matching `SKILL.md` first.
- Use the skill as a repository-specific extension of the workflow docs, not as a replacement for reading the current code.
- If these skills are later installed into `$CODEX_HOME/skills`, keep the installed copies aligned with the repository versions.

Trigger examples:

- `wig-backend-tdd`
  - "로그인 API 에러 응답 규격 맞춰줘"
  - "workspace 멤버 강퇴 API 추가해줘"
  - "daily log 미래 날짜 검증 버그 고쳐줘"
- `wig-frontend`
  - "dashboard/my를 실제 API 데이터로 바꿔줘"
  - "공통 Button 변형 추가하고 story도 갱신해줘"
  - "모바일 점수판 테이블 인터랙션 다듬어줘"
- `wig-planning`
  - "새 기능 기획안 문서 만들어줘"
  - "온보딩 문서 최신 상태로 정리해줘"
  - "MVP와 Post-MVP 범위 다시 나눠줘"
- `wig-quality-check`
  - "이번 변경 배포 전에 품질 체크해줘"
  - "이 PR 기준으로 회귀 위험 검토해줘"
  - "테스트/린트/타입/수동 검증 기준으로 점검해줘"

## Verification Defaults

Run the smallest useful verification set for the task. Common commands:

```bash
yarn tsc --noEmit
yarn lint
yarn test
yarn gen:api
```

Only run the commands relevant to the change.
