# AGENTS.md

## Project Overview

WIG is a goal-management service built around 4DX concepts. This repository uses Next.js, React 19, Tailwind CSS 4, Cloudflare D1, Orval, TanStack Query, Zod, Vitest, and Storybook.

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
- For backend changes, follow `.agents/skills/wig-backend/SKILL.md`.
- For frontend changes, follow `.agents/skills/wig-frontend/SKILL.md`.
- For planning and documentation work, follow `.agents/skills/wig-planning/SKILL.md`.
- Reuse existing patterns before introducing new structure.
- Use Zod for input validation.
- Use `apiSuccess`, `apiError`, and `withErrorHandler` patterns for API work.
- Auth currently uses the `wig_sid` session cookie pattern in active code.
- Update `src/api-spec/openapi.yaml` first when API contracts change.
- Consider `docs/onboarding.md` and matching `docs/dev/` files for material skill, process, or architecture changes.

## Collaboration Style

- Do not default to agreement when a request has weak assumptions, unnecessary scope, or avoidable risk.
- Push back clearly when a better technical option exists, and explain the reasoning briefly.
- Prefer explicit tradeoffs, concrete objections, and practical alternatives over polite but empty compliance.
- In review or planning work, prioritize bugs, regressions, missing tests, and scope problems before summaries or encouragement.

## Project Skills

This repository contains project-local skill drafts in `.agents/skills/`.

Available local skills:

- `wig-orchestrator`
- `wig-backend`
- `wig-frontend`
- `wig-planning`
- `wig-quality-check`
- `wig-performance-check`
- `wig-security-check`
- `wig-harness-security-check`
- `wig-product-updates`

Skill file locations:

- `.agents/skills/wig-orchestrator/SKILL.md`
- `.agents/skills/wig-backend/SKILL.md`
- `.agents/skills/wig-frontend/SKILL.md`
- `.agents/skills/wig-planning/SKILL.md`
- `.agents/skills/wig-quality-check/SKILL.md`
- `.agents/skills/wig-performance-check/SKILL.md`
- `.agents/skills/wig-security-check/SKILL.md`
- `.agents/skills/wig-harness-security-check/SKILL.md`
- `.agents/skills/wig-product-updates/SKILL.md`

How to use them:

- If a task clearly matches one of these skills, read the matching `SKILL.md` first.
- Use the skill as the repository-specific operating guide for that task, not as a replacement for reading the current code.
- If these skills are later installed into `$CODEX_HOME/skills`, keep the installed copies aligned with the repository versions.

Trigger examples:

- `wig-orchestrator`
  - "이 기능 요청 어디서부터 시작해야 할지 정리하고 단계 나눠줘"
  - "기획부터 구현, 검토까지 어떤 순서로 갈지 오케스트레이션해줘"
  - "이 변경을 planning/backend/frontend 중 어디로 보내야 하는지 판단해줘"
- `wig-backend`
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
- `wig-performance-check`
  - "이 변경 성능 저하 포인트 있는지 코드로 봐줘"
  - "집계/쿼리 관점에서 병목 생길 부분 체크해줘"
  - "실행 말고 코드만 보고 성능 리스크 리뷰해줘"
- `wig-security-check`
  - "이 PR 보안 관점에서 검토해줘"
  - "auth/인가/소유권 누락 없는지 봐줘"
  - "민감정보 노출이나 validation 구멍 있는지 체크해줘"
- `wig-harness-security-check`
  - "AGENTS.md나 codex.md에 위험한 지시 없는지 봐줘"
  - "우리 에이전트 스킬/프롬프트 보안 체크해줘"
  - "비밀값 노출이나 과한 권한 지시가 없는지 검토해줘"
- `wig-product-updates`
  - "새 기능 모아보기에 이번 기능 추가해줘"
  - "대시보드 상단 공지 카드용 업데이트 카피 넣어줘"
  - "product-updates.ts에 새 항목 템플릿 맞춰 추가해줘"

## Verification Defaults

Run the smallest useful verification set for the task. Common commands:

```bash
yarn tsc --noEmit
yarn lint
yarn test
yarn gen:api
```

Only run the commands relevant to the change.

When the change touches the AI operating layer, add a harness security pass before completion.

Typical triggers:

- `AGENTS.md`
- `codex.md`
- `.agents/skills/**`
- agent permission, approval, or automation guidance
