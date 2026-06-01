import { getDb } from "@/db";
import {
  billingEvents,
  billingProviderProducts,
  workspaceBillingState,
  workspaceSeatEntitlements,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { type NullableEntitlementSource } from "@/domain/billing/types";
import { and, asc, desc, eq, gte, inArray, like, or, sql } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export class BillingStorage {
  constructor(private db: Db) {}

  private resolveProviderFromEntitlementSource(
    entitlementSource: NullableEntitlementSource,
  ): "POLAR" | null {
    return entitlementSource === "POLAR" ? "POLAR" : null;
  }

  async findWorkspaceBillingState(workspaceId: number) {
    return (
      (await this.db.query.workspaceBillingState.findFirst({
        where: eq(workspaceBillingState.workspaceId, workspaceId),
      })) ?? null
    );
  }

  async findBillingEventByProviderEventId(providerEventId: string) {
    return (
      (await this.db.query.billingEvents.findFirst({
        where: and(
          eq(billingEvents.provider, "POLAR"),
          eq(billingEvents.providerEventId, providerEventId),
        ),
      })) ?? null
    );
  }

  async findWorkspaceById(workspaceId: number) {
    return (
      (await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, workspaceId),
      })) ?? null
    );
  }

  async findWorkspaceByCustomerExternalRef(customerExternalRef: string) {
    return (
      (await this.db.query.workspaces.findFirst({
        where: eq(workspaces.billingCustomerExternalRef, customerExternalRef),
      })) ?? null
    );
  }

  async findActiveProviderProduct(input: {
    provider: "POLAR";
    environment: "sandbox" | "production";
    planCode: "BASIC" | "STANDARD";
  }) {
    return (
      (await this.db.query.billingProviderProducts.findFirst({
        where: and(
          eq(billingProviderProducts.provider, input.provider),
          eq(billingProviderProducts.environment, input.environment),
          eq(billingProviderProducts.planCode, input.planCode),
          eq(billingProviderProducts.isActive, true),
        ),
      })) ?? null
    );
  }

  async listProviderProducts() {
    return await this.db.query.billingProviderProducts.findMany({
      orderBy: [
        asc(billingProviderProducts.environment),
        asc(billingProviderProducts.planCode),
      ],
    });
  }

  async upsertProviderProduct(input: {
    provider: "POLAR";
    environment: "sandbox" | "production";
    planCode: "BASIC" | "STANDARD";
    providerProductId: string;
    isActive: boolean;
  }) {
    const now = new Date();
    const [product] = await this.db
      .insert(billingProviderProducts)
      .values({
        provider: input.provider,
        environment: input.environment,
        planCode: input.planCode,
        providerProductId: input.providerProductId,
        isActive: input.isActive,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          billingProviderProducts.provider,
          billingProviderProducts.environment,
          billingProviderProducts.planCode,
        ],
        set: {
          providerProductId: input.providerProductId,
          isActive: input.isActive,
          updatedAt: now,
        },
      })
      .returning();

    return product;
  }

  async getRecentBillingRiskSummary(input: {
    workspaceId: number;
    customerKey?: string | null;
    customerExternalRef?: string | null;
    billingOwnerUserId?: number | null;
    since: Date;
  }) {
    const scopeConditions = [
      eq(billingEvents.workspaceId, input.workspaceId),
      input.customerKey ? eq(billingEvents.customerKey, input.customerKey) : null,
      input.customerExternalRef
        ? eq(workspaces.billingCustomerExternalRef, input.customerExternalRef)
        : null,
      input.billingOwnerUserId
        ? or(
            eq(workspaces.billingOwnerUserId, input.billingOwnerUserId),
            eq(workspaceBillingState.billingOwnerUserId, input.billingOwnerUserId),
          )
        : null,
    ].filter((condition): condition is NonNullable<typeof condition> =>
      Boolean(condition),
    );

    const [result] = await this.db
      .select({
        recentRefundCount:
          sql<number>`coalesce(sum(case when ${billingEvents.eventType} = 'order.refunded' then 1 else 0 end), 0)`,
        recentRevokedCount:
          sql<number>`coalesce(sum(case when ${billingEvents.eventType} = 'subscription.revoked' and ${billingEvents.failureReason} = 'RISK_REVIEW_SIGNAL' then 1 else 0 end), 0)`,
      })
      .from(billingEvents)
      .leftJoin(workspaces, eq(billingEvents.workspaceId, workspaces.id))
      .leftJoin(
        workspaceBillingState,
        eq(billingEvents.workspaceId, workspaceBillingState.workspaceId),
      )
      .where(
        and(
          or(...scopeConditions),
          eq(billingEvents.status, "ACCEPTED"),
          gte(billingEvents.occurredAt, input.since),
        ),
      );

    return {
      recentRefundCount: Number(result?.recentRefundCount ?? 0),
      recentRevokedCount: Number(result?.recentRevokedCount ?? 0),
    };
  }

  async getRecentBillingRiskSummaries(workspaceIds: number[], since: Date) {
    if (workspaceIds.length === 0) {
      return new Map<
        number,
        { recentRefundCount: number; recentRevokedCount: number }
      >();
    }

    const results = await this.db
      .select({
        workspaceId: billingEvents.workspaceId,
        recentRefundCount:
          sql<number>`coalesce(sum(case when ${billingEvents.eventType} = 'order.refunded' then 1 else 0 end), 0)`,
        recentRevokedCount:
          sql<number>`coalesce(sum(case when ${billingEvents.eventType} = 'subscription.revoked' and ${billingEvents.failureReason} = 'RISK_REVIEW_SIGNAL' then 1 else 0 end), 0)`,
      })
      .from(billingEvents)
      .where(
        and(
          inArray(billingEvents.workspaceId, workspaceIds),
          eq(billingEvents.status, "ACCEPTED"),
          gte(billingEvents.occurredAt, since),
        ),
      )
      .groupBy(billingEvents.workspaceId);

    return new Map(
      results.map((result) => [
        result.workspaceId,
        {
          recentRefundCount: Number(result.recentRefundCount ?? 0),
          recentRevokedCount: Number(result.recentRevokedCount ?? 0),
        },
      ]),
    );
  }

  async searchAdminBillingWorkspaces(filters?: {
    workspaceId?: number;
    workspaceName?: string;
  }) {
    const conditions = [];

    if (filters?.workspaceId) {
      conditions.push(eq(workspaces.id, filters.workspaceId));
    }
    if (filters?.workspaceName) {
      conditions.push(like(workspaces.name, `%${filters.workspaceName}%`));
    }

    return this.db
      .select({
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        planCode: sql<"BASIC" | "FREE" | "STANDARD">`coalesce(${workspaceBillingState.planCode}, ${workspaces.planCode})`,
        billingStatus:
          sql<
            "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED"
          >`coalesce(${workspaceBillingState.billingStatus}, 'NONE')`,
        entitlementSource: workspaceBillingState.entitlementSource,
        provider: workspaceBillingState.provider,
        currentPeriodEnd: workspaceBillingState.currentPeriodEnd,
        cancelAtPeriodEnd: sql<boolean>`coalesce(${workspaceBillingState.cancelAtPeriodEnd}, false)`,
        billingOwnerUserId: sql<number | null>`coalesce(${workspaceBillingState.billingOwnerUserId}, ${workspaces.billingOwnerUserId})`,
        customerKey: workspaceBillingState.customerKey,
        subscriptionKey: workspaceBillingState.subscriptionKey,
        billingCustomerExternalRef: workspaces.billingCustomerExternalRef,
        lastEventOccurredAt: workspaceBillingState.lastEventOccurredAt,
        updatedAt: workspaceBillingState.updatedAt,
        purchasedSeatCount: workspaceSeatEntitlements.purchasedSeatCount,
      })
      .from(workspaces)
      .leftJoin(
        workspaceBillingState,
        eq(workspaces.id, workspaceBillingState.workspaceId),
      )
      .leftJoin(
        workspaceSeatEntitlements,
        eq(workspaces.id, workspaceSeatEntitlements.workspaceId),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(workspaces.id));
  }

  async findWorkspaceBillingAdminDetail(workspaceId: number) {
    const [workspace] = await this.db
      .select({
        workspaceId: workspaces.id,
        workspaceName: workspaces.name,
        planCode: sql<"BASIC" | "FREE" | "STANDARD">`coalesce(${workspaceBillingState.planCode}, ${workspaces.planCode})`,
        billingStatus:
          sql<
            "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED"
          >`coalesce(${workspaceBillingState.billingStatus}, 'NONE')`,
        entitlementSource: workspaceBillingState.entitlementSource,
        provider: workspaceBillingState.provider,
        currentPeriodEnd: workspaceBillingState.currentPeriodEnd,
        cancelAtPeriodEnd: sql<boolean>`coalesce(${workspaceBillingState.cancelAtPeriodEnd}, false)`,
        billingOwnerUserId: sql<number | null>`coalesce(${workspaceBillingState.billingOwnerUserId}, ${workspaces.billingOwnerUserId})`,
        customerKey: workspaceBillingState.customerKey,
        subscriptionKey: workspaceBillingState.subscriptionKey,
        billingCustomerExternalRef: workspaces.billingCustomerExternalRef,
        lastEventOccurredAt: workspaceBillingState.lastEventOccurredAt,
        updatedAt: workspaceBillingState.updatedAt,
        purchasedSeatCount: workspaceSeatEntitlements.purchasedSeatCount,
      })
      .from(workspaces)
      .leftJoin(
        workspaceBillingState,
        eq(workspaces.id, workspaceBillingState.workspaceId),
      )
      .leftJoin(
        workspaceSeatEntitlements,
        eq(workspaces.id, workspaceSeatEntitlements.workspaceId),
      )
      .where(eq(workspaces.id, workspaceId));

    return workspace ?? null;
  }

  async listBillingEventsForWorkspace(workspaceId: number, limit = 50) {
    return this.db.query.billingEvents.findMany({
      where: eq(billingEvents.workspaceId, workspaceId),
      orderBy: [desc(billingEvents.occurredAt), desc(billingEvents.id)],
      limit,
    });
  }

  async appendBillingEvent(input: {
    workspaceId: number;
    providerEventId: string | null;
    eventType: string;
    subscriptionKey: string | null;
    customerKey: string | null;
    occurredAt: Date;
    payloadJson: string;
    status?: "ACCEPTED" | "IGNORED" | "FAILED";
    failureReason?: string | null;
    source?: "WEBHOOK" | "RECONCILIATION" | "MANUAL_CORRECTION";
  }) {
    const [event] = await this.db
      .insert(billingEvents)
      .values({
        workspaceId: input.workspaceId,
        provider: "POLAR",
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        subscriptionKey: input.subscriptionKey,
        customerKey: input.customerKey,
        occurredAt: input.occurredAt,
        payloadJson: input.payloadJson,
        status: input.status ?? "ACCEPTED",
        failureReason: input.failureReason ?? null,
        source: input.source ?? "WEBHOOK",
      })
      .returning();

    return event;
  }

  async upsertWorkspaceBillingState(input: {
    workspaceId: number;
    billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
    planCode: "BASIC" | "FREE" | "STANDARD";
    entitlementSource: NullableEntitlementSource;
    customerKey: string | null;
    subscriptionKey: string | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    billingOwnerUserId: number | null;
    lastEventId: number;
    lastEventOccurredAt: Date;
  }) {
    await this.db
      .insert(workspaceBillingState)
      .values({
        workspaceId: input.workspaceId,
        provider: this.resolveProviderFromEntitlementSource(
          input.entitlementSource,
        ),
        billingStatus: input.billingStatus,
        planCode: input.planCode,
        entitlementSource: input.entitlementSource,
        customerKey: input.customerKey,
        subscriptionKey: input.subscriptionKey,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        billingOwnerUserId: input.billingOwnerUserId,
        lastEventId: input.lastEventId,
        lastEventOccurredAt: input.lastEventOccurredAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: workspaceBillingState.workspaceId,
        set: {
          provider: this.resolveProviderFromEntitlementSource(
            input.entitlementSource,
          ),
          billingStatus: input.billingStatus,
          planCode: input.planCode,
          entitlementSource: input.entitlementSource,
          customerKey: input.customerKey,
          subscriptionKey: input.subscriptionKey,
          currentPeriodEnd: input.currentPeriodEnd,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd,
          billingOwnerUserId: input.billingOwnerUserId,
          lastEventId: input.lastEventId,
          lastEventOccurredAt: input.lastEventOccurredAt,
          updatedAt: new Date(),
        },
      });
  }

  async upsertWorkspaceSeatEntitlement(input: {
    workspaceId: number;
    purchasedSeatCount: number;
    seatSource: "POLAR" | "MANUAL_GRANT";
  }) {
    await this.db
      .insert(workspaceSeatEntitlements)
      .values({
        workspaceId: input.workspaceId,
        planCode: "BASIC",
        purchasedSeatCount: input.purchasedSeatCount,
        seatSource: input.seatSource,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: workspaceSeatEntitlements.workspaceId,
        set: {
          purchasedSeatCount: input.purchasedSeatCount,
          seatSource: input.seatSource,
          updatedAt: new Date(),
        },
      });
  }

  async countWorkspaceMembers(workspaceId: number) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    return Number(result?.count ?? 0);
  }

  async updateWorkspaceBillingProjection(input: {
    workspaceId: number;
    planCode: "BASIC" | "FREE" | "STANDARD";
    billingCustomerExternalRef: string | null;
    billingOwnerUserId: number | null;
  }) {
    await this.db
      .update(workspaces)
      .set({
        planCode: input.planCode,
        billingCustomerExternalRef: input.billingCustomerExternalRef,
        billingOwnerUserId: input.billingOwnerUserId,
      })
      .where(eq(workspaces.id, input.workspaceId));
  }
}
