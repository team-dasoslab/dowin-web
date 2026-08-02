---
name: dowin-frontend-ui
description: Use this skill when building or changing Dowin page/component UI, layout, visual states, or Storybook stories — before wiring real API data. Trigger it for page UI, component composition, loading/empty/error state UI, mobile layout, or shared UI work. Runs before dowin-frontend-api-connect.
---

# Dowin Frontend UI

## Overview

Use this skill for the visual/composition layer in `src/app`, `src/components/ui`, `src/context`. Build the UI boundary and visual states first; real data wiring (Orval hooks, TanStack Query, mutations) belongs to `dowin-frontend-api-connect`, which runs after this.

Read only the files needed for the task.

Start with:

1. `references/frontend-ui-rules.md`
2. the relevant domain doc
3. the current page/component implementation

## Dowin Frontend UI Facts

- Prefer `src/components/ui` shared components before creating new ones.
- Shared UI should remain unopinionated; inject styling at usage sites.
- Use `asChild` when a `Button` wraps `Link`.
- React 19 means new `forwardRef` wrappers should not be introduced by default.
- Use Lucide React for icons.
- Page-local status components (skeleton, empty, error, no-workspace) should stay in the same page/domain file, declared near the bottom, unless reused across multiple files.
- Keep mobile behavior in scope, especially dashboard and scoreboard flows.
- Keep the Cloudflare Worker build output under the 3MB free tier limit — do not place large static assets (> 200KB) in `src/app`; use optimized JPG/PNG or move larger assets to `public/`. `.webp` is ignored by Next.js file-based OG generation.
- When creating commits, follow `docs/planning/2026.04.09-commit-convention.md`.

## Workflow

### 1. Identify the UI boundary

Decide whether the change belongs in `src/components/ui` (shared primitives) or `src/app/<domain>/_components` (domain UI).

### 2. Implement with the existing visual language

If a visual/interaction point has more than one valid approach (e.g. modal vs. inline expansion, how an empty/error state is presented, confirmation-before-destructive-action pattern) and nothing already settles it, stop and ask the user before implementing it. Do not pick one on your own judgment — see `AGENTS.md`'s No Silent Gap-Filling rule.

- preserve the current Dowin aesthetic and utility patterns
- keep loading, empty, error, and success states explicit (placeholder/mock data is fine at this stage — real wiring comes next in `dowin-frontend-api-connect`)
- prefer keeping skeleton/empty/similar fallback UIs as page-local helpers in the same file instead of splitting into separate top-level files too early
- keep page components focused on composition and rendering
- avoid new hardcoded user-facing Korean or English strings; wire visible labels, empty states, errors, tooltips, button text, and status copy through `useTranslations` or the established server translation pattern

### 3. Storybook rule

If a shared UI component is added or materially changed, add or update a story in `src/components/ui/stories`.

### 4. Verify

```bash
yarn test --run <changed-or-affected-test-files>
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

Broader check when substantial:

```bash
yarn storybook
yarn test:storybook --run
```

## Frontend UI Checklist

- Is this in the correct layer and directory?
- Did shared UI get reused before creating a new primitive?
- If a button navigates, is `asChild` used correctly?
- Are loading, empty, and error states handled?
- Are page-local skeleton/empty/error/no-workspace UIs kept in the same file near the bottom unless reuse justifies extraction?
- Are new/changed visible UI strings covered in both `src/messages/ko.json` and `src/messages/en.json`?
- Are all static assets inside `src/app` optimized under 200KB?
- Was mobile layout considered?
- If shared UI changed, was Storybook updated?
- Did every visual/interaction point with more than one valid approach get decided by the user instead of picked silently?

## Output Contract

```text
stage: frontend-ui
status: pass|needs_revision|fail
summary: 한두 문장 요약
intent: 왜 이런 UI 구조 결정을 내렸는지 의도(Why) 설명
findings:
- ...
focus_list:
- [집중 리뷰 대상 파일]: 이유
- [스킵 가능 파일]: 이유
failure_categories:
- ...
return_to: planning|backend-api-spec|frontend-ui
next_step: dowin-frontend-quality-check → dowin-commit → dowin-frontend-api-connect
```

Use these categories when relevant: `state_handling_gap`, `missing_test`, `doc_impl_drift`, `undecided_design_point`.

Return rules:

- `pass` — UI 경계·시각 상태·Storybook이 준비됨. `dowin-frontend-api-connect`로 이동.
- `needs_revision` — UI 수정이 필요하지만 이 스킬 안에서 계속
- `fail` — 계약 자체가 문제면 `backend-api-spec`, 범위 문제면 `planning`으로 복귀

## Next Step

`pass`면 `dowin-frontend-quality-check`(+ 렌더/번들 비용이 민감하면 `dowin-frontend-performance-check`, 보호된 화면이면 `dowin-frontend-security-check`)를 이 단계 변경 범위에 대해 실행하고, 통과하면 `dowin-commit`으로 이 단계만 커밋(체인의 세 번째 커밋)한 뒤 `dowin-frontend-api-connect`로 이동해 실제 데이터를 연결한다. 이 시점엔 아직 실데이터 연동이 없으므로 quality-check는 주로 UI 상태 처리와 i18n에 집중된다 — 이게 정상이다.
