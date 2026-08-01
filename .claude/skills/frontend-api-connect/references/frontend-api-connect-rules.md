# Dowin Frontend API Connect Rules

## Read Order

1. `src/api-spec/openapi.yaml` and `src/api/generated/**`
2. the relevant domain doc in `docs/dev/**`
3. current page/component implementation from `dowin-frontend-ui`

## Repository Conventions

- Use generated Orval hooks and TanStack Query for server state.
- Invalidate related queries after mutations.
- Put mutations, cache invalidation, toast handling, and navigation side effects in a dedicated domain hook such as `use...Mutation`.
- Put form state, input handlers, and client-side validation in a dedicated `use...Form` hook.
- Use Zod for forms.
- Do not introduce `useSearchParams()` without a `Suspense` boundary.

## Verification Defaults

```bash
yarn test --run <changed-or-affected-test-files>
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

If API contracts changed:

```bash
yarn gen:api
```
