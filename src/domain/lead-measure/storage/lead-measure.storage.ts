import { leadMeasures, scoreboards } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";

export type LeadMeasureRecord = typeof leadMeasures.$inferSelect;
export type LeadMeasureWithScoreboard = LeadMeasureRecord & {
  scoreboard: typeof scoreboards.$inferSelect;
};
export type LeadMeasureForPushRecord = Pick<
  LeadMeasureRecord,
  "id" | "scoreboardId" | "name" | "targetValue" | "period"
>;

export type CreateLeadMeasureInput = {
  scoreboardId: number;
  name: string;
  targetValue: number;
  period: "DAILY" | "WEEKLY" | "MONTHLY";
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
      orderBy: [asc(leadMeasures.createdAt)],
    })) as LeadMeasureForPushRecord[];
  }

  async findLeadMeasuresByScoreboard(
    scoreboardId: number,
    status: "active" | "all",
  ): Promise<LeadMeasureRecord[]> {
    return (await this.db.query.leadMeasures.findMany({
      where:
        status === "active"
          ? and(
              eq(leadMeasures.scoreboardId, scoreboardId),
              eq(leadMeasures.status, "ACTIVE"),
            )
          : eq(leadMeasures.scoreboardId, scoreboardId),
      orderBy: [asc(leadMeasures.createdAt)],
    })) as LeadMeasureRecord[];
  }

  async createLeadMeasure(
    input: CreateLeadMeasureInput,
  ): Promise<LeadMeasureRecord> {
    const [created] = (await this.db
      .insert(leadMeasures)
      .values(input)
      .returning()) as LeadMeasureRecord[];

    return created;
  }

  async findOwnedLeadMeasure(
    id: number,
    userId: number,
    workspaceId: number,
  ): Promise<LeadMeasureWithScoreboard | undefined> {
    return (await this.db.query.leadMeasures.findFirst({
      where: eq(leadMeasures.id, id),
      with: {
        scoreboard: {
          where: and(
            eq(scoreboards.userId, userId),
            eq(scoreboards.workspaceId, workspaceId),
          ),
        },
      },
    })) as LeadMeasureWithScoreboard | undefined;
  }

  async updateLeadMeasure(
    id: number,
    input: UpdateLeadMeasureInput,
  ): Promise<LeadMeasureRecord> {
    const [updated] = (await this.db
      .update(leadMeasures)
      .set(input)
      .where(eq(leadMeasures.id, id))
      .returning()) as LeadMeasureRecord[];

    return updated;
  }

  async archiveLeadMeasure(id: number): Promise<LeadMeasureRecord> {
    const [archived] = (await this.db
      .update(leadMeasures)
      .set({
        status: "ARCHIVED",
        archivedAt: new Date(),
      })
      .where(eq(leadMeasures.id, id))
      .returning()) as LeadMeasureRecord[];

    return archived;
  }

  async reactivateLeadMeasure(id: number): Promise<LeadMeasureRecord> {
    const [reactivated] = (await this.db
      .update(leadMeasures)
      .set({
        status: "ACTIVE",
        archivedAt: null,
      })
      .where(eq(leadMeasures.id, id))
      .returning()) as LeadMeasureRecord[];

    return reactivated;
  }

  async deleteLeadMeasure(id: number): Promise<void> {
    await this.db.delete(leadMeasures).where(eq(leadMeasures.id, id));
  }
}
