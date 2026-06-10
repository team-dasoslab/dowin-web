import { nanoid } from "nanoid";
import { getDb } from "@/db";
import {
  billingEvents,
  billingProviderProducts,
  billingRetentionRecords,
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

  async appendBillingRetentionRecord(input: {
    billingEventId: number | null;
    providerEventId: string | null;
    eventType: string;
    eventOccurredAt: Date;
    workspaceIdSnapshot: number | null;
    workspaceUidSnapshot?: string | null;
    workspaceNameSnapshot?: string | null;
    billingOwnerUserIdSnapshot?: number | null;
    planCode: "BASIC" | "FREE" | "STANDARD";
    seatCount?: number | null;
    currency?: string | null;
    amount?: number | null;
    taxAmount?: number | null;
    taxRate?: string | null;
    taxJurisdiction?: string | null;
    customerKey?: string | null;
    subscriptionKey?: string | null;
    checkoutId?: string | null;
    orderId?: string | null;
    invoiceId?: string | null;
    paymentId?: string | null;
    receiptUrl?: string | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    paidAt?: Date | null;
    refundedAt?: Date | null;
    canceledAt?: Date | null;
    termsVersion?: string | null;
    privacyPolicyVersion?: string | null;
    billingPolicyVersion?: string | null;
    checkoutNoticeVersion?: string | null;
    autoRenewalNoticeAcceptedAt?: Date | null;
    ipCountry?: string | null;
    billingCountry?: string | null;
    taxEvidenceSource?: string | null;
    normalizedPayloadJson: string;
    legalRetentionUntil: Date;
    legalHold?: boolean;
  }) {
    const [record] = await this.db
      .insert(billingRetentionRecords)
      .values({
        uid: nanoid(),
        provider: "POLAR",
        providerEventId: input.providerEventId,
        billingEventId: input.billingEventId,
        eventType: input.eventType,
        eventOccurredAt: input.eventOccurredAt,
        workspaceIdSnapshot: input.workspaceIdSnapshot,
        workspaceUidSnapshot: input.workspaceUidSnapshot ?? null,
        workspaceNameSnapshot: input.workspaceNameSnapshot ?? null,
        billingOwnerUserIdSnapshot: input.billingOwnerUserIdSnapshot ?? null,
        planCode: input.planCode,
        seatCount: input.seatCount ?? null,
        currency: input.currency ?? null,
        amount: input.amount ?? null,
        taxAmount: input.taxAmount ?? null,
        taxRate: input.taxRate ?? null,
        taxJurisdiction: input.taxJurisdiction ?? null,
        customerKey: input.customerKey ?? null,
        subscriptionKey: input.subscriptionKey ?? null,
        checkoutId: input.checkoutId ?? null,
        orderId: input.orderId ?? null,
        invoiceId: input.invoiceId ?? null,
        paymentId: input.paymentId ?? null,
        receiptUrl: input.receiptUrl ?? null,
        currentPeriodStart: input.currentPeriodStart ?? null,
        currentPeriodEnd: input.currentPeriodEnd ?? null,
        paidAt: input.paidAt ?? null,
        refundedAt: input.refundedAt ?? null,
        canceledAt: input.canceledAt ?? null,
        termsVersion: input.termsVersion ?? null,
        privacyPolicyVersion: input.privacyPolicyVersion ?? null,
        billingPolicyVersion: input.billingPolicyVersion ?? null,
        checkoutNoticeVersion: input.checkoutNoticeVersion ?? null,
        autoRenewalNoticeAcceptedAt:
          input.autoRenewalNoticeAcceptedAt ?? null,
        ipCountry: input.ipCountry ?? null,
        billingCountry: input.billingCountry ?? null,
        taxEvidenceSource: input.taxEvidenceSource ?? null,
        normalizedPayloadJson: input.normalizedPayloadJson,
        legalRetentionUntil: input.legalRetentionUntil,
        legalHold: input.legalHold ?? false,
      })
      .onConflictDoNothing()
      .returning();

    return record ?? null;
  }

  async recordPolarWebhookBillingEvent(input: {
    event: {
      workspaceId: number;
      providerEventId: string;
      eventType: string;
      subscriptionKey: string | null;
      customerKey: string | null;
      occurredAt: Date;
      payloadJson: string;
      status: "ACCEPTED" | "IGNORED" | "FAILED";
      failureReason: string | null;
    };
    retention: Omit<
      Parameters<BillingStorage["appendBillingRetentionRecord"]>[0],
      "billingEventId"
    >;
    projection?: {
      billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
      planCode: "BASIC" | "FREE" | "STANDARD";
      entitlementSource: NullableEntitlementSource;
      customerKey: string | null;
      subscriptionKey: string | null;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
      billingOwnerUserId: number | null;
      lastEventOccurredAt: Date;
      workspaceBillingCustomerExternalRef: string | null;
      workspaceBillingOwnerUserId: number | null;
      purchasedSeatCount?: number | null;
    };
  }) {
    return this.db.transaction(async (tx) => {
      const [event] = await tx
        .insert(billingEvents)
        .values({
          workspaceId: input.event.workspaceId,
          provider: "POLAR",
          providerEventId: input.event.providerEventId,
          eventType: input.event.eventType,
          subscriptionKey: input.event.subscriptionKey,
          customerKey: input.event.customerKey,
          occurredAt: input.event.occurredAt,
          payloadJson: input.event.payloadJson,
          status: input.event.status,
          failureReason: input.event.failureReason,
          source: "WEBHOOK",
        })
        .onConflictDoNothing()
        .returning();

      if (!event) {
        return null;
      }

      await tx
        .insert(billingRetentionRecords)
        .values({
          uid: nanoid(),
          provider: "POLAR",
          providerEventId: input.retention.providerEventId,
          billingEventId: event.id,
          eventType: input.retention.eventType,
          eventOccurredAt: input.retention.eventOccurredAt,
          workspaceIdSnapshot: input.retention.workspaceIdSnapshot,
          workspaceUidSnapshot: input.retention.workspaceUidSnapshot ?? null,
          workspaceNameSnapshot: input.retention.workspaceNameSnapshot ?? null,
          billingOwnerUserIdSnapshot:
            input.retention.billingOwnerUserIdSnapshot ?? null,
          planCode: input.retention.planCode,
          seatCount: input.retention.seatCount ?? null,
          currency: input.retention.currency ?? null,
          amount: input.retention.amount ?? null,
          taxAmount: input.retention.taxAmount ?? null,
          taxRate: input.retention.taxRate ?? null,
          taxJurisdiction: input.retention.taxJurisdiction ?? null,
          customerKey: input.retention.customerKey ?? null,
          subscriptionKey: input.retention.subscriptionKey ?? null,
          checkoutId: input.retention.checkoutId ?? null,
          orderId: input.retention.orderId ?? null,
          invoiceId: input.retention.invoiceId ?? null,
          paymentId: input.retention.paymentId ?? null,
          receiptUrl: input.retention.receiptUrl ?? null,
          currentPeriodStart: input.retention.currentPeriodStart ?? null,
          currentPeriodEnd: input.retention.currentPeriodEnd ?? null,
          paidAt: input.retention.paidAt ?? null,
          refundedAt: input.retention.refundedAt ?? null,
          canceledAt: input.retention.canceledAt ?? null,
          termsVersion: input.retention.termsVersion ?? null,
          privacyPolicyVersion: input.retention.privacyPolicyVersion ?? null,
          billingPolicyVersion: input.retention.billingPolicyVersion ?? null,
          checkoutNoticeVersion: input.retention.checkoutNoticeVersion ?? null,
          autoRenewalNoticeAcceptedAt:
            input.retention.autoRenewalNoticeAcceptedAt ?? null,
          ipCountry: input.retention.ipCountry ?? null,
          billingCountry: input.retention.billingCountry ?? null,
          taxEvidenceSource: input.retention.taxEvidenceSource ?? null,
          normalizedPayloadJson: input.retention.normalizedPayloadJson,
          legalRetentionUntil: input.retention.legalRetentionUntil,
          legalHold: input.retention.legalHold ?? false,
        })
        .onConflictDoNothing();

      if (!input.projection) {
        return event;
      }

      await tx
        .insert(workspaceBillingState)
        .values({
          workspaceId: input.event.workspaceId,
          provider: this.resolveProviderFromEntitlementSource(
            input.projection.entitlementSource,
          ),
          billingStatus: input.projection.billingStatus,
          planCode: input.projection.planCode,
          entitlementSource: input.projection.entitlementSource,
          customerKey: input.projection.customerKey,
          subscriptionKey: input.projection.subscriptionKey,
          currentPeriodEnd: input.projection.currentPeriodEnd,
          cancelAtPeriodEnd: input.projection.cancelAtPeriodEnd,
          billingOwnerUserId: input.projection.billingOwnerUserId,
          lastEventId: event.id,
          lastEventOccurredAt: input.projection.lastEventOccurredAt,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: workspaceBillingState.workspaceId,
          set: {
            provider: this.resolveProviderFromEntitlementSource(
              input.projection.entitlementSource,
            ),
            billingStatus: input.projection.billingStatus,
            planCode: input.projection.planCode,
            entitlementSource: input.projection.entitlementSource,
            customerKey: input.projection.customerKey,
            subscriptionKey: input.projection.subscriptionKey,
            currentPeriodEnd: input.projection.currentPeriodEnd,
            cancelAtPeriodEnd: input.projection.cancelAtPeriodEnd,
            billingOwnerUserId: input.projection.billingOwnerUserId,
            lastEventId: event.id,
            lastEventOccurredAt: input.projection.lastEventOccurredAt,
            updatedAt: new Date(),
          },
        });

      if (input.projection.purchasedSeatCount !== undefined) {
        await tx
          .insert(workspaceSeatEntitlements)
          .values({
            workspaceId: input.event.workspaceId,
            planCode: "BASIC",
            purchasedSeatCount: input.projection.purchasedSeatCount ?? 0,
            seatSource: "POLAR",
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: workspaceSeatEntitlements.workspaceId,
            set: {
              purchasedSeatCount: input.projection.purchasedSeatCount ?? 0,
              seatSource: "POLAR",
              updatedAt: new Date(),
            },
          });
      }

      await tx
        .update(workspaces)
        .set({
          planCode: input.projection.planCode,
          billingCustomerExternalRef:
            input.projection.workspaceBillingCustomerExternalRef,
          billingOwnerUserId: input.projection.workspaceBillingOwnerUserId,
        })
        .where(eq(workspaces.id, input.event.workspaceId));

      return event;
    });
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
    seatSource: "POLAR" | "MANUAL_GRANT" | "BETA_PROMOTIONAL_GRANT";
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
