import { getDb } from "@/db";
import {
  actionItemPublicIds,
  dailyLogs,
  githubPrLinks,
  githubRepositories,
  githubUserInstallations,
  githubWebhookEvents,
  leadMeasures,
  workspaceGithubRepositoryLinks,
  workspaces,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export function createWebhookStorage() {
  return {
    async findEventByDeliveryId(db: Db, deliveryId: string) {
      const [result] = await db
        .select()
        .from(githubWebhookEvents)
        .where(eq(githubWebhookEvents.deliveryId, deliveryId));
      return result ?? null;
    },

    async createEvent(
      db: Db,
      payload: {
        deliveryId: string;
        eventName: string;
        action: string | null;
        repositoryId: string | null;
        installationId: string | null;
        status: "RECEIVED" | "PROCESSED" | "SKIPPED" | "FAILED";
        errorCode?: string | null;
      },
    ) {
      const [result] = await db
        .insert(githubWebhookEvents)
        .values({
          deliveryId: payload.deliveryId,
          eventName: payload.eventName,
          action: payload.action,
          repositoryId: payload.repositoryId,
          installationId: payload.installationId,
          status: payload.status,
          errorCode: payload.errorCode ?? null,
        })
        .returning();
      return result;
    },

    async updateEventStatus(
      db: Db,
      id: number,
      status: "PROCESSED" | "SKIPPED" | "FAILED",
      errorCode?: string | null,
    ) {
      await db
        .update(githubWebhookEvents)
        .set({
          status,
          errorCode: errorCode ?? null,
          processedAt: new Date(),
        })
        .where(eq(githubWebhookEvents.id, id));
    },

    /**
     * Find the active workspace context via GitHub installationId + repositoryId.
     * Core lookup: webhook payload → workspace + actionItemPrefix.
     */
    async findRepositoryLinkByGithubIds(
      db: Db,
      installationId: string,
      githubRepositoryId: string,
    ) {
      const result = await db
        .select({
          linkId: workspaceGithubRepositoryLinks.id,
          workspaceId: workspaceGithubRepositoryLinks.workspaceId,
          actionItemPrefix: workspaces.actionItemPrefix,
        })
        .from(githubRepositories)
        .innerJoin(
          githubUserInstallations,
          eq(githubRepositories.installationId, githubUserInstallations.id),
        )
        .innerJoin(
          workspaceGithubRepositoryLinks,
          eq(workspaceGithubRepositoryLinks.repositoryId, githubRepositories.id),
        )
        .innerJoin(workspaces, eq(workspaceGithubRepositoryLinks.workspaceId, workspaces.id))
        .where(
          and(
            eq(githubUserInstallations.installationId, installationId),
            eq(githubRepositories.githubRepositoryId, githubRepositoryId),
            eq(workspaceGithubRepositoryLinks.status, "ACTIVE"),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    },

    /**
     * Find an active action item by workspace + displaySequence.
     */
    async findActionItemByDisplayKey(db: Db, workspaceId: number, displaySequence: number) {
      const result = await db
        .select({
          leadMeasureId: actionItemPublicIds.leadMeasureId,
          displaySequence: actionItemPublicIds.displaySequence,
          trackingMode: leadMeasures.trackingMode,
        })
        .from(actionItemPublicIds)
        .innerJoin(leadMeasures, eq(actionItemPublicIds.leadMeasureId, leadMeasures.id))
        .where(
          and(
            eq(actionItemPublicIds.workspaceId, workspaceId),
            eq(actionItemPublicIds.displaySequence, displaySequence),
            eq(leadMeasures.status, "ACTIVE"),
          ),
        )
        .limit(1);

      return result[0] ?? null;
    },

    /**
     * Upsert a PR link (idempotent by repositoryLinkId + number + leadMeasureId).
     */
    async upsertPrLink(
      db: Db,
      payload: {
        workspaceId: number;
        leadMeasureId: number;
        repositoryLinkId: number;
        githubPullRequestId: string;
        number: number;
        title: string;
        url: string;
        state: "OPEN" | "CLOSED" | "MERGED";
        matchedDisplayKey: string;
        dailyLogDate: string | null;
        dailyLogAppliedAt: Date | null;
        lastSyncedAt: Date;
      },
    ) {
      const [result] = await db
        .insert(githubPrLinks)
        .values({
          workspaceId: payload.workspaceId,
          leadMeasureId: payload.leadMeasureId,
          repositoryLinkId: payload.repositoryLinkId,
          githubPullRequestId: payload.githubPullRequestId,
          number: payload.number,
          title: payload.title,
          url: payload.url,
          state: payload.state,
          matchedDisplayKey: payload.matchedDisplayKey,
          dailyLogDate: payload.dailyLogDate,
          dailyLogAppliedAt: payload.dailyLogAppliedAt,
          lastSyncedAt: payload.lastSyncedAt,
        })
        .onConflictDoUpdate({
          target: [
            githubPrLinks.repositoryLinkId,
            githubPrLinks.number,
            githubPrLinks.leadMeasureId,
          ],
          set: {
            title: payload.title,
            url: payload.url,
            state: payload.state,
            dailyLogDate: payload.dailyLogDate,
            dailyLogAppliedAt: payload.dailyLogAppliedAt,
            lastSyncedAt: payload.lastSyncedAt,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    },

    async getPrLinkByKey(
      db: Db,
      repositoryLinkId: number,
      prNumber: number,
      leadMeasureId: number,
    ) {
      const [result] = await db
        .select({
          id: githubPrLinks.id,
          dailyLogAppliedAt: githubPrLinks.dailyLogAppliedAt,
        })
        .from(githubPrLinks)
        .where(
          and(
            eq(githubPrLinks.repositoryLinkId, repositoryLinkId),
            eq(githubPrLinks.number, prNumber),
            eq(githubPrLinks.leadMeasureId, leadMeasureId),
          ),
        )
        .limit(1);
      return result ?? null;
    },

    /** BOOLEAN action item → set value=true, count=1 for the date. */
    async upsertBooleanDailyLog(db: Db, leadMeasureId: number, logDate: string) {
      await db
        .insert(dailyLogs)
        .values({ leadMeasureId, logDate, value: true, count: 1 })
        .onConflictDoUpdate({
          target: [dailyLogs.leadMeasureId, dailyLogs.logDate],
          set: { value: true, count: 1 },
        });
    },

    /** COUNT action item → each merged PR increments count by 1 for the date. */
    async incrementCountDailyLog(db: Db, leadMeasureId: number, logDate: string) {
      await db
        .insert(dailyLogs)
        .values({ leadMeasureId, logDate, value: false, count: 1 })
        .onConflictDoUpdate({
          target: [dailyLogs.leadMeasureId, dailyLogs.logDate],
          set: { count: sql`${dailyLogs.count} + 1` },
        });
    },

    async findInstallationsByGithubId(db: Db, githubInstallationId: string) {
      return await db
        .select()
        .from(githubUserInstallations)
        .where(eq(githubUserInstallations.installationId, githubInstallationId));
    },

    async addRepositories(
      db: Db,
      installationInternalId: number,
      repositories: Array<{
        id: number;
        name: string;
        full_name: string;
        private: boolean;
      }>,
    ) {
      if (repositories.length === 0) return;
      const values = repositories.map((repo) => ({
        installationId: installationInternalId,
        githubRepositoryId: String(repo.id),
        ownerLogin: repo.full_name.split("/")[0],
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        status: "ACTIVE" as const,
      }));

      await db
        .insert(githubRepositories)
        .values(values)
        .onConflictDoUpdate({
          target: [githubRepositories.installationId, githubRepositories.githubRepositoryId],
          set: {
            ownerLogin: sql`excluded.owner_login`,
            name: sql`excluded.name`,
            fullName: sql`excluded.full_name`,
            private: sql`excluded.private`,
            status: "ACTIVE",
            updatedAt: new Date(),
          },
        });
    },

    async removeRepositories(db: Db, installationInternalId: number, repositoryIds: string[]) {
      if (repositoryIds.length === 0) return;
      await db
        .delete(githubRepositories)
        .where(
          and(
            eq(githubRepositories.installationId, installationInternalId),
            inArray(githubRepositories.githubRepositoryId, repositoryIds),
          ),
        );
    },
  };
}
