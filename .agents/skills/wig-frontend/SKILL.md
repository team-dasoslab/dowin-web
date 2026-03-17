---
name: wig-frontend
description: Use this skill when building or changing WIG frontend pages, domain components, UI composition, form validation, Orval API integration, TanStack Query state updates, Storybook stories, or mobile-responsive dashboard flows. Trigger it for requests about page UI, component refactors, API-to-UI wiring, dashboard interactions, or shared UI work in this repository.
---

# Wig Frontend

## Overview

Use this skill for frontend work in `src/app`, `src/components/ui`, `src/context`, and `src/api/generated`.

Read only the files needed for the task.

Start with:

1. `.agents/workflows/frontend.md`
2. `references/frontend-rules.md`
3. the relevant domain doc
4. the current page/component implementation

If current code and docs differ, verify the implementation and preserve established patterns.

## WIG Frontend Facts

- Prefer `src/components/ui` shared components before creating new ones.
- Shared UI should remain unopinionated; inject styling at usage sites.
- Use `asChild` when a `Button` wraps `Link`.
- React 19 means new `forwardRef` wrappers should not be introduced by default.
- Use Lucide React for icons.
- Use Zod for form validation.
- For server state, use generated Orval hooks and TanStack Query patterns.
- After mutations, invalidate related queries.
- Do not introduce `useSearchParams()` in a page path unless it is wrapped by a `Suspense` boundary. If the value can be resolved on the server, prefer reading the page `searchParams` prop and passing it down instead.
- Treat date display and date-key generation in the UI as KST-based unless the current feature explicitly requires another timezone.
- Keep mobile behavior in scope, especially dashboard and scoreboard flows.

For detailed file paths and doc priorities, read `references/frontend-rules.md`.

## Workflow

### 1. Identify the UI boundary

Decide whether the change belongs in:

- `src/components/ui` for shared primitives
- `src/app/<domain>/_components` for domain UI
- `src/app/<domain>/_hooks` for domain hooks
- `src/context` or shared hooks only if the concern is truly cross-domain

### 2. Confirm data shape before coding

If the UI depends on API data:

1. inspect `src/api-spec/openapi.yaml`
2. inspect generated hooks in `src/api/generated`
3. inspect existing consumers before creating new fetch patterns

When contracts change, regenerate the client.

### 3. Implement with the existing visual language

- preserve the current WIG aesthetic and utility patterns
- keep loading, empty, error, and success states explicit
- use toast feedback for meaningful actions
- keep forms and buttons disabled during pending submissions when needed

### 4. Storybook rule

If a shared UI component is added or materially changed, add or update a story in `src/components/ui/stories`.

### 5. Verify

Run the smallest useful set first:

```bash
yarn tsc --noEmit
yarn lint
```

Then run broader checks when the change is substantial:

```bash
yarn storybook
yarn test
```

## Frontend Checklist

- Is this in the correct layer and directory?
- Did shared UI get reused before creating a new primitive?
- If a button navigates, is `asChild` used correctly?
- Are loading, empty, and error states handled?
- If server state changed, were related queries invalidated?
- If query-string state is needed, did you choose between server `searchParams` props and client `useSearchParams()` intentionally, and add `Suspense` when using the client hook?
- If API contracts changed, was `yarn gen:api` run?
- If shared UI changed, was Storybook updated?
- Was mobile layout considered?

## When To Update Docs

Update docs when frontend conventions or user-facing flows change materially:

- relevant domain doc in `docs/dev/`
- `docs/onboarding.md`
- `.agents/workflows/frontend.md` if the standard itself changed
