---
name: wig-product-updates
description: Use this skill when adding, editing, curating, or reviewing WIG product update entries for the in-app "새 기능 모아보기" hub or dashboard update card. Trigger it for requests about new feature announcement copy, product update metadata, update ordering, 14-day NEW rules, dashboard promo card content, or maintaining the product updates TS template.
---

# Wig Product Updates

## Overview

Use this skill for WIG's product update content system.

Read only what is needed.

Start with:

1. `src/content/product-updates.ts`
2. `src/lib/product-updates.ts`
3. `src/app/(protected)/updates/page.tsx`
4. `src/app/(protected)/dashboard/my/page.tsx` when the dashboard card is affected
5. `docs/planning/2026.03.18-feature-announcement-hub.md` when rules or scope change

## Core Rules

- Treat `src/content/product-updates.ts` as the single source of truth.
- Keep entries newest first.
- Keep `publishedAt` in `YYYY.MM.DD`.
- Keep `ctaLabel` as `바로 써보기` unless the user explicitly asks to change the product rule.
- Use `isMajor: true` only for updates that should appear in the dashboard promo card.
- Preserve the LLM-friendly object template and comment block so future agents can add entries consistently.
- Do not add per-user read state in this skill.
- The `NEW` badge logic is fixed by helper code: published within 14 days.
- Dashboard dismiss behavior is local only and keyed by update `id`; do not convert it into read tracking unless requested.

## Workflow

### 1. Decide the scope

Determine whether the request is:

- content only
- content + update hub UI
- content + dashboard promo card behavior
- planning/doc refresh

### 2. Update the content source first

When adding or editing an update:

- edit `src/content/product-updates.ts` first
- keep fields complete and consistent
- maintain newest-first ordering
- ensure `id` and `slug` remain stable and descriptive

### 3. Verify rendering surfaces

Check the affected consumers:

- `/updates` list and hero
- dashboard promo card when `isMajor` changes

If copy length changes materially, verify mobile density and button wrapping.

### 4. Update docs only when rules changed

If the task changes the update system itself, also update:

- `docs/planning/2026.03.18-feature-announcement-hub.md`

## Authoring Checklist

- Did the entry use the template in `src/content/product-updates.ts`?
- Is `publishedAt` correctly formatted?
- Is the ordering still newest first?
- Is `isMajor` intentional?
- Is the CTA label still aligned with the product rule?
- If dashboard copy changed, is the mobile card still readable?
