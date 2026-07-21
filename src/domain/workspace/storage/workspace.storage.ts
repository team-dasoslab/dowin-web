import { getDb } from "@/db";
import {
  billingPlanLimits,
  pendingWorkspaceCheckouts,
  users,
  workspaceBillingState,
  workspaceInvites,
  workspaceMembers,
  workspaceSeatEntitlements,
  workspaceTags,
  workspaces,
} from "@/db/schema";
import { type BillingPlanCode } from "@/domain/billing/types";
import { type WorkspaceRole } from "@/domain/workspace/types";
import { generateWorkspacePrefix } from "@/domain/workspace/utils/workspace-prefix.util";
import { and, desc, eq, gt, inArray, isNull, lt, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const generateUid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

type Db = ReturnType<typeof getDb>;
type Workspace = typeof workspaces.$inferSelect;
type WorkspaceMember = typeof workspaceMembers.$inferSelect;
type WorkspaceInvite = typeof workspaceInvites.$inferSelect;
type WorkspaceTag = typeof workspaceTags.$inferSelect;
type WorkspaceMemberWithUser = WorkspaceMember & {
  user: typeof users.$inferSelect;
};
type WorkspaceMembershipWithWorkspace = WorkspaceMember & {
  workspace: Workspace;
};

export class WorkspaceStorage {
  constructor(private db: Db) {}

  async getAccessContextData(workspaceId: number, userId: number) {
    const result = await this.db
      .select({
        workspace: workspaces,
        member: workspaceMembers,
        billingState: workspaceBillingState,
      })
      .from(workspaces)
      .innerJoin(
        workspaceMembers,
        and(eq(workspaces.id, workspaceMembers.workspaceId), eq(workspaceMembers.userId, userId)),
      )
      .leftJoin(workspaceBillingState, eq(workspaces.id, workspaceBillingState.workspaceId))
      .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)))
      .limit(1);

    return result[0] ?? null;
  }

  async findAccessibleWorkspaceByUid(uid: string, userId: number) {
    const result = await this.db
      .select({ workspace: workspaces })
      .from(workspaces)
      .innerJoin(
        workspaceMembers,
        and(eq(workspaces.id, workspaceMembers.workspaceId), eq(workspaceMembers.userId, userId)),
      )
      .where(and(eq(workspaces.uid, uid), isNull(workspaces.deletedAt)))
      .limit(1);

    return result[0]?.workspace ?? null;
  }

  async findWorkspaceById(workspaceId: number): Promise<Workspace | null> {
    return (
      (await this.db.query.workspaces.findFirst({
        where: and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)),
      })) ?? null
    );
  }

  async resolveIdByUid(uid: string): Promise<number | null> {
    const workspace = await this.db.query.workspaces.findFirst({
      where: and(eq(workspaces.uid, uid), isNull(workspaces.deletedAt)),
      columns: { id: true },
    });
    return workspace?.id ?? null;
  }

  async findUserWorkspace(userId: number): Promise<Workspace | null> {
    const result = await this.db
      .select({ workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(eq(workspaceMembers.userId, userId), isNull(workspaces.deletedAt)))
      .orderBy(workspaceMembers.createdAt, workspaceMembers.id)
      .limit(1);

    return result[0]?.workspace ?? null;
  }

  async createWorkspace(name: string): Promise<Workspace> {
    const uid = generateUid();
    const actionItemPrefix = await generateWorkspacePrefix(this.db, name);
    const [newWorkspace] = await this.db
      .insert(workspaces)
      .values({ name, uid, actionItemPrefix })
      .returning();
    return newWorkspace;
  }

  async findActivePendingWorkspaceCheckoutByUserId(userId: number, now: Date) {
    return (
      (await this.db.query.pendingWorkspaceCheckouts.findFirst({
        where: and(
          eq(pendingWorkspaceCheckouts.userId, userId),
          inArray(pendingWorkspaceCheckouts.status, ["PENDING", "CHECKOUT_CREATED"]),
          gt(pendingWorkspaceCheckouts.expiresAt, now),
        ),
        orderBy: [desc(pendingWorkspaceCheckouts.createdAt)],
      })) ?? null
    );
  }

  async findPendingWorkspaceCheckoutByRequestId(requestId: string) {
    return (
      (await this.db.query.pendingWorkspaceCheckouts.findFirst({
        where: eq(pendingWorkspaceCheckouts.requestId, requestId),
      })) ?? null
    );
  }

  async findPendingWorkspaceCheckoutByUid(uid: string) {
    return (
      (await this.db.query.pendingWorkspaceCheckouts.findFirst({
        where: eq(pendingWorkspaceCheckouts.uid, uid),
      })) ?? null
    );
  }

  async createPendingWorkspaceCheckout(input: {
    uid: string;
    requestId: string;
    userId: number;
    locale: "ko" | "en";
    workspaceName: string;
    requestedSeatCount: number;
    targetPlanCode: "BASIC";
    provider: "POLAR";
    providerProductId: string;
    expiresAt: Date;
  }) {
    const [created] = await this.db.insert(pendingWorkspaceCheckouts).values(input).returning();

    return created;
  }

  async markPendingWorkspaceCheckoutCreated(
    id: number,
    input: {
      providerCheckoutId: string | null;
      checkoutUrl: string;
    },
  ) {
    const [updated] = await this.db
      .update(pendingWorkspaceCheckouts)
      .set({
        status: "CHECKOUT_CREATED",
        providerCheckoutId: input.providerCheckoutId,
        checkoutUrl: input.checkoutUrl,
        updatedAt: new Date(),
      })
      .where(eq(pendingWorkspaceCheckouts.id, id))
      .returning();

    return updated ?? null;
  }

  async markPendingWorkspaceCheckoutFailed(id: number) {
    const [updated] = await this.db
      .update(pendingWorkspaceCheckouts)
      .set({
        status: "FAILED",
        updatedAt: new Date(),
      })
      .where(eq(pendingWorkspaceCheckouts.id, id))
      .returning();

    return updated ?? null;
  }

  async provisionCompletedWorkspaceCheckout(input: {
    pendingId: number;
    pendingUid: string;
    userId: number;
    workspaceName: string;
    purchasedSeatCount: number;
    customerKey: string | null;
    subscriptionKey: string | null;
    now: Date;
  }) {
    const actionItemPrefix = await generateWorkspacePrefix(this.db, input.workspaceName);

    return await this.db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({
          uid: generateUid(),
          name: input.workspaceName,
          actionItemPrefix,
          planCode: "BASIC",
          billingCustomerExternalRef: `workspace-checkout:${input.pendingUid}`,
          billingOwnerUserId: input.userId,
        })
        .returning();

      await tx.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: input.userId,
        role: "ADMIN",
      });

      await tx.insert(workspaceBillingState).values({
        workspaceId: workspace.id,
        provider: "POLAR",
        billingStatus: "ACTIVE",
        planCode: "BASIC",
        entitlementSource: "POLAR",
        customerKey: input.customerKey,
        subscriptionKey: input.subscriptionKey,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId: input.userId,
        lastEventId: null,
        lastEventOccurredAt: input.now,
        updatedAt: input.now,
      });

      await tx.insert(workspaceSeatEntitlements).values({
        workspaceId: workspace.id,
        planCode: "BASIC",
        purchasedSeatCount: input.purchasedSeatCount,
        seatSource: "POLAR",
        updatedAt: input.now,
      });

      await tx
        .update(pendingWorkspaceCheckouts)
        .set({
          status: "COMPLETED",
          completedWorkspaceId: workspace.id,
          completedAt: input.now,
          updatedAt: input.now,
        })
        .where(eq(pendingWorkspaceCheckouts.id, input.pendingId));

      return workspace;
    });
  }

  async updateWorkspace(
    workspaceId: number,
    data: { name: string; allowPastDailyLogEdit?: boolean },
  ): Promise<Workspace | null> {
    const [updatedWorkspace] = await this.db
      .update(workspaces)
      .set(data)
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return updatedWorkspace ?? null;
  }

  async addMember(workspaceId: number, userId: number, role: WorkspaceRole): Promise<void> {
    await this.db.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role,
    });
  }

  async findMembershipByUserId(userId: number): Promise<WorkspaceMember | null> {
    const result = await this.db
      .select({ member: workspaceMembers })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(eq(workspaceMembers.userId, userId), isNull(workspaces.deletedAt)))
      .orderBy(workspaceMembers.createdAt, workspaceMembers.id)
      .limit(1);

    return result[0]?.member ?? null;
  }

  async listUserWorkspaces(userId: number): Promise<WorkspaceMembershipWithWorkspace[]> {
    const rows = await this.db
      .select({ member: workspaceMembers, workspace: workspaces })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(and(eq(workspaceMembers.userId, userId), isNull(workspaces.deletedAt)))
      .orderBy(workspaceMembers.createdAt, workspaceMembers.id);

    return rows.map((row) => ({
      ...row.member,
      workspace: row.workspace,
    }));
  }

  async findMembershipById(
    workspaceId: number,
    membershipId: number,
  ): Promise<WorkspaceMember | null> {
    const result = await this.db
      .select({ member: workspaceMembers })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.id, membershipId),
          isNull(workspaces.deletedAt),
        ),
      )
      .limit(1);

    return result[0]?.member ?? null;
  }

  async findMembership(workspaceId: number, userId: number): Promise<WorkspaceMember | null> {
    const result = await this.db
      .select({ member: workspaceMembers })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, userId),
          isNull(workspaces.deletedAt),
        ),
      )
      .limit(1);

    return result[0]?.member ?? null;
  }

  async findMembers(workspaceId: number): Promise<WorkspaceMemberWithUser[]> {
    return await this.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: {
        user: true,
      },
    });
  }

  async updateMemberCheckinDates(
    workspaceId: number,
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    await this.db
      .update(workspaceMembers)
      .set({
        checkinStreakStartDate: startDate,
        checkinStreakEndDate: endDate,
      })
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
      );
  }

  async countMembers(workspaceId: number): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return Number(result?.count ?? 0);
  }

  async findPlanLimit(planCode: BillingPlanCode) {
    return (
      (await this.db.query.billingPlanLimits.findFirst({
        where: eq(billingPlanLimits.planCode, planCode),
      })) ?? null
    );
  }

  async findBillingState(workspaceId: number) {
    return (
      (await this.db.query.workspaceBillingState.findFirst({
        where: eq(workspaceBillingState.workspaceId, workspaceId),
      })) ?? null
    );
  }

  async findSeatEntitlement(workspaceId: number) {
    return (
      (await this.db.query.workspaceSeatEntitlements.findFirst({
        where: eq(workspaceSeatEntitlements.workspaceId, workspaceId),
      })) ?? null
    );
  }

  async removeMemberById(workspaceId: number, membershipId: number): Promise<void> {
    await this.db
      .delete(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.id, membershipId)),
      );
  }

  async updateMemberRole(workspaceId: number, userId: number, role: WorkspaceRole): Promise<void> {
    await this.db
      .update(workspaceMembers)
      .set({ role })
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)),
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
    await this.db
      .update(workspaces)
      .set({ deletedAt: new Date() })
      .where(and(eq(workspaces.id, workspaceId), isNull(workspaces.deletedAt)));
  }

  async createInvite(input: {
    workspaceId: number;
    code: string;
    maxUses: number;
    createdByUserId: number;
  }): Promise<WorkspaceInvite> {
    const [invite] = await this.db.insert(workspaceInvites).values(input).returning();
    return invite;
  }

  async findInviteByCode(code: string): Promise<WorkspaceInvite | null> {
    return (
      (await this.db.query.workspaceInvites.findFirst({
        where: eq(workspaceInvites.code, code),
      })) ?? null
    );
  }

  async findInviteById(workspaceId: number, inviteId: number): Promise<WorkspaceInvite | null> {
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

  async findTagById(workspaceId: number, tagId: number): Promise<WorkspaceTag | null> {
    return (
      (await this.db.query.workspaceTags.findFirst({
        where: and(eq(workspaceTags.workspaceId, workspaceId), eq(workspaceTags.id, tagId)),
      })) ?? null
    );
  }

  async findTagsByIds(workspaceId: number, tagIds: number[]): Promise<WorkspaceTag[]> {
    if (tagIds.length === 0) {
      return [];
    }

    return await this.db.query.workspaceTags.findMany({
      where: and(eq(workspaceTags.workspaceId, workspaceId), inArray(workspaceTags.id, tagIds)),
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
      .where(and(eq(workspaceTags.workspaceId, workspaceId), eq(workspaceTags.id, tagId)))
      .returning();

    return tag ?? null;
  }

  async deleteTag(workspaceId: number, tagId: number): Promise<void> {
    await this.db
      .delete(workspaceTags)
      .where(and(eq(workspaceTags.workspaceId, workspaceId), eq(workspaceTags.id, tagId)));
  }

  async updateInviteStatus(
    workspaceId: number,
    inviteId: number,
    status: "ACTIVE" | "INACTIVE",
  ): Promise<WorkspaceInvite | null> {
    const [invite] = await this.db
      .update(workspaceInvites)
      .set({ status })
      .where(and(eq(workspaceInvites.workspaceId, workspaceId), eq(workspaceInvites.id, inviteId)))
      .returning();

    return invite ?? null;
  }

  async addMemberByInvite(input: {
    inviteId: number;
    workspaceId: number;
    userId: number;
  }): Promise<boolean> {
    const { inviteId, workspaceId, userId } = input;

    return await this.db.transaction(async (tx) => {
      const [updatedInvite] = await tx
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

      await tx.insert(workspaceMembers).values({
        workspaceId,
        userId,
        role: "MEMBER",
      });
      return true;
    });
  }
}
