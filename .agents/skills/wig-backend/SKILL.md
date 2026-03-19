---
name: wig-backend
description: Use this skill when adding or changing WIG backend APIs, route handlers, services, storage code, validation, auth, or database-backed business rules. Trigger it for requests about API implementation, backend refactors, auth/session logic, storage changes, TDD-first backend work, or backend bug fixes in this repository.
---

# Wig Backend

## Overview

Use this skill for backend work in `src/app/api`, `src/domain`, `src/lib`, and related DB-backed logic.

Read only the files needed for the current task.

Start with:

1. `.agents/workflows/backend-tdd.md`
2. `references/backend-rules.md`
3. the matching domain doc
4. the current implementation

If docs conflict with code, verify the implementation and trust the current code path.

## WIG Backend Facts

- Auth currently uses the `wig_sid` session cookie in active code paths.
- Route handlers should use `withErrorHandler` from `src/lib/server/with-error-handler.ts`.
- Success and error responses should use `apiSuccess` and `apiError`.
- Input validation should use Zod.
- DB access should stay in `src/domain/*/storage`.
- Business logic should stay in `src/domain/*/services`.
- Auth-required routes should use `getSession`.
- SQL must use Prepared Statement patterns through Drizzle or binding.
- Keep backend date storage and API-facing canonical date values in UTC unless a domain doc explicitly says otherwise.

For detailed file paths and doc priorities, read `references/backend-rules.md`.

## Workflow

### 1. Confirm the target domain

Open the matching domain doc and extract business rules, error cases, auth rules, and validation rules. Also inspect existing code in the same domain before changing structure.

If the task adds or changes an API, update `src/api-spec/openapi.yaml` first so the contract is explicit before implementation.

### 2. Start with tests when the change is backend behavior

Follow Red -> Green -> Refactor when feasible.

- add or update focused tests near the implementation
- default to `validation`, `service`, and `storage` tests for backend behavior
- prioritize business-rule coverage over incidental coverage
- add characterization tests before changing existing behavior when practical
- do not introduce `any` in tests; prefer typed mocks or narrow interfaces
- add route tests only when HTTP-layer behavior is part of the change
  - request parsing or response branching that is not trivial
  - cookie/header handling
  - file upload, streaming, redirects, or route-only integration behavior

### 3. Implement in the existing layers

Preferred flow:

1. OpenAPI contract
2. validation
3. service
4. storage
5. route handler
6. shared lib helpers only if needed

### 4. Keep repository conventions

- preserve Korean error messages and existing error codes
- match the documented response shapes
- use session-cookie auth checks consistently
- keep ownership checks in query conditions where possible

### 5. Run verification

Use the smallest useful verification set first, then broaden:

```bash
yarn test --run <changed-test-file>
yarn test
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

If the task changes API contracts, also update:

```bash
yarn gen:api
```

If browser-based Storybook verification matters, run separately:

```bash
yarn test:storybook --run
```

## Backend Checklist

- If this is a new or changed API, was `src/api-spec/openapi.yaml` updated first?
- Does the change match the domain business rules?
- Is Zod validation present where request data enters?
- Are auth and ownership checks correct?
- Are `apiSuccess` and `apiError` used consistently?
- Is storage logic isolated from route code?
- Are prepared statements or Drizzle-safe bindings used?
- Did tests, types, and lint run for the change?

## When To Update Docs

Update the relevant docs when backend behavior or contracts changed materially:

- `src/api-spec/openapi.yaml`
- matching domain doc in `docs/dev/`
- `docs/onboarding.md` for workflow or architecture changes
