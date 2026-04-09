# WIG Performance Rules

## Read Order

1. the changed implementation files
2. the relevant domain doc in `docs/dev/**`
3. `src/db/schema.ts` when new access patterns may need schema support

If docs and code disagree, trust the current implementation and review the active code path.

## What This Skill Does

This is a static code review for performance risk. It does not claim to prove real runtime cost, but it should catch likely regressions before they ship.

Use it to find patterns such as:

- repeated scans over the same dataset
- nested loops that multiply cost with data size
- N+1 queries or repeated lookups in loops
- over-fetching rows or columns
- query shapes that likely need indexes
- expensive transformations repeated instead of reused

It should not depend on a separately maintained performance planning document to function.

## Backend Review Heuristics

### Aggregation Code

Flag code when it:

- runs `filter`, `reduce`, or `find` repeatedly inside outer loops
- recalculates week or month grouping many times for the same logs
- builds derived maps but still keeps rescanning raw arrays
- combines member, measure, and log loops without a clear bound

Typical WIG hot paths:

- dashboard services
- daily-log summary services
- workspace-wide scoreboard summaries

### Storage And Query Shape

Flag code when it:

- loads entire related objects when only a few fields are needed
- widens date ranges beyond the response scope
- performs one query per item when batched lookup is possible
- adds a new lookup path without a matching index or uniqueness guarantee

### Schema-Driven Risk

When a feature changes persisted data, review whether the schema supports the access path:

- foreign keys match ownership boundaries
- indexes support the new read path
- uniqueness rules prevent duplicate work or ambiguous reads
- cascade behavior avoids orphan cleanup work in application code

### Frontend Touchpoints

Flag code when it:

- triggers repeated refetches from unstable query keys or repeated mount logic
- requests large payloads only to slice most of it on the client
- duplicates expensive derived calculations on every render without need

## Reporting Format

When reviewing, report:

- confirmed likely bottlenecks
- the code shape causing the concern
- expected scale trigger, if inferable
- recommended refactor or schema/query change
- what could not be confirmed without runtime measurement
