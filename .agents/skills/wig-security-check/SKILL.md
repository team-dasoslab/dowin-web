---
name: wig-security-check
description: Use this skill when reviewing WIG changes for security risks before merge, release, or sensitive backend/frontend updates. Trigger it for requests about auth/session safety, authorization, ownership checks, secret handling, input validation, or whether a change introduces a security regression.
---

# Wig Security Check

## Overview

Use this skill when the main task is a focused security review rather than general implementation.

Start with:

1. `docs/dev/common/2026.03.12-security.md`
2. `references/security-rules.md`
3. the relevant domain docs
4. the changed implementation

If the security doc conflicts with current implementation, verify the code and use the active implementation as the baseline.

## WIG Security Facts

- Current auth implementation uses the `wig_sid` session cookie pattern.
- WIG security review should prioritize auth, authorization, ownership filtering, validation coverage, and sensitive data handling.
- Backend review usually matters most, but frontend changes can still expose secrets, leak privileged actions, or bypass expected guards.
- Query-level ownership filtering is preferred over fetching by ID first and checking later.
- Zod validation is the default input-validation path for API work.
- When recommending follow-up commits, follow `docs/planning/2026.04.09-commit-convention.md`.

For detailed rules and checklists, read `references/security-rules.md`.

## Workflow

### 1. Define the security scope

Classify the task:

- auth or session change
- protected API change
- workspace/admin permission change
- data access or ownership change
- frontend change that calls protected APIs
- release or pre-merge security review

### 2. Pull only the relevant checks

Read only the checks that match the scope:

- authentication and session checks
- authorization and role-boundary checks
- ownership and IDOR checks
- input-validation and error-response checks
- secret, cookie, and sensitive-data handling checks

### 3. Review the active code path

Prefer verifying the real route, service, storage, and response path over trusting older docs.

### 4. Report concrete risks

When reporting, prioritize:

- exploitable auth or authorization gaps
- ownership filtering mistakes
- missing validation on user-controlled input
- secret or sensitive-data exposure
- residual risk when review depth was limited

## Security Checklist

- Are protected routes enforcing session checks?
- Are ADMIN-only actions still restricted correctly?
- Are ownership filters applied at query level where needed?
- Are request body, params, and query values validated?
- Are secrets, cookies, passwords, and recovery codes kept out of logs and error payloads?
- Did the review check the real implementation, not only the docs?

## Output Contract

When finishing security review, report with this shape by default:

```text
stage: security
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|backend|frontend|none
next_step: 다음 수정 단계 또는 리스크 수용 여부
```

Use these security-oriented categories when relevant:

- `missing_validation`
- `auth_gap`
- `ownership_gap`
- `secret_exposure_risk`

Return rules:

- `pass`
  - the reviewed path has no blocking security issue for the current scope
- `needs_revision`
  - concrete security fixes are needed in the nearest implementation stage
- `fail`
  - the current result should not proceed; return to `planning` when the design itself is unsafe, otherwise return to `backend` or `frontend` based on where the issue lives

## Next Step

If the changed path passes this review or the remaining risks are accepted explicitly, the work can be treated as complete.
