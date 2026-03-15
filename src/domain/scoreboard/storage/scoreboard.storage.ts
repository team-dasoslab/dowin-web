import { leadMeasures, scoreboards } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export type CreateScoreboardInput = {
  userId: number;
  workspaceId: number;
  goalName: string;
  lagMeasure: string;
  startDate: string;
  endDate?: string | null;
};

export type UpdateScoreboardInput = Partial<
  Pick<
    CreateScoreboardInput,
    "goalName" | "lagMeasure" | "startDate" | "endDate"
  >
>;

export type ScoreboardRecord = typeof scoreboards.$inferSelect;
export type LeadMeasureRecord = typeof leadMeasures.$inferSelect;
export type ScoreboardWithLeadMeasures = ScoreboardRecord & {
  leadMeasures: LeadMeasureRecord[];
};

export interface ScoreboardDbPort {
  query: {
    scoreboards: {
      findFirst(args: unknown): Promise<unknown>;
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
}

export class ScoreboardStorage {
  constructor(private db: ScoreboardDbPort) {}

  async findActiveScoreboard(
    userId: number,
    workspaceId: number,
  ): Promise<ScoreboardWithLeadMeasures | undefined> {
    return (await this.db.query.scoreboards.findFirst({
      where: and(
        eq(scoreboards.userId, userId),
        eq(scoreboards.workspaceId, workspaceId),
        eq(scoreboards.status, "ACTIVE"),
      ),
      with: {
        leadMeasures: true,
      },
    })) as ScoreboardWithLeadMeasures | undefined;
  }

  async createScoreboard(
    input: CreateScoreboardInput,
  ): Promise<ScoreboardRecord> {
    const [created] = (await this.db
      .insert(scoreboards)
      .values(input)
      .returning()) as ScoreboardRecord[];
    return created;
  }

  async findOwnedScoreboard(
    id: number,
    userId: number,
    workspaceId: number,
  ): Promise<ScoreboardWithLeadMeasures | undefined> {
    return (await this.db.query.scoreboards.findFirst({
      where: and(
        eq(scoreboards.id, id),
        eq(scoreboards.userId, userId),
        eq(scoreboards.workspaceId, workspaceId),
      ),
      with: {
        leadMeasures: true,
      },
    })) as ScoreboardWithLeadMeasures | undefined;
  }

  async findActiveScoreboardsByWorkspace(
    workspaceId: number,
  ): Promise<ScoreboardWithLeadMeasures[]> {
    return (await this.db.query.scoreboards.findMany({
      where: and(
        eq(scoreboards.workspaceId, workspaceId),
        eq(scoreboards.status, "ACTIVE"),
      ),
      with: {
        leadMeasures: true,
      },
      orderBy: [desc(scoreboards.createdAt)],
    })) as ScoreboardWithLeadMeasures[];
  }

  async updateScoreboard(
    id: number,
    input: UpdateScoreboardInput,
  ): Promise<ScoreboardRecord> {
    const [updated] = (await this.db
      .update(scoreboards)
      .set(input)
      .where(eq(scoreboards.id, id))
      .returning()) as ScoreboardRecord[];

    return updated;
  }

  async archiveScoreboard(id: number): Promise<ScoreboardRecord> {
    const [archived] = (await this.db
      .update(scoreboards)
      .set({ status: "ARCHIVED" })
      .where(eq(scoreboards.id, id))
      .returning()) as ScoreboardRecord[];

    return archived;
  }

  async findArchivedScoreboards(
    userId: number,
    workspaceId: number,
  ): Promise<ScoreboardRecord[]> {
    return (await this.db.query.scoreboards.findMany({
      where: and(
        eq(scoreboards.userId, userId),
        eq(scoreboards.workspaceId, workspaceId),
        eq(scoreboards.status, "ARCHIVED"),
      ),
      orderBy: [desc(scoreboards.createdAt)],
    })) as ScoreboardRecord[];
  }
}
