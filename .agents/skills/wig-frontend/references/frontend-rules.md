# WIG Frontend Rules

## Read Order

1. `docs/onboarding.md`
2. the relevant domain doc in `docs/dev/**`
3. current implementation in `src/app`, `src/components/ui`, `src/context`
4. `src/api-spec/openapi.yaml` and `src/api/generated/**` when API data is involved

## Repository Conventions

- Reuse shared UI from `src/components/ui` before adding new primitives.
- Keep shared UI unopinionated and style it at call sites.
- Use `asChild` when `Button` wraps `Link`.
- Do not introduce new `forwardRef` wrappers by default.
- Use Lucide icons.
- When a page owns both local client state and TanStack Query logic, split those concerns into domain hooks instead of keeping them together in the page component.
- Put form state, input handlers, and client-side validation in a dedicated `use...Form` hook.
- Put mutations, cache invalidation, toast handling, and navigation side effects in a dedicated domain hook such as `use...Mutation`.
- Keep page-local skeleton, empty, error, and similar status UIs in the same page/domain file by default.
- Declare those page-local status helpers near the bottom of the file unless reuse across multiple files justifies extraction.
- Use Zod for forms.
- Use generated Orval hooks and TanStack Query for server state.
- Invalidate related queries after mutations.
- Treat mobile optimization as a required part of frontend work.
- Check layout, readability, touch targets, scrolling flow, and primary actions on small screens.
- Consider mobile layout, empty states, loading states, and failure rollback.
- Keep page components focused on composition and rendering when form and server-state orchestration becomes non-trivial.

## Verification Defaults

```bash
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

If the change is substantial:

```bash
yarn storybook
yarn test
yarn test:storybook --run
```

If API contracts changed:

```bash
yarn gen:api
```
