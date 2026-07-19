import { getDb } from "@/db";
import { createWebhookStorage } from "../storage/webhook.storage";
import { extractDisplayKeys, toKstDateString } from "../utils/webhook.utils";

type GithubPrPayload = {
  action: string;
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    state: string;
    merged: boolean;
    merged_at: string | null;
  };
  repository: {
    id: number;
  };
  installation: {
    id: number;
  };
};

export function createWebhookService(env: CloudflareEnv) {
  const db = getDb(env.DB);
  const storage = createWebhookStorage();

  return {
    /**
     * Handle an incoming pull_request webhook event.
     * Steps:
     * 1. Find the workspace via installation.id + repository.id
     * 2. Extract #ABC-1 keys from title + body
     * 3. Filter by workspace prefix
     * 4. For each match: upsert PR link + apply daily log if MERGED
     */
    async handlePullRequestEvent(
      deliveryId: string,
      payload: GithubPrPayload,
    ): Promise<{ processed: number; skipped: string[] }> {
      const eventRow = await storage.createEvent(db, {
        deliveryId,
        eventName: "pull_request",
        action: payload.action,
        repositoryId: String(payload.repository.id),
        installationId: String(payload.installation.id),
        status: "RECEIVED",
      });

      // Only handle opened, edited, closed (merged) events
      const relevantActions = ["opened", "edited", "closed", "synchronize"];
      if (!relevantActions.includes(payload.action)) {
        await storage.updateEventStatus(db, eventRow.id, "SKIPPED", `action=${payload.action}`);
        return { processed: 0, skipped: [`action=${payload.action}`] };
      }

      // Find workspace context
      const repoLink = await storage.findRepositoryLinkByGithubIds(
        db,
        String(payload.installation.id),
        String(payload.repository.id),
      );

      if (!repoLink) {
        await storage.updateEventStatus(db, eventRow.id, "SKIPPED", "no_active_workspace_link");
        return { processed: 0, skipped: ["no_active_workspace_link"] };
      }

      const { linkId, workspaceId, actionItemPrefix } = repoLink;

      // Extract candidates from title + body
      const textToSearch = [payload.pull_request.title, payload.pull_request.body ?? ""].join(" ");

      const candidates = extractDisplayKeys(textToSearch);

      // Filter: only keys matching this workspace's prefix
      const matching = candidates.filter((c) => c.prefix === actionItemPrefix);

      if (matching.length === 0) {
        await storage.updateEventStatus(db, eventRow.id, "SKIPPED", "no_matching_keys");
        return { processed: 0, skipped: ["no_matching_keys"] };
      }

      const pr = payload.pull_request;
      const isMerged = pr.merged && pr.state === "closed";
      const prState: "OPEN" | "CLOSED" | "MERGED" = isMerged
        ? "MERGED"
        : pr.state === "closed"
          ? "CLOSED"
          : "OPEN";

      // KST date for daily log
      const mergedAt = pr.merged_at ? new Date(pr.merged_at) : null;
      const dailyLogDate = isMerged ? toKstDateString(mergedAt ?? new Date()) : null;

      let processedCount = 0;
      const skipped: string[] = [];

      for (const candidate of matching) {
        // Deduplicate within the same event
        const actionItem = await storage.findActionItemByDisplayKey(
          db,
          workspaceId,
          candidate.sequence,
        );

        if (!actionItem) {
          skipped.push(`${candidate.raw}:not_found`);
          continue;
        }

        const existingLink = await storage.getPrLinkByKey(
          db,
          linkId,
          pr.number,
          actionItem.leadMeasureId,
        );

        // Skip daily log if already applied for this PR+action item combination
        const alreadyApplied = existingLink?.dailyLogAppliedAt != null;

        await storage.upsertPrLink(db, {
          workspaceId,
          leadMeasureId: actionItem.leadMeasureId,
          repositoryLinkId: linkId,
          githubPullRequestId: String(pr.id),
          number: pr.number,
          title: pr.title,
          url: pr.html_url,
          state: prState,
          matchedDisplayKey: candidate.raw,
          dailyLogDate: dailyLogDate,
          dailyLogAppliedAt:
            isMerged && !alreadyApplied ? new Date() : (existingLink?.dailyLogAppliedAt ?? null),
          lastSyncedAt: new Date(),
        });

        // Apply daily log only on first merge detection
        if (isMerged && !alreadyApplied && dailyLogDate) {
          if (actionItem.trackingMode === "BOOLEAN") {
            await storage.upsertBooleanDailyLog(db, actionItem.leadMeasureId, dailyLogDate);
          } else {
            await storage.incrementCountDailyLog(db, actionItem.leadMeasureId, dailyLogDate);
          }
        }

        processedCount++;
      }

      const finalStatus = processedCount > 0 ? "PROCESSED" : "SKIPPED";
      const errorCode = processedCount === 0 ? skipped.join(",") : null;
      await storage.updateEventStatus(db, eventRow.id, finalStatus, errorCode);

      return { processed: processedCount, skipped };
    },
  };
}
