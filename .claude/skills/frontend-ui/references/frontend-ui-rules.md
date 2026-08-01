# Dowin Frontend UI Rules

## Read Order

1. `docs/onboarding.md`
2. the relevant domain doc in `docs/dev/**`
3. current implementation in `src/app`, `src/components/ui`, `src/context`

## Repository Conventions

- Reuse shared UI from `src/components/ui` before adding new primitives.
- Keep shared UI unopinionated and style it at call sites.
- Use `asChild` when `Button` wraps `Link`.
- Do not introduce new `forwardRef` wrappers by default.
- Use Lucide icons.
- Keep page-local skeleton, empty, error, and similar status UIs in the same page/domain file by default, declared near the bottom unless reuse across multiple files justifies extraction.
- Use `next-intl` for user-facing UI copy — add/update keys in both `src/messages/ko.json` and `src/messages/en.json`.
- Treat mobile optimization as a required part of frontend work: layout, readability, touch targets, scrolling flow, primary actions on small screens.

## Verification Defaults

```bash
yarn test --run <changed-or-affected-test-files>
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

If substantial:

```bash
yarn storybook
yarn test:storybook --run
```
