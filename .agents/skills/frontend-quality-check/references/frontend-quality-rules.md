# Dowin Frontend Quality Rules

## Verification

```bash
pnpm tsc --noEmit
pnpm lint
pnpm eslint <changed-files>
pnpm test:frontend
```

Run `pnpm test:e2e` when a frontend change affects user behavior or a real data flow, including login, routing, form submission, server mutations, or another core user flow. Presentation-only copy, color, and spacing changes do not require E2E. The local suite requires the seed account documented in `README.md`; a required E2E run that is skipped or fails prevents the quality stage from returning `pass`.

Browser-backed Storybook verification is separate via `pnpm test:storybook --run`.

## Checks

- loading, empty, and error states
- optimistic update rollback when relevant
- mobile layout and interaction
- i18n coverage (`src/messages/ko.json` / `en.json`)
- type and lint

## Manual Pre-Deploy Checks

- onboarding flow still works
- core daily logging flow still works
- mobile major screens look correct
- no obvious regression from previous behavior
