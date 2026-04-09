# WIG Security Rules

## Read Order

1. `docs/dev/common/2026.03.12-security.md`
2. the relevant domain doc in `docs/dev/**`
3. `docs/dev/common/2026.03.12-api-conventions.md` when response behavior matters
4. changed implementation files

If docs and code disagree, verify the current implementation and use that as the security baseline.

## Review Modes

### Auth And Session

Check:

- session lookup path and cookie usage
- unauthenticated behavior on protected routes
- session expiry or invalid-session handling
- cookie flags and session lifetime assumptions

Focus files:

- `src/lib/server/auth.ts`
- `src/app/api/auth/*`
- relevant auth services and storage modules

### Authorization

Check:

- ADMIN-only routes stay ADMIN-only
- member routes do not accidentally allow cross-workspace actions
- privileged mutations do not rely on client trust

Focus files:

- `src/lib/server/authz.ts`
- admin or workspace route handlers
- affected services

### Ownership And IDOR

Check:

- resource access queries include user/workspace constraints
- code does not fetch by raw ID first and authorize later when query-level filtering is practical
- update and delete paths preserve the same ownership constraints as read paths

Typical targets:

- scoreboards
- lead measures
- daily logs
- profile and workspace member actions

### Input Validation

Check:

- request body validation via Zod or an equivalent established path
- route params and query values are normalized and validated where user-controlled
- error responses do not leak stack traces or internal details

### Sensitive Data Handling

Check:

- passwords, recovery codes, session IDs, cookies, and secrets are not logged
- sensitive values are not echoed back in API error payloads
- secret material is sourced from env or secret stores, not hardcoded

### Frontend Security Touchpoints

Check:

- protected actions are not exposed to the wrong role in visible UI flows
- privileged mutations still depend on server-side enforcement
- client code does not embed private keys or server secrets

## Pre-Merge Security Pass

For a normal PR security review, confirm at least:

- auth/session checks on changed protected routes
- authorization boundaries for changed mutations
- ownership filtering for changed data reads or writes
- Zod validation coverage for changed user input surfaces
- no new sensitive-data exposure in logs, payloads, env usage, or client bundles

## Reporting Format

When reviewing, report:

- confirmed security findings
- high-risk open questions
- areas not fully verified
- recommended follow-up tests or hardening tasks
