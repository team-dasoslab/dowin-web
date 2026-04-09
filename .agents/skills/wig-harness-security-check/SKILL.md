---
name: wig-harness-security-check
description: Use this skill when reviewing WIG's agent harness and AI tooling configuration for security risks. Trigger it for requests about AGENTS.md, codex.md, local skill prompts, approval boundaries, secret handling in instructions, risky shell guidance, or whether the repository's AI operating layer is safe to use.
---

# Wig Harness Security Check

## Overview

Use this skill when the main task is reviewing the repository's AI harness rather than product code.

Start with:

1. `references/harness-security-rules.md`
2. `AGENTS.md`
3. `codex.md`
4. the relevant files under `.agents/skills/**`
5. any repo-local config that changes agent permissions or execution behavior

If docs and active files disagree, verify the active files and use that as the security baseline.

## WIG Harness Security Facts

- This skill is for agent operating-layer security, not API or application-code security.
- Prioritize secret exposure, permission overreach, risky automation, unsafe shell guidance, and misleading prompts that could normalize destructive actions.
- Review the actual trigger files and prompt text rather than assuming behavior from summaries.
- Prefer narrow approvals, explicit justification, and least-privilege defaults.
- If the concern is about auth, authorization, ownership, or Zod validation in app code, use `wig-security-check` instead.

For detailed checks and reporting rules, read `references/harness-security-rules.md`.

## Workflow

### 1. Define the harness scope

Classify the task:

- AGENTS or Codex operating instructions
- local skill prompt review
- command or workflow safety review
- secret handling in docs or prompts
- repo-level permission boundary review

### 2. Pull only the relevant checks

Read only the checks that match the scope:

- secret and token exposure
- destructive-command guidance
- escalation and approval boundaries
- network and external-tooling guidance
- prompt injection or unsafe instruction patterns

### 3. Review the active execution path

Prefer the files an agent will actually load first:

- `AGENTS.md`
- `codex.md`
- triggered skill `SKILL.md`
- referenced rules under `references/`

### 4. Report concrete harness risks

When reporting, prioritize:

- secrets or credentials committed into prompt/config files
- instructions that normalize unsafe destructive actions
- approval flows that are too broad for the stated task
- skills that encourage unverified network or shell use
- residual risk where the harness surface could not be fully verified

## Harness Security Checklist

- Are secrets or private endpoints absent from prompt/config files?
- Do instructions avoid broad auto-approval or overly permissive execution guidance?
- Are destructive commands gated clearly and narrowly?
- Do skills distinguish app-code security review from harness/config security review?
- Do referenced workflows prefer least privilege and explicit verification?
- Did the review inspect the real files that agents load?

## Next Step

If the harness passes this review or remaining risks are accepted explicitly, the work can be treated as complete.
