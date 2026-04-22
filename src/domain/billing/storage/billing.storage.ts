import { getDb } from "@/db";
import {
  billingEvents,
  billingCheckoutEvents,
  billingProviderProducts,
  workspaceBillingState,
  workspaces,
} from "@/db/schema";
import { and, desc, eq, gte, sql } from "drizzle-orm";

type Db = ReturnType<typeof getDb>;

export class BillingStorage {
  constructor(private db: Db) {}

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
    planCode: "STANDARD";
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

  async findCheckoutSessionCreatedEvent(workspaceId: number, requestId: string) {
    return (
      (await this.db.query.billingCheckoutEvents.findFirst({
        where: and(
          eq(billingCheckoutEvents.workspaceId, workspaceId),
          eq(billingCheckoutEvents.requestId, requestId),
          eq(billingCheckoutEvents.eventType, "CHECKOUT_SESSION_CREATED"),
        ),
        orderBy: [desc(billingCheckoutEvents.recordedAt)],
      })) ?? null
    );
  }

  async getRecentBillingRiskSummary(workspaceId: number, since: Date) {
    const [result] = await this.db
      .select({
        recentRefundCount:
          sql<number>`coalesce(sum(case when ${billingEvents.eventType} = 'order.refunded' then 1 else 0 end), 0)`,
        recentRevokedCount:
          sql<number>`coalesce(sum(case when ${billingEvents.eventType} = 'subscription.revoked' and ${billingEvents.failureReason} = 'RISK_REVIEW_SIGNAL' then 1 else 0 end), 0)`,
      })
      .from(billingEvents)
      .where(
        and(
          eq(billingEvents.workspaceId, workspaceId),
          eq(billingEvents.status, "ACCEPTED"),
          gte(billingEvents.occurredAt, since),
        ),
      );

    return {
      recentRefundCount: Number(result?.recentRefundCount ?? 0),
      recentRevokedCount: Number(result?.recentRevokedCount ?? 0),
    };
  }

  async appendBillingEvent(input: {
    workspaceId: number;
    providerEventId: string;
    eventType: string;
    subscriptionKey: string | null;
    customerKey: string | null;
    occurredAt: Date;
    payloadJson: string;
    status?: "ACCEPTED" | "IGNORED" | "FAILED";
    failureReason?: string | null;
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
        source: "WEBHOOK",
      })
      .returning();

    return event;
  }

  async appendCheckoutEvent(input: {
    workspaceId: number;
    requestedByUserId: number;
    requestId: string;
    targetPlanCode: "STANDARD";
    providerCheckoutId?: string | null;
    eventType:
      | "CHECKOUT_REQUESTED"
      | "CHECKOUT_SESSION_CREATED"
      | "CHECKOUT_FAILED";
    occurredAt: Date;
    payloadJson: string;
  }) {
    const result = await this.db
      .insert(billingCheckoutEvents)
      .values({
        workspaceId: input.workspaceId,
        requestedByUserId: input.requestedByUserId,
        requestId: input.requestId,
        targetPlanCode: input.targetPlanCode,
        provider: "POLAR",
        providerCheckoutId: input.providerCheckoutId ?? null,
        eventType: input.eventType,
        occurredAt: input.occurredAt,
        payloadJson: input.payloadJson,
      })
      .onConflictDoNothing()
      .returning();

    return result[0] ?? null;
  }

  async upsertWorkspaceBillingState(input: {
    workspaceId: number;
    billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
    planCode: "FREE" | "STANDARD";
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
        provider: "POLAR",
        billingStatus: input.billingStatus,
        planCode: input.planCode,
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
          provider: "POLAR",
          billingStatus: input.billingStatus,
          planCode: input.planCode,
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

  async updateWorkspaceBillingProjection(input: {
    workspaceId: number;
    planCode: "FREE" | "STANDARD";
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
