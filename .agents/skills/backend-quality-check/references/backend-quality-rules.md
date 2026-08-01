# Dowin Backend Quality Rules

## Verification

```bash
yarn test --run <changed-test-file>
yarn test:backend
yarn tsc --noEmit
yarn lint
yarn eslint <changed-files>
```

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

## Security-Adjacent Checks (still relevant even when dowin-backend-security-check doesn't run)

- ownership filtering for protected resources
- admin/member authorization boundaries
- prepared statements or safe bindings
