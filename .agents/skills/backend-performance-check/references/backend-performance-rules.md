# Dowin Backend Performance Rules

## Aggregation Code

Flag code when it:

- runs `filter`, `reduce`, or `find` repeatedly inside outer loops
- recalculates week or month grouping many times for the same logs
- builds derived maps but still keeps rescanning raw arrays
- combines member, measure, and log loops without a clear bound

Typical Dowin hot paths: dashboard services, daily-log summary services, workspace-wide scoreboard summaries.

## Storage And Query Shape

Flag code when it:

- loads entire related objects when only a few fields are needed
- widens date ranges beyond the response scope
- performs one query per item when batched lookup is possible
- adds a new lookup path without a matching index or uniqueness guarantee

## Schema-Driven Risk

When a feature changes persisted data, review whether the schema (fixed in `dowin-backend-api-spec`) supports the access path: foreign keys match ownership boundaries, indexes support the new read path, uniqueness rules prevent duplicate work, cascade behavior avoids orphan cleanup work in application code.
