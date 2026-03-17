import { getDb } from "@/db";
import { users, workspaceMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ProfileRecord = {
  id: number;
  customId: string;
  nickname: string;
  avatarKey: string | null;
  role: "ADMIN" | "MEMBER" | null;
  workspaceId: number | null;
  workspaceName: string | null;
  createdAt: Date;
};

export type UpdateProfileInput = {
  nickname?: string;
  avatarKey?: string | null;
};

export class ProfileStorage {
  constructor(private db: ReturnType<typeof getDb>) {}

  async findProfileByUserId(userId: number): Promise<ProfileRecord | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
    });

    return {
      id: user.id,
      customId: user.customId,
      nickname: user.nickname,
      avatarKey: user.avatarKey,
      role: membership?.role ?? null,
      workspaceId: membership?.workspaceId ?? null,
      workspaceName: membership?.workspace?.name ?? null,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: number,
    input: UpdateProfileInput,
  ): Promise<ProfileRecord | null> {
    const [updated] = await this.db
      .update(users)
      .set(input)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return null;
    }

    const membership = await this.db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
    });

    return {
      id: updated.id,
      customId: updated.customId,
      nickname: updated.nickname,
      avatarKey: updated.avatarKey,
      role: membership?.role ?? null,
      workspaceId: membership?.workspaceId ?? null,
      workspaceName: membership?.workspace?.name ?? null,
      createdAt: updated.createdAt,
    };
  }
}
