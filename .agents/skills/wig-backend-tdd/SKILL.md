---
name: wig-backend-tdd
description: Use this skill when adding or changing WIG backend APIs, route handlers, services, storage code, validation, auth, or database-backed business rules. Trigger it for requests about API implementation, backend refactors, auth/session logic, storage changes, TDD-first backend work, or backend bug fixes in this repository.
---

# Wig Backend Tdd

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
- Route handlers should use `withErrorHandler` from `src/lib/with-error-handler.ts`.
- Success and error responses should use `apiSuccess` and `apiError`.
- Input validation should use Zod.
- DB access should stay in `src/domain/*/storage`.
- Business logic should stay in `src/domain/*/services`.
- Auth-required routes should use `getSession`.
- SQL must use Prepared Statement patterns through Drizzle or binding.

For detailed file paths and doc priorities, read `references/backend-rules.md`.

## Workflow

### 1. Confirm the target domain

Open the matching domain doc and extract business rules, error cases, auth rules, and validation rules. Also inspect existing code in the same domain before changing structure.

### 2. Start with tests when the change is backend behavior

Follow Red -> Green -> Refactor when feasible.

- add or update focused tests near the implementation
- prioritize business-rule coverage over incidental coverage
- add characterization tests before changing existing behavior when practical

### 3. Implement in the existing layers

Preferred flow:

1. route handler
2. validation
3. service
4. storage
5. shared lib helpers only if needed

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
```

If the task changes API contracts, also update:

```bash
yarn gen:api
```

## Backend Checklist

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
