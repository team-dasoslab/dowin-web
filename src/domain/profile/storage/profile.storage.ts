import { getDb } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { getActiveWorkspaceIdFromCookies } from "@/lib/server/active-workspace";
import { and, eq } from "drizzle-orm";

export type ProfileRecord = {
  id: number;
  customId: string;
  nickname: string;
  avatarKey: string | null;
  locale: string;
  role: "ADMIN" | "MEMBER" | null;
  workspaceId: number | null;
  workspaceName: string | null;
  createdAt: Date;
};

export type UpdateProfileInput = {
  nickname?: string;
  avatarKey?: string | null;
  locale?: "ko" | "en";
};

export type ProfileDeletionContext = {
  id: number;
  passwordHash: string;
  membership: {
    id: number;
    workspaceId: number;
    role: "ADMIN" | "MEMBER";
  } | null;
};

export class ProfileStorage {
  constructor(private db: ReturnType<typeof getDb>) {}

  async findProfileByUserId(userId: number): Promise<ProfileRecord | null> {
    return this.findProfileRowByUserId(userId);
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

    return this.findProfileRowByUserId(userId);
  }

  async findDeletionContextByUserId(
    userId: number,
  ): Promise<ProfileDeletionContext | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return null;
    }

    const membership = await this.findCurrentMembershipByUserId(userId);

    return {
      id: user.id,
      passwordHash: user.passwordHash,
      membership: membership
        ? {
            id: membership.id,
            workspaceId: membership.workspaceId,
            role: membership.role,
          }
        : null,
    };
  }

  async countWorkspaceAdmins(workspaceId: number): Promise<number> {
    const members = await this.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
    });

    return members.filter((member) => member.role === "ADMIN").length;
  }

  async deleteUser(userId: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, userId));
  }

  private async findProfileRowByUserId(
    userId: number,
  ): Promise<ProfileRecord | null> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      return null;
    }

    const membership = await this.findCurrentMembershipByUserId(userId);
    const workspace = membership
      ? await this.db.query.workspaces.findFirst({
          where: eq(workspaces.id, membership.workspaceId),
        })
      : null;

    return {
      id: user.id,
      customId: user.customId,
      nickname: user.nickname,
      avatarKey: user.avatarKey,
      locale: user.locale,
      role: membership?.role ?? null,
      workspaceId: membership?.workspaceId ?? null,
      workspaceName: workspace?.name ?? null,
      createdAt: user.createdAt,
    };
  }

  private async findCurrentMembershipByUserId(userId: number) {
    const activeWorkspaceId = await getActiveWorkspaceIdFromCookies();
    const membership = activeWorkspaceId
      ? await this.db.query.workspaceMembers.findFirst({
          where: and(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.workspaceId, activeWorkspaceId),
          ),
        })
      : null;

    if (membership) {
      return membership;
    }

    return (
      (await this.db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.userId, userId),
        orderBy: (members, { asc }) => [asc(members.createdAt), asc(members.id)],
      })) ?? null
    );
  }
}
