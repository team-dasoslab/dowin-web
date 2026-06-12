---
name: frontend-webview
description: Use this skill when changing Dowin's WebView bridge integration, native-web client detection, bridge store consumption, deep link or push notification handoff, safe-area syncing, or browser-vs-native fallback behavior in the web frontend. Trigger it for requests about `src/lib/bridge.ts`, `src/types/bridge.ts`, `BridgeInitializer`, post-login notification permission prompts in `dashboard/my`, or docs under `docs/dev/app-webview/`.
---

# Frontend WebView

## Overview

Use this skill for Dowin web-frontend work that depends on the native app WebView shell or the `@webview-bridge/web` client.

Read only the files needed for the task.

Start with:

1. `.agents/skills/frontend/SKILL.md`
2. `references/webview-rules.md`
3. `docs/dev/app-webview/2026.04.24-webview-bridge-spec.md`
4. the current implementation files

If the WebView doc and current code differ, verify the active code path and then sync the docs.

## Dowin WebView Facts

- `src/lib/bridge.ts` is the main bridge entry for the web app.
- `src/types/bridge.ts` is the web copy of the shared native bridge type contract.
- `docs/dev/app-webview/types.ts` must stay semantically aligned with `src/types/bridge.ts`.
- Bridge store fields are native-owned state. The web should read them, not mutate them.
- Bridge methods should be wrapped in small helpers instead of being called ad hoc across the UI.
- Browser fallback behavior should be explicit when native methods are unavailable.
- Notification permission prompt and push subscription are separate concerns. Do not silently conflate them.
- WebView-related changes usually require both implementation and doc sync because the bridge contract is cross-repo.

## Workflow

### 1. Define the WebView boundary

Classify the task first:

- bridge type contract update
- bridge store consumption update
- native method wrapper or fallback update
- login, notification, or deep-link handoff update
- safe-area or status-bar UI sync update
- WebView doc sync only

If the task is ordinary frontend work without bridge/native shell coupling, use `dowin-frontend` instead.

### 2. Confirm the contract before coding

Before editing bridge consumers:

1. inspect `docs/dev/app-webview/2026.04.24-webview-bridge-spec.md`
2. inspect `docs/dev/app-webview/types.ts`
3. inspect `src/types/bridge.ts`
4. inspect current consumers such as `src/lib/bridge.ts` and `src/components/bridge/BridgeInitializer.tsx`

If the request changes public bridge shape, update both doc-side and web-side types.

### 3. Keep store and method usage disciplined

- Read bridge state through selectors or dedicated hooks.
- Prefer narrow hooks such as notification or deep-link specific consumers over page-local bridge parsing.
- Keep native method access behind wrapper helpers in `src/lib/bridge.ts`.
- Validate URL handling and fallback behavior explicitly.
- Avoid `any` in bridge state, payloads, and method wrappers.
- Keep JSON-serializable assumptions intact for shared payloads.

### 4. Preserve flow boundaries

- Do not auto-subscribe the user to push just because notification permission was requested.
- Treat notification permission, push token retrieval, and push subscription persistence as separate stages.
- For login or first-entry prompts, use explicit one-time intent storage and consumption rather than page-global repeated prompts.
- When reacting to `lastNotification` or `lastDeepLink`, guard against duplicate processing.

### 5. Sync docs when behavior hardens

Update:

- `docs/dev/app-webview/2026.04.24-webview-bridge-spec.md` when the contract, examples, or expected behavior changes
- `docs/dev/app-webview/types.ts` when the shared type contract changes
- `docs/onboarding.md` when the active implementation path or operational expectation changed materially

### 6. Verify

Run the smallest useful set first:

```bash
yarn tsc --noEmit
yarn eslint <changed-files>
```

Add broader checks when the change affects real UI behavior or routing:

```bash
yarn lint
yarn test:frontend
```

## Output Contract

When finishing WebView frontend work, report with this shape by default:

```text
stage: frontend-webview
status: pass|needs_revision|fail
summary: 한두 문장 요약
findings:
- ...
failure_categories:
- ...
return_to: planning|frontend|none
next_step: 다음 단계 또는 검증
```

Use these categories when relevant:

- `bridge_contract_drift`
- `native_fallback_gap`
- `duplicate_event_handling`
- `doc_impl_drift`
- `missing_test`

## Next Step

After WebView-related implementation or docs are updated, run `dowin-security-check` for app-code changes or `dowin-harness-security-check` if the task changed skill or harness files.
