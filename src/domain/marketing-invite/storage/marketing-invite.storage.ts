import { getDb } from "@/db";
import {
  marketingInviteCodes,
  marketingInviteRedemptions,
  workspaceBillingState,
  workspaceMembers,
  workspaceSeatEntitlements,
  workspaces,
} from "@/db/schema";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";

type Db = ReturnType<typeof getDb>;
type MarketingInviteCode = typeof marketingInviteCodes.$inferSelect;
type MarketingInviteRedemption = typeof marketingInviteRedemptions.$inferSelect;

const generateWorkspaceUid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  12,
);

export class MarketingInviteStorage {
  constructor(private db: Db) {}

  async listCodes(): Promise<MarketingInviteCode[]> {
    return await this.db.query.marketingInviteCodes.findMany({
      orderBy: [desc(marketingInviteCodes.id)],
    });
  }

  async findCodeById(id: number): Promise<MarketingInviteCode | null> {
    return (
      (await this.db.query.marketingInviteCodes.findFirst({
        where: eq(marketingInviteCodes.id, id),
      })) ?? null
    );
  }

  async findCodeByCode(code: string): Promise<MarketingInviteCode | null> {
    return (
      (await this.db.query.marketingInviteCodes.findFirst({
        where: eq(marketingInviteCodes.code, code),
      })) ?? null
    );
  }

  async findCodeDetail(id: number) {
    const code = await this.findCodeById(id);
    if (!code) {
      return null;
    }

    const redemptions = await this.listRedemptionsByCodeId(id);
    return { ...code, redemptions };
  }

  async listRedemptionsByCodeId(
    codeId: number,
  ): Promise<MarketingInviteRedemption[]> {
    return await this.db.query.marketingInviteRedemptions.findMany({
      where: eq(marketingInviteRedemptions.marketingInviteCodeId, codeId),
      orderBy: [desc(marketingInviteRedemptions.id)],
    });
  }

  async createCode(input: {
    code: string;
    campaignName: string;
    description: string | null;
    maxUses: number;
    grantedSeatCount: number;
    createdByAdminUserId: number;
  }): Promise<MarketingInviteCode> {
    const now = new Date();
    const [created] = await this.db
      .insert(marketingInviteCodes)
      .values({
        ...input,
        entitlementSource: "BETA_PROMOTIONAL_GRANT",
        updatedAt: now,
      })
      .returning();
    return created;
  }

  async updateCode(
    id: number,
    input: {
      campaignName?: string;
      description?: string | null;
      maxUses?: number;
      grantedSeatCount?: number;
      status?: "ACTIVE" | "INACTIVE";
    },
  ): Promise<MarketingInviteCode | null> {
    const [updated] = await this.db
      .update(marketingInviteCodes)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(marketingInviteCodes.id, id))
      .returning();

    return updated ?? null;
  }

  async findRedemptionByCodeAndUser(input: {
    codeId: number;
    userId: number;
  }): Promise<MarketingInviteRedemption | null> {
    return (
      (await this.db.query.marketingInviteRedemptions.findFirst({
        where: and(
          eq(
            marketingInviteRedemptions.marketingInviteCodeId,
            input.codeId,
          ),
          eq(marketingInviteRedemptions.redeemedByUserId, input.userId),
        ),
      })) ?? null
    );
  }

  async findMembershipByUserId(
    userId: number,
  ): Promise<{ id: number; workspaceId: number } | null> {
    return (
      (await this.db.query.workspaceMembers.findFirst({
        columns: {
          id: true,
          workspaceId: true,
        },
        where: eq(workspaceMembers.userId, userId),
      })) ?? null
    );
  }

  async updateRedemptionFeedback(
    id: number,
    input: {
      feedbackStatus: "NOT_REQUESTED" | "REQUESTED" | "RECEIVED" | "DROPPED";
      operatorNote: string | null;
    },
  ): Promise<MarketingInviteRedemption | null> {
    const [updated] = await this.db
      .update(marketingInviteRedemptions)
      .set(input)
      .where(eq(marketingInviteRedemptions.id, id))
      .returning();

    return updated ?? null;
  }

  async redeemCodeForWorkspace(input: {
    code: MarketingInviteCode;
    userId: number;
    workspaceName: string;
    now: Date;
  }): Promise<{ workspaceUid: string; redemption: MarketingInviteRedemption } | null> {
    const [updatedCode] = await this.db
      .update(marketingInviteCodes)
      .set({
        usedCount: sql`${marketingInviteCodes.usedCount} + 1`,
        updatedAt: input.now,
      })
      .where(
        and(
          eq(marketingInviteCodes.id, input.code.id),
          eq(marketingInviteCodes.status, "ACTIVE"),
          lt(marketingInviteCodes.usedCount, marketingInviteCodes.maxUses),
        ),
      )
      .returning({ id: marketingInviteCodes.id });

    if (!updatedCode) {
      return null;
    }

    let workspaceId: number | null = null;

    try {
      const [workspace] = await this.db
        .insert(workspaces)
        .values({
          uid: generateWorkspaceUid(),
          name: input.workspaceName,
          planCode: "BASIC",
          billingCustomerExternalRef: `beta-promotion:${input.code.code}`,
          billingOwnerUserId: input.userId,
        })
        .returning();
      workspaceId = workspace.id;

      await this.db.insert(workspaceMembers).values({
        workspaceId: workspace.id,
        userId: input.userId,
        role: "ADMIN",
      });

      await this.db.insert(workspaceBillingState).values({
        workspaceId: workspace.id,
        provider: null,
        billingStatus: "ACTIVE",
        planCode: "BASIC",
        entitlementSource: "BETA_PROMOTIONAL_GRANT",
        customerKey: null,
        subscriptionKey: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        billingOwnerUserId: input.userId,
        lastEventId: null,
        lastEventOccurredAt: input.now,
        updatedAt: input.now,
      });

      await this.db.insert(workspaceSeatEntitlements).values({
        workspaceId: workspace.id,
        planCode: "BASIC",
        purchasedSeatCount: input.code.grantedSeatCount,
        seatSource: "BETA_PROMOTIONAL_GRANT",
        updatedAt: input.now,
      });

      const [redemption] = await this.db
        .insert(marketingInviteRedemptions)
        .values({
          marketingInviteCodeId: input.code.id,
          redeemedByUserId: input.userId,
          workspaceId: workspace.id,
          redeemedAt: input.now,
          feedbackStatus: "NOT_REQUESTED",
          acquisitionSource: "MARKETING_INVITE",
          campaignName: input.code.campaignName,
          operatorNote: null,
        })
        .returning();

      return {
        workspaceUid: workspace.uid ?? String(workspace.id),
        redemption,
      };
    } catch (error) {
      await this.db
        .update(marketingInviteCodes)
        .set({
          usedCount: sql`${marketingInviteCodes.usedCount} - 1`,
          updatedAt: input.now,
        })
        .where(
          and(
            eq(marketingInviteCodes.id, input.code.id),
            gt(marketingInviteCodes.usedCount, 0),
          ),
        );

      if (workspaceId !== null) {
        await this.db.delete(workspaces).where(eq(workspaces.id, workspaceId));
      }

      throw error;
    }
  }
}
