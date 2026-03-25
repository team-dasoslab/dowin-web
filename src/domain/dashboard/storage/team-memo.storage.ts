import { getDb } from "@/db";
import { teamMemos } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export type TeamMemoRecord = {
  id: number;
  workspaceId: number;
  targetUserId: number;
  authorUserId: number;
  content: string;
  resolvedAt: Date | null;
  resolvedByUserId: number | null;
  createdAt: Date;
  authorUser: {
    id: number;
    nickname: string;
    avatarKey: string | null;
  } | null;
};

export class TeamMemoStorage {
  constructor(private db: Db) {}

  async listByWorkspaceAndTarget(
    workspaceId: number,
    targetUserId: number,
  ): Promise<TeamMemoRecord[]> {
    const records = await this.db.query.teamMemos.findMany({
      where: and(
        eq(teamMemos.workspaceId, workspaceId),
        eq(teamMemos.targetUserId, targetUserId),
      ),
      with: {
        authorUser: true,
      },
      orderBy: [desc(teamMemos.id)],
    });

    return records.map(mapTeamMemoRecord);
  }

  async findById(memoId: number): Promise<TeamMemoRecord | null> {
    const record = await this.db.query.teamMemos.findFirst({
      where: eq(teamMemos.id, memoId),
      with: {
        authorUser: true,
      },
    });

    return record ? mapTeamMemoRecord(record) : null;
  }

  async create(input: {
    workspaceId: number;
    targetUserId: number;
    authorUserId: number;
    content: string;
  }): Promise<TeamMemoRecord> {
    const [created] = await this.db.insert(teamMemos).values(input).returning();
    const record = await this.findById(created.id);

    if (!record) {
      throw new Error("TEAM_MEMO_CREATE_FAILED");
    }

    return record;
  }

  async updateResolved(input: {
    memoId: number;
    isResolved: boolean;
    resolvedByUserId: number | null;
  }): Promise<TeamMemoRecord | null> {
    const [updated] = await this.db
      .update(teamMemos)
      .set({
        resolvedAt: input.isResolved ? new Date() : null,
        resolvedByUserId: input.isResolved ? input.resolvedByUserId : null,
      })
      .where(eq(teamMemos.id, input.memoId))
      .returning();

    if (!updated) {
      return null;
    }

    return this.findById(updated.id);
  }

  async deleteById(memoId: number): Promise<boolean> {
    const [deleted] = await this.db
      .delete(teamMemos)
      .where(eq(teamMemos.id, memoId))
      .returning({ id: teamMemos.id });

    return deleted != null;
  }
}

function mapTeamMemoRecord(
  record: typeof teamMemos.$inferSelect & {
    authorUser?: {
      id: number;
      nickname: string;
      avatarKey: string | null;
    } | null;
  },
): TeamMemoRecord {
  return {
    ...record,
    authorUser: record.authorUser ?? null,
    resolvedByUserId: record.resolvedByUserId ?? null,
  };
}
