---
name: dowin-operations
description: Use this skill when handling Dowin production operations work such as incident readiness, runbook creation, restore or rollback planning, outage response, incident communication, release smoke checks, or operational documentation for Cloudflare Workers and D1. Trigger it for requests about 운영 문서, 장애 대응, 복구 절차, 배포 롤백, DB restore, Cloudflare 장애 대응, release readiness runbooks, or 운영 체크리스트.
---

# Dowin Operations

## Overview

Use this skill for Dowin operational readiness and incident-response documentation or execution guidance.

Start with:

1. `docs/dev/operations/README.md`
2. `docs/planning/2026.04.19-production-incident-readiness-plan.md`
3. the specific runbook in `docs/dev/operations/`
4. `wrangler.jsonc` and related implementation only when the exact runtime behavior matters

Read implementation only when the request depends on the current Cloudflare, D1, or deployment setup.

## Dowin Operations Facts

- Dowin runs on `Cloudflare Workers + D1 + OpenNext`.
- Code rollback and DB restore are separate decisions.
- Cloudflare Worker rollback does not revert D1 schema or data state.
- Operational docs should be short, executable, and easy to scan during incidents.
- Prefer putting execution runbooks in `docs/dev/operations/`.
- When the work changes Dowin's operating model or entry points, update `docs/onboarding.md` and relevant indexes.

## Workflow

### 1. Classify the operations task

Decide whether the task is mainly:

- incident readiness planning
- DB restore guidance
- deployment rollback guidance
- incident communication
- release smoke checks
- operational review or gap analysis

### 2. Load only the relevant runbook

Prefer the narrowest document that fits:

- `README.md` in `docs/dev/operations/` for navigation
- DB restore runbook for data-loss or corruption scenarios
- deployment rollback runbook for bad deploy scenarios
- incident communication template for internal or user-facing messaging

### 3. Ground the answer in current Dowin infra

Cross-check against:

- `wrangler.jsonc`
- current deployment scripts in `package.json`
- current D1 migration flow
- current observability or logging setup when relevant

### 4. Produce execution-ready output

A good operations result should leave behind:

- a clear trigger condition
- a step order
- decision boundaries
- a minimal validation checklist
- explicit follow-up actions if the runbook is incomplete

## Operations Checklist

- Is the document or answer executable during an incident?
- Does it clearly separate rollback vs restore?
- Does it reflect Dowin's current Cloudflare Workers + D1 setup?
- Is user or internal communication included when relevant?
- Should `docs/onboarding.md`, `docs/dev/README.md`, or `docs/dev/operations/README.md` also be updated?

## Output Contract

When finishing operations work, report with this shape by default:

```text
stage: operations
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|operations|none
next_step: 다음 운영 작업 또는 후속 문서
```

Use these operations-oriented categories when relevant:

- `runbook_gap`
- `rollback_restore_confusion`
- `incident_comm_gap`
- `doc_impl_drift`
- `release_readiness_gap`

Return rules:

- `pass`
  - the runbook or operational guidance is usable as written
- `needs_revision`
  - direction is correct, but important steps, checks, or boundaries are missing
- `fail`
  - the current output is unsafe to rely on during operations

## Next Step

After operations guidance is in place, move to `dowin-quality-check` if you need release validation or to `dowin-planning` if broader operational planning is still unresolved.
