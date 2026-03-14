# WIG Quality Rules

## Read Order

1. `docs/dev/common/2026.03.12-quality-strategy.md`
2. the relevant domain doc in `docs/dev/**`
3. `docs/dev/common/2026.03.12-security.md` when auth or ownership matters
4. changed implementation files

If docs and code disagree, verify the current implementation and use that as the quality baseline.

## Verification Modes

### Backend

Check:

- business-rule tests
- integration behavior
- auth and ownership checks
- error response behavior
- type and lint

Common commands:

```bash
yarn test --run <changed-test-file>
yarn test
yarn tsc --noEmit
yarn lint
```

### Frontend

Check:

- loading, empty, and error states
- optimistic update rollback when relevant
- mobile layout and interaction
- type and lint

Common commands:

```bash
yarn tsc --noEmit
yarn lint
yarn test
```

Manual checks when relevant:

- mobile layout
- table interaction
- toast and pending states

### API Contract Changes

Check:

- `src/api-spec/openapi.yaml`
- generated clients
- consumer type safety

Command:

```bash
yarn gen:api
```

### Release Readiness

Apply the broader gates:

- unit tests pass
- integration tests pass
- E2E coverage or equivalent critical scenario coverage
- `yarn tsc --noEmit`
- `yarn lint`
- key manual flows checked

## Domain-Specific Checks

### Auth

- login success and failure behavior
- password change validation
- session expiry or unauthenticated behavior
- session-cookie behavior and session lookup consistency

### Workspace

- duplicate membership prevention
- admin-only actions
- member listing behavior

### Scoreboard

- single active scoreboard constraint
- archive transition rules
- archived resource immutability

### Lead Measure

- archived measure restrictions
- delete behavior and cascade implications

### Daily Log

- future date rejection
- upsert behavior
- archived measure logging rejection

### Dashboard

- weekly aggregation correctness
- win/loss logic
- empty-state handling

### Profile

- nickname validation
- delete/cascade rules
- unique-admin edge case

### Notification

- subscribe/unsubscribe behavior
- expired subscription cleanup
- skip sending when already completed

## Security Checks

- ownership filtering for protected resources
- admin/member authorization boundaries
- prepared statements or safe bindings
- secret handling and cookie/session behavior when relevant

## Manual Pre-Deploy Checks

- onboarding flow still works
- core daily logging flow still works
- mobile major screens look correct
- no obvious regression from previous behavior
