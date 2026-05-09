# Dowin WebView Rules

## Read Order

1. `docs/dev/app-webview/2026.04.24-webview-bridge-spec.md`
2. `docs/dev/app-webview/types.ts`
3. `src/types/bridge.ts`
4. `src/lib/bridge.ts`
5. relevant consumers such as:
   - `src/components/bridge/BridgeInitializer.tsx`
   - `src/hooks/useAppBridgeNotifications.ts`
   - `src/hooks/useAppBridgeDeepLink.ts`
   - `src/app/[locale]/(protected)/dashboard/my/_hooks/usePostLoginNotificationPermissionPrompt.ts`

## Working Rules

- Keep bridge types explicit and importable without local app dependencies.
- Use `bridge.store` for state access and subscription.
- Keep native method wrappers centralized in `src/lib/bridge.ts`.
- Browser fallback behavior must be intentional and safe.
- Do not use bridge state to bypass server-side authorization or protected API checks.
- If a WebView-specific change introduces user-facing copy, update both `src/messages/ko.json` and `src/messages/en.json`.
- If behavior changes for notification, deep link, or first-entry prompts, update `docs/onboarding.md`.

## Typical File Targets

- `src/lib/bridge.ts`
- `src/types/bridge.ts`
- `src/components/bridge/BridgeInitializer.tsx`
- `src/hooks/useAppBridgeNotifications.ts`
- `src/hooks/useAppBridgeDeepLink.ts`
- `src/app/[locale]/(protected)/dashboard/my/_hooks/usePostLoginNotificationPermissionPrompt.ts`
- `docs/dev/app-webview/2026.04.24-webview-bridge-spec.md`
- `docs/dev/app-webview/types.ts`

## Verification Defaults

```bash
yarn tsc --noEmit
yarn eslint <changed-files>
```

If multiple bridge consumers changed:

```bash
yarn lint
```
