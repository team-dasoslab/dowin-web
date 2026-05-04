---
name: grill-with-docs
description: Grilling session that challenges your plan against the existing domain model, sharpens terminology, and updates documentation inline as decisions crystallise. Use when user wants to stress-test a plan against their project's language and documented decisions.
---

<what-to-do>

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.

Ask the questions one at a time, waiting for feedback on each question before continuing.

If a question can be answered by exploring the codebase or the project's explicit rules in `AGENTS.md`, explore those instead.

</what-to-do>

<supporting-info>

## Domain awareness

During codebase exploration, always cross-reference with the rules in `AGENTS.md` and any documents under `docs/`.

### File structure

This repository follows a strict documentation layout:

```
/
├── AGENTS.md                         ← Project rules and principles
├── README.md                         ← Base onboarding/setup info
├── docs/
│   ├── onboarding.md                 ← Maintenance and onboarding docs
│   └── yyyy.mm.dd-name.md            ← Specific architecture/planning decisions
└── src/                              ← Source code for Expo and native app
```

Create files lazily — only when you have something to write. When adding or modifying docs under `docs/` (except `onboarding.md`), ensure the filename follows the `yyyy.mm.dd-name.md` convention and includes the required YAML frontmatter:

```yaml
---
title: 
createdAt: 2026-04-14 00:20:00
updatedAt: 
---
```

## During the session

### Challenge against core project rules
When the user proposes an architecture or implementation that conflicts with rules in `AGENTS.md`, call it out immediately. 
* "How does this change align with the core rules and current development patterns described in AGENTS.md?"

### Sharpen fuzzy language
When the user uses vague or overloaded terms, propose a precise canonical term. Ensure all new components, modules, or features are clearly named and well-scoped.
* "You're saying 'user profile' — do you mean the authentication profile, local storage state, or native settings?"

### Discuss concrete scenarios
When domain relationships or app features are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about boundaries.
* "How does the app handle background transitions or offline scenarios for this feature?"

### Cross-reference with code
When the user states how something works, check whether the current codebase agrees. If you find a contradiction, surface it:
* "The existing code in `src/**` uses pattern X, but you just suggested pattern Y — what is the reasoning for this alternative?"

### Update onboarding.md and docs inline
As decisions crystallise during the grilling session, immediately update or create the relevant design documents under `docs/` to keep our onboarding maintenance up to date.

</supporting-info>
