# Thursday Focus Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a weekly Thursday 3 PM KST push that selects the lowest-performing lead measure for the current week and uses AI SDK with Gemini 2.5 Flash only as a tie-breaker when multiple lead measures share the same lowest execution rate.

**Architecture:** Keep the existing daily push flow intact and add a separate internal cron route for weekly focus pushes. Move the new selection logic into a dedicated notification domain service: pure rule-based scoring first, AI tie-break second, then route-level push delivery with the existing VAPID stack.

**Tech Stack:** Next.js route handlers, Cloudflare Worker cron/internal auth, Drizzle ORM, Vitest, `ai`, `@ai-sdk/google`, Zod

---

## File Map

### New files

- `src/domain/notification/services/weekly-focus-selector.ts`
  Pure helpers for current-week execution calculations, lowest-rate selection, and fallback handling.
- `src/domain/notification/services/weekly-focus-selector.test.ts`
  Unit tests for 0-candidate, single-candidate, tied-candidate, and fallback behavior.
- `src/domain/notification/services/weekly-focus-ai.ts`
  AI SDK wrapper using `generateObject` with `google('gemini-2.5-flash')` to choose one lead measure id from tied candidates.
- `src/domain/notification/services/weekly-focus-ai.test.ts`
  Unit tests for valid AI choice, invalid choice, and exception fallback handling.
- `src/domain/notification/services/weekly-focus-push.service.ts`
  Orchestrates subscription lookup, active scoreboard lookup, weekly log loading, candidate selection, optional AI tie-break, and payload creation.
- `src/domain/notification/services/weekly-focus-push.service.test.ts`
  Service-level tests for target filtering and delivery decisions.
- `src/app/api/push/send-weekly-focus/route.ts`
  Internal cron-only endpoint for the weekly Thursday push.
- `src/app/api/push/send-weekly-focus/route.test.ts`
  Route test covering auth and service invocation.

### Modified files

- `src/app/api/push/send-daily/route.ts`
  Keep behavior unchanged; only extract or share small push-delivery helpers if duplication becomes noisy.
- `.env.example`
  Add `GOOGLE_GENERATIVE_AI_API_KEY`.
- `cloudflare-env.d.ts`
  Regenerate or update tracked env typing so `env.GOOGLE_GENERATIVE_AI_API_KEY` is typed.
- `docs/dev/notification/2026.03.12-domain-notification.md`
  Document the new weekly Thursday focus push and tie-break behavior.

## Task 1: Add Pure Weekly Focus Selection Helpers

**Files:**
- Create: `src/domain/notification/services/weekly-focus-selector.ts`
- Test: `src/domain/notification/services/weekly-focus-selector.test.ts`

- [ ] **Step 1: Write the failing selector tests**

```ts
import { describe, expect, it } from "vitest";
import {
  chooseWeeklyFocusCandidate,
  computeWeeklyExecutionRate,
} from "./weekly-focus-selector";

describe("computeWeeklyExecutionRate", () => {
  it("returns 0 when expected count is 0", () => {
    expect(computeWeeklyExecutionRate({ achieved: 0, expected: 0 })).toBe(0);
  });

  it("returns a rounded percentage for active progress", () => {
    expect(computeWeeklyExecutionRate({ achieved: 1, expected: 4 })).toBe(25);
  });
});

describe("chooseWeeklyFocusCandidate", () => {
  it("returns no candidate when measures are empty", () => {
    expect(chooseWeeklyFocusCandidate([])).toEqual({ kind: "none" });
  });

  it("returns a direct candidate when only one lowest-rate measure exists", () => {
    expect(
      chooseWeeklyFocusCandidate([
        { id: 11, rate: 0, name: "Walk" },
        { id: 12, rate: 50, name: "Read" },
      ]),
    ).toEqual({
      kind: "direct",
      candidate: { id: 11, rate: 0, name: "Walk" },
    });
  });

  it("returns a tie when multiple lowest-rate measures exist", () => {
    expect(
      chooseWeeklyFocusCandidate([
        { id: 11, rate: 0, name: "Walk" },
        { id: 12, rate: 0, name: "Read" },
      ]),
    ).toMatchObject({
      kind: "tie",
      candidates: [{ id: 11 }, { id: 12 }],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/domain/notification/services/weekly-focus-selector.test.ts --run`
Expected: FAIL with module not found or exported function errors.

- [ ] **Step 3: Write minimal selector implementation**

```ts
export type WeeklyFocusCandidate = {
  id: number;
  name: string;
  description?: string | null;
  rate: number;
  achieved: number;
  expected: number;
};

export function computeWeeklyExecutionRate(input: {
  achieved: number;
  expected: number;
}) {
  if (input.expected <= 0) return 0;
  return Number(((input.achieved / input.expected) * 100).toFixed(1));
}

export function chooseWeeklyFocusCandidate(candidates: WeeklyFocusCandidate[]) {
  if (candidates.length === 0) return { kind: "none" } as const;

  const lowestRate = Math.min(...candidates.map((candidate) => candidate.rate));
  const lowestCandidates = candidates.filter(
    (candidate) => candidate.rate === lowestRate,
  );

  if (lowestCandidates.length === 1) {
    return { kind: "direct", candidate: lowestCandidates[0] } as const;
  }

  return { kind: "tie", candidates: lowestCandidates } as const;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/domain/notification/services/weekly-focus-selector.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/notification/services/weekly-focus-selector.ts src/domain/notification/services/weekly-focus-selector.test.ts
git commit -m "feat: add weekly focus selector"
```

## Task 2: Add AI Tie-Break Wrapper with AI SDK and Gemini 2.5 Flash

**Files:**
- Create: `src/domain/notification/services/weekly-focus-ai.ts`
- Test: `src/domain/notification/services/weekly-focus-ai.test.ts`

- [ ] **Step 1: Write the failing AI wrapper tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { breakWeeklyFocusTie } from "./weekly-focus-ai";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

describe("breakWeeklyFocusTie", () => {
  it("returns the selected id when Gemini chooses a valid candidate", async () => {
    // mock generateObject -> { object: { selectedLeadMeasureId: 12 } }
  });

  it("returns null when Gemini returns an id outside the candidate set", async () => {
    // mock generateObject -> { object: { selectedLeadMeasureId: 999 } }
  });

  it("returns null when generateObject throws", async () => {
    // mock generateObject rejection
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/domain/notification/services/weekly-focus-ai.test.ts --run`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement the AI tie-break module**

```ts
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const weeklyFocusChoiceSchema = z.object({
  selectedLeadMeasureId: z.number().int(),
});

export async function breakWeeklyFocusTie(input: {
  apiKey: string;
  goalName: string;
  candidates: Array<{
    id: number;
    name: string;
    description?: string | null;
    achieved: number;
    expected: number;
    rate: number;
  }>;
}) {
  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash", {
        apiKey: input.apiKey,
      }),
      schema: weeklyFocusChoiceSchema,
      prompt: [
        `WIG goal: ${input.goalName}`,
        "Choose exactly one lead measure id that should be nudged first this week.",
        "Only choose from the candidates below.",
        JSON.stringify(input.candidates),
      ].join("\n\n"),
    });

    return input.candidates.some(
      (candidate) => candidate.id === object.selectedLeadMeasureId,
    )
      ? object.selectedLeadMeasureId
      : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/domain/notification/services/weekly-focus-ai.test.ts --run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/notification/services/weekly-focus-ai.ts src/domain/notification/services/weekly-focus-ai.test.ts
git commit -m "feat: add weekly focus ai tie breaker"
```

## Task 3: Build the Weekly Focus Push Service

**Files:**
- Create: `src/domain/notification/services/weekly-focus-push.service.ts`
- Test: `src/domain/notification/services/weekly-focus-push.service.test.ts`
- Modify: `src/domain/scoreboard/storage/scoreboard.storage.ts`
- Modify: `src/domain/lead-measure/storage/lead-measure.storage.ts`
- Modify: `src/domain/daily-log/storage/daily-log.storage.ts`

- [ ] **Step 1: Write the failing service tests**

```ts
import { describe, expect, it, vi } from "vitest";
import { WeeklyFocusPushService } from "./weekly-focus-push.service";

describe("WeeklyFocusPushService", () => {
  it("skips users with no active scoreboard", async () => {});
  it("sends direct selection without AI when one lowest candidate exists", async () => {});
  it("uses AI only when lowest candidates tie", async () => {});
  it("skips push when candidate count is zero", async () => {});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/domain/notification/services/weekly-focus-push.service.test.ts --run`
Expected: FAIL with missing service module.

- [ ] **Step 3: Extend storage APIs with the minimum read shape**

```ts
// src/domain/scoreboard/storage/scoreboard.storage.ts
async findActiveScoreboardsForPush(): Promise<Array<{
  id: number;
  userId: number;
  goalName: string;
}>> { /* ACTIVE scoreboard rows */ }

// src/domain/lead-measure/storage/lead-measure.storage.ts
async findActiveLeadMeasuresByScoreboardIds(scoreboardIds: number[]) { /* grouped lookup */ }

// src/domain/daily-log/storage/daily-log.storage.ts
async countTrueLogsForLeadMeasuresInRange(leadMeasureIds: number[], from: string, to: string) {
  /* return Record<number, number> */
}
```

- [ ] **Step 4: Implement the orchestration service**

```ts
export class WeeklyFocusPushService {
  async buildWeeklyFocusJobs() {
    // 1. load push subscriptions
    // 2. load users' active scoreboards
    // 3. load active lead measures
    // 4. compute this-week expected vs achieved
    // 5. choose direct candidate or AI tie-break
    // 6. return push jobs with title/body/url
  }
}
```

Implementation rules:
- Use current-week KST boundaries consistently.
- Skip users with no push subscription, no active scoreboard, or no eligible lead measures.
- Build body as ``오늘은 ${leadMeasure.name} 해볼까요?``.
- Pass `env.GOOGLE_GENERATIVE_AI_API_KEY` only to the AI wrapper, never to payload code.

- [ ] **Step 5: Run the service tests**

Run: `yarn test src/domain/notification/services/weekly-focus-push.service.test.ts --run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/domain/notification/services/weekly-focus-push.service.ts src/domain/notification/services/weekly-focus-push.service.test.ts src/domain/scoreboard/storage/scoreboard.storage.ts src/domain/lead-measure/storage/lead-measure.storage.ts src/domain/daily-log/storage/daily-log.storage.ts
git commit -m "feat: add weekly focus push service"
```

## Task 4: Add the Weekly Cron Route and Keep Daily Push Isolated

**Files:**
- Create: `src/app/api/push/send-weekly-focus/route.ts`
- Test: `src/app/api/push/send-weekly-focus/route.test.ts`
- Modify: `src/app/api/push/send-daily/route.ts`

- [ ] **Step 1: Write the failing route test**

```ts
import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/push/send-weekly-focus", () => {
  it("returns 401 when Authorization does not match CRON_SECRET", async () => {});
  it("returns a delivery summary when the request is authorized", async () => {});
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/app/api/push/send-weekly-focus/route.test.ts --run`
Expected: FAIL with route module missing.

- [ ] **Step 3: Implement the route with existing push delivery primitives**

```ts
export const GET = withErrorHandler(async (request: Request) => {
  const { env } = getCloudflareContext();

  if (request.headers.get("Authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return apiError("UNAUTHORIZED");
  }

  const service = new WeeklyFocusPushService(/* deps */);
  const result = await service.sendWeeklyFocusPushes({
    vapidPublicKey: env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    vapidPrivateKey: env.VAPID_PRIVATE_KEY,
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
  });

  return apiSuccess(result);
});
```

- [ ] **Step 4: Refactor only if it removes obvious duplication**

Allowed:
- extract shared `sendPushMessage` helper used by both routes

Not allowed:
- merge weekly and daily behavior into one branching route

- [ ] **Step 5: Run route test**

Run: `yarn test src/app/api/push/send-weekly-focus/route.test.ts --run`
Expected: PASS

- [ ] **Step 6: Run focused regression for daily push**

Run: `yarn test src/app/api/push/send-daily/route.test.ts --run`
Expected: PASS if a new route test is added there, or skip with note if no meaningful test exists yet.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/push/send-weekly-focus/route.ts src/app/api/push/send-weekly-focus/route.test.ts src/app/api/push/send-daily/route.ts
git commit -m "feat: add weekly focus push route"
```

## Task 5: Wire Environment, Cron Config, and Documentation

**Files:**
- Modify: `.env.example`
- Modify: `cloudflare-env.d.ts`
- Modify: `wrangler.jsonc`
- Modify: `docs/dev/notification/2026.03.12-domain-notification.md`

- [ ] **Step 1: Add the new environment variable to local examples**

```env
GOOGLE_GENERATIVE_AI_API_KEY="YOUR_GOOGLE_GENERATIVE_AI_API_KEY"
```

- [ ] **Step 2: Update typed env access**

```ts
interface Env {
  GOOGLE_GENERATIVE_AI_API_KEY: string;
}
```

Preferred command if the project expects generated types:

```bash
yarn cf-typegen
```

- [ ] **Step 3: Add the weekly cron trigger**

Implementation target:
- add a cron schedule for Thursday 15:00 KST
- route it to `GET /api/push/send-weekly-focus` with `Authorization: Bearer <CRON_SECRET>`

If the repo already manages cron outside `wrangler.jsonc`, document the actual source of truth before editing.

- [ ] **Step 4: Update notification docs**

Add:
- daily 9 PM reminder remains unchanged
- weekly Thursday 3 PM focus push exists
- AI SDK + Gemini 2.5 Flash is used only for tied lowest-rate lead measures
- no candidate means no push

- [ ] **Step 5: Run relevant verification**

Run:

```bash
yarn test src/domain/notification/services/weekly-focus-selector.test.ts --run
yarn test src/domain/notification/services/weekly-focus-ai.test.ts --run
yarn test src/domain/notification/services/weekly-focus-push.service.test.ts --run
yarn test src/app/api/push/send-weekly-focus/route.test.ts --run
yarn lint
yarn tsc --noEmit
```

Expected:
- all focused tests PASS
- lint PASS
- typecheck PASS

- [ ] **Step 6: Commit**

```bash
git add .env.example cloudflare-env.d.ts wrangler.jsonc docs/dev/notification/2026.03.12-domain-notification.md
git commit -m "docs: wire weekly focus push config"
```

## Notes for the Implementer

- Use official AI SDK Google provider docs: `@ai-sdk/google`, `google('gemini-2.5-flash')`, `GOOGLE_GENERATIVE_AI_API_KEY`.
- Prefer `generateObject` + Zod schema over free-form text parsing.
- Keep AI out of the happy path when only one lowest-rate lead measure exists.
- Do not broaden this feature into generic coaching, prompt experimentation, or UI changes.
- Preserve the existing daily reminder route semantics.
