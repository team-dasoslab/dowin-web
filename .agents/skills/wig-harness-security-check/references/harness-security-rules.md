# WIG Harness Security Rules

## Read Order

1. `AGENTS.md`
2. `codex.md`
3. the relevant `SKILL.md` under `.agents/skills/**`
4. any referenced `references/*.md`
5. repo-local config that affects agent behavior

If docs and live config disagree, use the live files as the security baseline.

## Review Modes

### Secret Exposure

Check:

- API keys, tokens, cookies, private URLs, or internal identifiers are not hardcoded in prompt files
- examples use env vars or placeholders instead of real secrets
- prompts do not encourage printing or echoing secrets into logs

Typical targets:

- `AGENTS.md`
- `codex.md`
- `.agents/skills/**/SKILL.md`

### Permission Boundaries

Check:

- instructions prefer least privilege and scoped approvals
- guidance does not normalize full-access or blanket approval without a clear need
- “use network”, “run anything”, or “auto-approve” guidance is justified and narrowly framed

### Destructive Command Safety

Check:

- destructive commands are called out explicitly as exceptional
- prompts do not recommend `rm`, `git reset --hard`, force pushes, or similar operations casually
- instructions distinguish safe read-only inspection from write or delete actions

### Risky Automation Paths

Check:

- skills do not silently collapse review into execution when the task is high risk
- shell and external-tool instructions include verification points where appropriate
- prompts do not claim checks were run when they were not

### Prompt Clarity And Scope

Check:

- harness-security review is not mislabeled as product-code security review
- security-related skills differentiate config review from app review
- trigger descriptions are specific enough to avoid wrong-skill invocation

### External Integrations

Check:

- references to MCP, plugins, hooks, or external scanners are identified as optional unless truly required
- docs do not imply unsupported tooling exists locally when it does not
- external tools are described with their real scope and limitations

## Minimal Pass For This Repository

For a normal harness security review, confirm at least:

- no hardcoded secrets in `AGENTS.md`, `codex.md`, or local skills
- no broad unsafe execution guidance added recently
- local skills separate harness review from app security review
- documentation does not overstate installed tooling or available automation

## Reporting Format

When reviewing, report:

- confirmed harness-security findings
- misleading or risky instruction patterns
- missing guardrails
- areas not fully verified
- recommended hardening changes
