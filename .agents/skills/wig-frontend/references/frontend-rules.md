# WIG Frontend Rules

## Read Order

1. `docs/onboarding.md`
2. `.agents/workflows/frontend.md`
3. the relevant domain doc in `docs/dev/**`
4. current implementation in `src/app`, `src/components/ui`, `src/context`
5. `src/api-spec/openapi.yaml` and `src/api/generated/**` when API data is involved

## Repository Conventions

- Reuse shared UI from `src/components/ui` before adding new primitives.
- Keep shared UI unopinionated and style it at call sites.
- Use `asChild` when `Button` wraps `Link`.
- Do not introduce new `forwardRef` wrappers by default.
- Use Lucide icons.
- Use Zod for forms.
- Use generated Orval hooks and TanStack Query for server state.
- Invalidate related queries after mutations.
- Consider mobile layout, empty states, loading states, and failure rollback.

## Verification Defaults

```bash
yarn tsc --noEmit
yarn lint
```

If the change is substantial:

```bash
yarn storybook
yarn test
```

If API contracts changed:

```bash
yarn gen:api
```
