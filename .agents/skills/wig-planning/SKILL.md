---
name: wig-planning
description: Use this skill when planning new WIG features, refining product flows, updating onboarding or planning docs, creating a new planning document, or turning rough ideas into repository-aligned action items. Trigger it for requests about feature planning, documentation updates, scoping MVP versus Post-MVP, or creating planning artifacts in this repository.
---

# Wig Planning

## Overview

Use this skill for planning and documentation work in `docs/` and for feature-definition work that should precede implementation.

Read only what is needed.

Start with:

1. `.agents/workflows/planning.md`
2. `references/planning-rules.md`
3. the relevant existing planning docs
4. the relevant domain docs

Read implementation only when feasibility or current status matters.

## Planning Rules

- Do not create fragmented planning docs unless there is a clear reason.
- Prefer extending the primary planning document for the feature or milestone.
- Keep YAML frontmatter at the top of planning docs.
- Planning should produce concrete action items, not only abstract ideas.
- Respect the 4DX framing already used across WIG documents.
- Keep `docs/onboarding.md` current enough that another agent can start work quickly.

For detailed file paths and planning priorities, read `references/planning-rules.md`.

## Workflow

### 1. Frame the planning target

Define:

- what problem is being solved
- why it matters now
- whether this is MVP or Post-MVP
- which domains are affected

### 2. Reuse the existing planning structure

Use the repository's existing planning sections where applicable:

- background and context
- priority and rationale
- expected impact
- action items
- cost and estimation
- success and failure criteria

### 3. Ground plans in the current product

Cross-check against:

- existing domain docs
- current implementation state
- shared constraints such as auth, workspace, scoreboard, and dashboard rules

### 4. Produce implementation-ready output

A good planning update should leave behind:

- clear scope
- affected files or domains
- concrete next actions
- open questions only where truly unresolved

## Planning Checklist

- Did the document extend an existing planning thread when possible?
- Is the frontmatter present and valid?
- Does the plan distinguish MVP from Post-MVP?
- Are action items concrete enough for engineering work?
- Does the plan align with existing domain rules and 4DX terminology?
- Should `docs/onboarding.md` also be updated?

## When To Escalate To Engineering Docs

If planning decisions harden into implementation constraints, update or create the matching docs in:

- `docs/dev/common/`
- `docs/dev/<domain>/`
- `docs/onboarding.md`
