---
name: wig-quality-check
description: Use this skill when verifying WIG code quality before completion, review, or deploy. Trigger it for requests about tests, quality gates, regression checks, backend or frontend verification, security checks, mobile checks, release readiness, or validating whether a WIG change is safe to merge.
---

# Wig Quality Check

## Overview

Use this skill when the main task is verification rather than implementation.

Start with:

1. `docs/dev/common/2026.03.12-quality-strategy.md`
2. `references/quality-rules.md`
3. the relevant domain docs
4. the changed implementation

If the quality doc conflicts with current implementation, verify the code and use the active implementation as the baseline.

## WIG Quality Facts

- WIG quality work should focus on business-rule correctness, auth and ownership safety, regression risk, and release readiness.
- Use the smallest useful verification set first, then broaden.
- Backend verification should include business rules, auth, ownership, and error cases.
- Frontend verification should include loading, empty, error, responsive, and rollback behavior where relevant.
- Current auth implementation uses the `wig_sid` session cookie pattern.
- Treat repository-wide `tsc` and `lint` results as potentially noisy until the known baseline issues are fixed.

For detailed gates, command sets, and domain-specific checks, read `references/quality-rules.md`.

## Workflow

### 1. Define the verification scope

Classify the task:

- backend change
- frontend change
- API contract change
- DB schema change
- release or deploy readiness

### 2. Pull the relevant checks

Read only the checks that match the scope:

- business-rule tests
- integration checks
- security checks
- mobile or UI checks
- release gates

### 3. Run focused verification first

Prefer focused checks before full-suite runs when possible.

### 4. Expand to quality gates

If the task is broad, pre-merge, or deploy-related, expand to the full relevant quality gates.

### 5. Report findings clearly

When reviewing or validating, report:

- failing checks
- missing tests
- likely regressions
- residual risks if some checks could not run

## Quality Checklist

- Were the most relevant tests run first?
- Were domain business rules checked?
- Were auth, ownership, and validation risks checked where relevant?
- Were type and lint checks run when appropriate?
- Were responsive or UI state checks included for frontend work?
- If this is release-facing, were manual checks considered?
