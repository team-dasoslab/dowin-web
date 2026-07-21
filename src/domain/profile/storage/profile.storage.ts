import { type WorkspaceRole } from "@/domain/workspace/types";
import {
  users,
  workspaceBillingState,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { getDb } from "@/db";
import { and, eq, isNull, sql } from "drizzle-orm";

export type ProfileRecord = {
  id: number;
  customId: string;
  nickname: string;
  avatarKey: string | null;
  locale: string;
  role: WorkspaceRole | null;
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
    role: WorkspaceRole;
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
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.role, "ADMIN"),
          isNull(workspaces.deletedAt),
        ),
      );

    return Number(result?.count ?? 0);
  }

  async deleteUser(userId: number): Promise<void> {
    await this.db
      .update(workspaces)
      .set({ billingOwnerUserId: null })
      .where(eq(workspaces.billingOwnerUserId, userId));

    await this.db
      .update(workspaceBillingState)
      .set({ billingOwnerUserId: null })
      .where(eq(workspaceBillingState.billingOwnerUserId, userId));

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
    const result = await this.db
      .select({ member: workspaceMembers })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(eq(workspaceMembers.userId, userId), isNull(workspaces.deletedAt)))
      .orderBy(workspaceMembers.createdAt, workspaceMembers.id)
      .limit(1);

    return result[0]?.member ?? null;
  }
}
