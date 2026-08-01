# Dowin Frontend Quality Rules

## Verification

```bash
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
yarn test:frontend
```

Browser-backed Storybook verification is separate via `yarn test:storybook --run`.

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
