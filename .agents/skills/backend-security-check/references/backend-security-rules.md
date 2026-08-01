# Dowin Backend Security Rules

## Auth And Session

Check: session lookup path and cookie usage; unauthenticated behavior on protected routes; session expiry or invalid-session handling; cookie flags and session lifetime assumptions.

Focus files: `src/lib/server/auth.ts`, `src/app/api/auth/*`, relevant auth services and storage modules.

## Authorization

Check: ADMIN-only routes stay ADMIN-only; member routes do not accidentally allow cross-workspace actions; privileged mutations do not rely on client trust.

Focus files: `src/lib/server/authz.ts`, admin or workspace route handlers, affected services.

## Ownership And IDOR

Check: resource access queries include user/workspace constraints; code does not fetch by raw ID first and authorize later when query-level filtering is practical; update and delete paths preserve the same ownership constraints as read paths.

Typical targets: scoreboards, lead measures, daily logs, profile and workspace member actions.

## Input Validation

Check: request body validation via Zod or an equivalent established path; route params and query values are normalized and validated where user-controlled; error responses do not leak stack traces or internal details.

## Sensitive Data Handling

Check: passwords, recovery codes, session IDs, cookies, and secrets are not logged; sensitive values are not echoed back in API error payloads; secret material is sourced from env or secret stores, not hardcoded.

## Pre-Merge Pass

Confirm at least: auth/session checks on changed protected routes, authorization boundaries for changed mutations, ownership filtering for changed data reads/writes, Zod validation coverage for changed user input surfaces, no new sensitive-data exposure.
