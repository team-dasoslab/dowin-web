import { leadMeasureTags, leadMeasures, scoreboards, workspaceTags } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

export type LeadMeasureRecord = typeof leadMeasures.$inferSelect;
export type LeadMeasureTagRecord = Pick<typeof workspaceTags.$inferSelect, "id" | "name">;
export type LeadMeasureRecordWithTags = LeadMeasureRecord & {
  tags: LeadMeasureTagRecord[];
};
export type LeadMeasureWithScoreboard = LeadMeasureRecord & {
  scoreboard: typeof scoreboards.$inferSelect;
  tags: LeadMeasureTagRecord[];
};
export type LeadMeasureForPushRecord = Pick<
  LeadMeasureRecord,
  "id" | "scoreboardId" | "name" | "targetValue" | "period"
>;
export type LeadMeasureSummaryRecord = Pick<
  LeadMeasureRecord,
  "id" | "targetValue" | "period" | "trackingMode" | "dailyTargetCount" | "status" | "createdAt"
>;

export type CreateLeadMeasureInput = {
  scoreboardId: number;
  name: string;
  targetValue: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
  trackingMode?: "BOOLEAN" | "COUNT";
  dailyTargetCount?: number;
  tagIds?: number[];
};

export type UpdateLeadMeasureInput = Partial<
  Omit<CreateLeadMeasureInput, "scoreboardId">
>;

export interface LeadMeasureDbPort {
  query: {
    leadMeasures: {
      findMany(args: unknown): Promise<unknown>;
      findFirst(args: unknown): Promise<unknown>;
    };
    workspaceTags: {
      findMany(args: unknown): Promise<unknown>;
    };
  };
  insert(table: unknown): {
    values(input: unknown): {
      returning(): Promise<unknown>;
    };
  };
  update(table: unknown): {
    set(input: unknown): {
      where(condition: unknown): {
        returning(): Promise<unknown>;
      };
    };
  };
  delete(table: unknown): {
    where(condition: unknown): Promise<unknown>;
  };
}

export class LeadMeasureStorage {
  constructor(private db: LeadMeasureDbPort) {}

  private mapLeadMeasureRecord(
    raw: LeadMeasureRecord & {
      tags?: Array<{ tag: typeof workspaceTags.$inferSelect | null }>;
    },
  ): LeadMeasureRecordWithTags {
    return {
      ...raw,
      tags:
        raw.tags
          ?.map((item) => item.tag)
          .filter((tag): tag is typeof workspaceTags.$inferSelect => Boolean(tag))
          .map((tag) => ({ id: tag.id, name: tag.name })) ?? [],
    };
  }

  async findActiveLeadMeasuresByScoreboardIds(
    scoreboardIds: number[],
  ): Promise<LeadMeasureForPushRecord[]> {
    if (scoreboardIds.length === 0) {
      return [];
    }

    return (await this.db.query.leadMeasures.findMany({
      where: and(
        inArray(leadMeasures.scoreboardId, scoreboardIds),
        eq(leadMeasures.status, "ACTIVE"),
      ),
      columns: {
        id: true,
        scoreboardId: true,
        name: true,
        targetValue: true,
        period: true,
      },
      orderBy: [asc(leadMeasures.orderIndex), asc(leadMeasures.createdAt)],
    })) as LeadMeasureForPushRecord[];
  }

  async findLeadMeasuresByScoreboard(
    scoreboardId: number,
    status: "active" | "all",
  ): Promise<LeadMeasureRecordWithTags[]> {
    const rows = (await this.db.query.leadMeasures.findMany({
      where:
        status === "active"
          ? and(
              eq(leadMeasures.scoreboardId, scoreboardId),
              eq(leadMeasures.status, "ACTIVE"),
            )
          : eq(leadMeasures.scoreboardId, scoreboardId),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [asc(leadMeasures.orderIndex), asc(leadMeasures.createdAt)],
    })) as Array<
      LeadMeasureRecord & {
        tags?: Array<{ tag: typeof workspaceTags.$inferSelect | null }>;
      }
    >;

    return rows.map((row) => this.mapLeadMeasureRecord(row));
  }

  async findActiveLeadMeasureSummariesByScoreboard(
    scoreboardId: number,
  ): Promise<LeadMeasureSummaryRecord[]> {
    return (await this.db.query.leadMeasures.findMany({
      where: and(
        eq(leadMeasures.scoreboardId, scoreboardId),
        eq(leadMeasures.status, "ACTIVE"),
      ),
      columns: {
        id: true,
        targetValue: true,
        period: true,
        trackingMode: true,
        orderIndex: true,
        dailyTargetCount: true,
      },
      orderBy: [asc(leadMeasures.orderIndex), asc(leadMeasures.createdAt)],
    })) as LeadMeasureSummaryRecord[];
  }

  async createLeadMeasure(
    input: CreateLeadMeasureInput,
  ): Promise<LeadMeasureRecordWithTags> {
    const { tagIds = [], ...measureInput } = input;
    const [created] = (await this.db
      .insert(leadMeasures)
      .values(measureInput)
      .returning()) as LeadMeasureRecord[];

    if (tagIds.length > 0) {
      await this.db.insert(leadMeasureTags).values(
        tagIds.map((tagId) => ({
          leadMeasureId: created.id,
          tagId,
        })),
      );
    }

    return (await this.findLeadMeasureById(created.id)) as LeadMeasureRecordWithTags;
  }

  async findOwnedLeadMeasure(
    id: number,
    userId: number,
    workspaceId: number,
  ): Promise<LeadMeasureWithScoreboard | undefined> {
    const row = (await this.db.query.leadMeasures.findFirst({
      where: eq(leadMeasures.id, id),
      with: {
        scoreboard: {
          where: and(
            eq(scoreboards.userId, userId),
            eq(scoreboards.workspaceId, workspaceId),
          ),
        },
        tags: {
          with: {
            tag: true,
          },
        },
      },
    })) as
      | (LeadMeasureRecord & {
          scoreboard: typeof scoreboards.$inferSelect;
          tags?: Array<{ tag: typeof workspaceTags.$inferSelect | null }>;
        })
      | undefined;

    if (!row) {
      return undefined;
    }

    return this.mapLeadMeasureRecord(row) as LeadMeasureWithScoreboard;
  }

  async updateLeadMeasure(
    id: number,
    input: UpdateLeadMeasureInput,
  ): Promise<LeadMeasureRecordWithTags> {
    const { tagIds, ...measureInput } = input;

    if (Object.keys(measureInput).length > 0) {
      await this.db
      .update(leadMeasures)
      .set(measureInput)
      .where(eq(leadMeasures.id, id))
      .returning();
    }

    if (tagIds) {
      await this.db.delete(leadMeasureTags).where(eq(leadMeasureTags.leadMeasureId, id));
      if (tagIds.length > 0) {
        await this.db.insert(leadMeasureTags).values(
          tagIds.map((tagId) => ({
            leadMeasureId: id,
            tagId,
          })),
        );
      }
    }

    return (await this.findLeadMeasureById(id)) as LeadMeasureRecordWithTags;
  }

  async archiveLeadMeasure(id: number): Promise<LeadMeasureRecordWithTags> {
    await this.db
      .update(leadMeasures)
      .set({
        status: "ARCHIVED",
        archivedAt: new Date(),
      })
      .where(eq(leadMeasures.id, id))
      .returning();

    return (await this.findLeadMeasureById(id)) as LeadMeasureRecordWithTags;
  }

  async reactivateLeadMeasure(id: number): Promise<LeadMeasureRecordWithTags> {
    await this.db
      .update(leadMeasures)
      .set({
        status: "ACTIVE",
        archivedAt: null,
      })
      .where(eq(leadMeasures.id, id))
      .returning();

    return (await this.findLeadMeasureById(id)) as LeadMeasureRecordWithTags;
  }

  async deleteLeadMeasure(id: number): Promise<void> {
    await this.db.delete(leadMeasures).where(eq(leadMeasures.id, id));
  }

  async findTagsByIdsInWorkspace(
    workspaceId: number,
    tagIds: number[],
  ): Promise<LeadMeasureTagRecord[]> {
    if (tagIds.length === 0) {
      return [];
    }

    return (await this.db.query.workspaceTags.findMany({
      where: and(
        eq(workspaceTags.workspaceId, workspaceId),
        inArray(workspaceTags.id, tagIds),
      ),
      columns: {
        id: true,
        name: true,
      },
    })) as LeadMeasureTagRecord[];
  }

  private async findLeadMeasureById(id: number): Promise<LeadMeasureRecordWithTags | undefined> {
    const row = (await this.db.query.leadMeasures.findFirst({
      where: eq(leadMeasures.id, id),
      with: {
        tags: {
          with: {
            tag: true,
          },
        },
      },
    })) as
      | (LeadMeasureRecord & {
          tags?: Array<{ tag: typeof workspaceTags.$inferSelect | null }>;
        })
      | undefined;

    return row ? this.mapLeadMeasureRecord(row) : undefined;
  }
}
