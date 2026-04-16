import { getDb } from "@/db";
import {
  users,
  workspaceInvites,
  workspaceMembers,
  workspaceTags,
  workspaces,
} from "@/db/schema";
import { and, eq, gt, inArray, lt, sql } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;
type Workspace = typeof workspaces.$inferSelect;
type WorkspaceMember = typeof workspaceMembers.$inferSelect;
type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
type WorkspaceTag = typeof workspaceTags.$inferSelect;
type WorkspaceMemberWithUser = WorkspaceMember & {
  user: typeof users.$inferSelect;
};

export class WorkspaceStorage {
  constructor(private db: Db) {}

  async findWorkspaceById(workspaceId: number): Promise<Workspace | null> {
    return (
      (await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, workspaceId),
      })) ?? null
    );
  }

  async findUserWorkspace(userId: number): Promise<Workspace | null> {
    const workspaceMember = await this.db.query.workspaceMembers.findFirst({
      where: eq(workspaceMembers.userId, userId),
      with: {
        workspace: true,
      },
    });
    return workspaceMember?.workspace ?? null;
  }

  async createWorkspace(name: string): Promise<Workspace> {
    const [newWorkspace] = await this.db
      .insert(workspaces)
      .values({ name })
      .returning();
    return newWorkspace;
  }

  async updateWorkspaceName(
    workspaceId: number,
    name: string,
  ): Promise<Workspace | null> {
    const [updatedWorkspace] = await this.db
      .update(workspaces)
      .set({ name })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return updatedWorkspace ?? null;
  }

  async addMember(
    workspaceId: number,
    userId: number,
    role: "ADMIN" | "MEMBER",
  ): Promise<void> {
    await this.db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role,
    });
  }

  async findMembershipByUserId(
    userId: number,
  ): Promise<WorkspaceMember | null> {
    return (
      (await this.db.query.workspaceMembers.findFirst({
        where: eq(workspaceMembers.userId, userId),
      })) ?? null
    );
  }

  async findMembershipById(
    workspaceId: number,
    membershipId: number,
  ): Promise<WorkspaceMember | null> {
    return (
      (await this.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, membershipId),
        ),
      })) ?? null
    );
  }

  async findMembership(
    workspaceId: number,
    userId: number,
  ): Promise<WorkspaceMember | null> {
    return (
      (await this.db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      })) ?? null
    );
  }

  async findMembers(workspaceId: number): Promise<WorkspaceMemberWithUser[]> {
    return await this.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: {
        user: true,
      },
    });
  }

  async countMembers(workspaceId: number): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return Number(result?.count ?? 0);
  }

  async removeMemberById(
    workspaceId: number,
    membershipId: number,
  ): Promise<void> {
    await this.db
      .delete(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, membershipId),
        ),
      );
  }

  async updateMemberRole(
    workspaceId: number,
    userId: number,
    role: "ADMIN" | "MEMBER",
  ): Promise<void> {
    await this.db
      .update(workspaceMembers)
      .set({ role })
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
        ),
      );
  }

  async transferAdmin(
    workspaceId: number,
    currentAdminUserId: number,
    nextAdminUserId: number,
  ): Promise<void> {
    await this.updateMemberRole(workspaceId, nextAdminUserId, "ADMIN");
    await this.updateMemberRole(workspaceId, currentAdminUserId, "MEMBER");
  }

  async deleteWorkspace(workspaceId: number): Promise<void> {
    await this.db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  }

  async createInvite(input: {
    workspaceId: number;
    code: string;
    maxUses: number;
    createdByUserId: number;
  }): Promise<WorkspaceInvite> {
    const [invite] = await this.db
      .insert(workspaceInvites)
      .values(input)
      .returning();
    return invite;
  }

  async findInviteByCode(code: string): Promise<WorkspaceInvite | null> {
    return (
      (await this.db.query.workspaceInvites.findFirst({
        where: eq(workspaceInvites.code, code),
      })) ?? null
    );
  }

  async findInviteById(
    workspaceId: number,
    inviteId: number,
  ): Promise<WorkspaceInvite | null> {
    return (
      (await this.db.query.workspaceInvites.findFirst({
        where: and(
          eq(workspaceInvites.workspaceId, workspaceId),
          eq(workspaceInvites.id, inviteId),
        ),
      })) ?? null
    );
  }

  async listInvites(workspaceId: number): Promise<WorkspaceInvite[]> {
    return await this.db.query.workspaceInvites.findMany({
      where: eq(workspaceInvites.workspaceId, workspaceId),
      orderBy: (invites, { desc }) => [desc(invites.id)],
    });
  }

  async listTags(workspaceId: number): Promise<WorkspaceTag[]> {
    return await this.db.query.workspaceTags.findMany({
      where: eq(workspaceTags.workspaceId, workspaceId),
      orderBy: (tags, { asc }) => [asc(tags.name)],
    });
  }

  async findTagById(
    workspaceId: number,
    tagId: number,
  ): Promise<WorkspaceTag | null> {
    return (
      (await this.db.query.workspaceTags.findFirst({
        where: and(
          eq(workspaceTags.workspaceId, workspaceId),
          eq(workspaceTags.id, tagId),
        ),
      })) ?? null
    );
  }

  async findTagsByIds(
    workspaceId: number,
    tagIds: number[],
  ): Promise<WorkspaceTag[]> {
    if (tagIds.length === 0) {
      return [];
    }

    return await this.db.query.workspaceTags.findMany({
      where: and(
        eq(workspaceTags.workspaceId, workspaceId),
        inArray(workspaceTags.id, tagIds),
      ),
    });
  }

  async createTag(input: {
    workspaceId: number;
    name: string;
    normalizedName: string;
    createdByUserId: number;
  }): Promise<WorkspaceTag> {
    const [tag] = await this.db.insert(workspaceTags).values(input).returning();
    return tag;
  }

  async updateTag(
    workspaceId: number,
    tagId: number,
    input: { name: string; normalizedName: string },
  ): Promise<WorkspaceTag | null> {
    const [tag] = await this.db
      .update(workspaceTags)
      .set(input)
      .where(
        and(
          eq(workspaceTags.workspaceId, workspaceId),
          eq(workspaceTags.id, tagId),
        ),
      )
      .returning();

    return tag ?? null;
  }

  async deleteTag(workspaceId: number, tagId: number): Promise<void> {
    await this.db
      .delete(workspaceTags)
      .where(
        and(
          eq(workspaceTags.workspaceId, workspaceId),
          eq(workspaceTags.id, tagId),
        ),
      );
  }

  async updateInviteStatus(
    workspaceId: number,
    inviteId: number,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<WorkspaceInvite | null> {
    const [invite] = await this.db
      .update(workspaceInvites)
      .set({ status })
      .where(
        and(
          eq(workspaceInvites.workspaceId, workspaceId),
          eq(workspaceInvites.id, inviteId),
        ),
      )
      .returning();

    return invite ?? null;
  }

  async addMemberByInvite(input: {
    inviteId: number;
    workspaceId: number;
    userId: number;
  }): Promise<boolean> {
    const { inviteId, workspaceId, userId } = input;

    const [updatedInvite] = await this.db
      .update(workspaceInvites)
      .set({
        usedCount: sql`${workspaceInvites.usedCount} + 1`,
      })
      .where(
        and(
          eq(workspaceInvites.id, inviteId),
          eq(workspaceInvites.workspaceId, workspaceId),
          eq(workspaceInvites.status, "ACTIVE"),
          lt(workspaceInvites.usedCount, workspaceInvites.maxUses),
        ),
      )
      .returning({
        id: workspaceInvites.id,
      });

    if (!updatedInvite) {
      return false;
    }

    try {
      await this.db.insert(workspaceMembers).values({
        workspaceId,
        userId,
        role: "MEMBER",
      });
      return true;
    } catch (error) {
      // Restore invite usage count when member insert fails after increment.
      await this.db
        .update(workspaceInvites)
        .set({
          usedCount: sql`${workspaceInvites.usedCount} - 1`,
        })
        .where(
          and(
            eq(workspaceInvites.id, inviteId),
            eq(workspaceInvites.workspaceId, workspaceId),
            gt(workspaceInvites.usedCount, 0),
          ),
        );
      throw error;
    }
  }
}
