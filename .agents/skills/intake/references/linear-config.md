# Dowin Linear Configuration

Source of truth for this project's actual Linear workspace settings — queried directly via the Linear MCP (`list_teams`, `list_issue_labels`, `list_issue_statuses`, `list_projects`) on 2026-08-01. Re-verify with those tools if this file goes stale (new labels/statuses added in Linear won't show up here automatically).

## Workspace

- Team: `Dasoslab` (key `DAS`)
- Project: `Dowin` (id `f3649251-f472-4f63-921e-0d2bc317689e`, https://linear.app/dasoslab/project/dowin-d57ce11e1f82)

New Dowin issues should be created under team `Dasoslab`, project `Dowin`.

## Issue Statuses

`Backlog` (backlog) → `Todo` (unstarted) → `In Progress` (started) → `Done` (completed), plus `Canceled` and `Duplicate`. New issues default to `Backlog`/`Todo`; don't set status manually unless the request implies work has already started.

## Priority

Standard Linear scale:

| value | name |
|---|---|
| 0 | No priority |
| 1 | Urgent |
| 2 | High |
| 3 | Medium |
| 4 | Low |

Observed usage across ~28 Dowin issues is spread across all five values with no single default — `Urgent` is used fairly often for anything the team wants acted on soon, not reserved for production incidents. There is no reliable rule to infer priority from request text alone.

**Ask the user which priority (0–4) to set. Do not pick one on their behalf, even as a "default."**

## Labels

Two label groups exist. Issues in this project typically carry one label from each group (some legitimately carry none — don't force a fit).

**Issue Type** (what kind of change — mirrors the repo's branch/commit `<type>` convention):

- `feature`, `fix`, `chore`, `refactor`, `style`, `docs`, `ci`, `perf`

**Area** (what part of the product):

- `dev` — backend/frontend implementation work
- `planning` — planning-only docs, scoping, roadmap
- `marketing` — user-facing copy, announcements, product update notes
- `ops` — runbooks, incident response, release/rollback work

The Issue Type label usually lines up with the branch `<type>` chosen in SKILL.md step 5, and the Area label usually lines up with which downstream chain the work enters (`dev` for backend/frontend chains, `planning` for planning-only, `marketing`/`ops` as applicable) — but treat those as a suggestion to confirm, not an auto-applied mapping.

**Show the user the two label lists above and ask them to pick (or confirm your suggested pick) before creating the issue. Don't attach labels the user didn't agree to.**

## Due Dates

`dueDate` is set on roughly 1 in 28 issues in this project — it is not a default field here.

**Ask the user whether this issue needs a due date, and if so, what it is. Leave it unset only after asking, not by silent default.**

## Creating the Issue — Summary

Before calling `create_issue`/`save_issue`, confirm these three fields with the user explicitly (one question, e.g. via `AskUserQuestion`, covering all three is fine): priority (0–4), Issue Type + Area labels, and due date (or none). Do not let the LLM choose any of them unilaterally — this reference documents what values *exist*, not what to pick.
