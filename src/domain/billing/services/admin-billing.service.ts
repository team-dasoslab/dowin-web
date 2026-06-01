import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import {
  type EntitlementSource,
  type NullableEntitlementSource,
} from "@/domain/billing/types";
import { AuditLogStorage } from "@/domain/audit/storage/audit-log.storage";
import { NotFoundError } from "@/lib/server/errors";

type BillingState =
  | "NONE"
  | "ACTIVE"
  | "CANCELED"
  | "EXPIRED"
  | "REVOKED";
type PlanCode = "BASIC" | "FREE" | "STANDARD";

type BillingPort = Pick<
  BillingStorage,
  | "listProviderProducts"
  | "upsertProviderProduct"
  | "searchAdminBillingWorkspaces"
  | "findWorkspaceBillingAdminDetail"
  | "listBillingEventsForWorkspace"
  | "getRecentBillingRiskSummaries"
  | "appendBillingEvent"
  | "upsertWorkspaceBillingState"
  | "upsertWorkspaceSeatEntitlement"
  | "updateWorkspaceBillingProjection"
  | "countWorkspaceMembers"
>;
type AuditLogPort = Pick<AuditLogStorage, "create">;

const BILLING_RISK_REVIEW_THRESHOLD = 2;
const BILLING_RISK_LOOKBACK_DAYS = 30;

type AdminBillingWorkspaceBase = {
  workspaceId: number;
  workspaceName: string;
  planCode: PlanCode;
  billingStatus: BillingState;
  entitlementSource: NullableEntitlementSource;
  provider: "POLAR" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingOwnerUserId: number | null;
  customerKey: string | null;
  subscriptionKey: string | null;
  billingCustomerExternalRef: string | null;
  lastEventOccurredAt: string | null;
  updatedAt: string | null;
  purchasedSeatCount: number | null;
  recentRefundCount: number;
  recentRevokedCount: number;
  requiresManualReview: boolean;
};

export type AdminBillingWorkspaceSummary = AdminBillingWorkspaceBase;

export type AdminBillingWorkspaceDetail = AdminBillingWorkspaceBase & {
  events: Array<{
    id: number;
    provider: "POLAR";
    providerEventId: string | null;
    eventType: string;
    subscriptionKey: string | null;
    customerKey: string | null;
    occurredAt: string;
    recordedAt: string;
    status: "ACCEPTED" | "IGNORED" | "FAILED";
    failureReason: string | null;
    source: "WEBHOOK" | "RECONCILIATION" | "MANUAL_CORRECTION";
  }>;
};

export type AdminBillingProviderProduct = {
  id: number;
  provider: "POLAR";
  environment: "sandbox" | "production";
  planCode: "BASIC" | "STANDARD";
  providerProductId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type BillingWorkspaceSearchResult = Awaited<
  ReturnType<BillingStorage["searchAdminBillingWorkspaces"]>
>[number];
type BillingWorkspaceDetailResult = NonNullable<
  Awaited<ReturnType<BillingStorage["findWorkspaceBillingAdminDetail"]>>
>;

export class AdminBillingService {
  constructor(
    private billingStorage: BillingPort,
    private auditLogStorage: AuditLogPort,
  ) {}

  async listProviderProducts(): Promise<AdminBillingProviderProduct[]> {
    const products = await this.billingStorage.listProviderProducts();
    return products.map(toAdminBillingProviderProduct);
  }

  async upsertProviderProduct(
    adminUserId: number,
    input: {
      provider: "POLAR";
      environment: "sandbox" | "production";
      planCode: "BASIC" | "STANDARD";
      providerProductId: string;
      isActive?: boolean;
      changeReason: string;
    },
  ): Promise<AdminBillingProviderProduct> {
    const product = await this.billingStorage.upsertProviderProduct({
      provider: input.provider,
      environment: input.environment,
      planCode: input.planCode,
      providerProductId: input.providerProductId,
      isActive: input.isActive ?? true,
    });

    await this.auditLogStorage.create({
      actorType: "ADMIN",
      actorAdminUserId: adminUserId,
      entityType: "BILLING_PROVIDER_PRODUCT",
      entityId: product.id,
      actionType: "UPDATE",
      metadata: JSON.stringify({
        domain: "BILLING",
        reason: input.changeReason,
        provider: input.provider,
        environment: input.environment,
        planCode: input.planCode,
        providerProductId: input.providerProductId,
        isActive: input.isActive ?? true,
      }),
    });

    return toAdminBillingProviderProduct(product);
  }

  async listWorkspaces(filters?: {
    workspaceId?: number;
    workspaceName?: string;
  }): Promise<AdminBillingWorkspaceSummary[]> {
    const workspaces =
      await this.billingStorage.searchAdminBillingWorkspaces(filters);
    return this.attachRiskSummary(workspaces);
  }

  async getWorkspaceDetail(
    workspaceId: number,
  ): Promise<AdminBillingWorkspaceDetail> {
    const workspace =
      await this.billingStorage.findWorkspaceBillingAdminDetail(workspaceId);

    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const [summary] = await this.attachRiskSummary([workspace]);
    const events =
      await this.billingStorage.listBillingEventsForWorkspace(workspaceId);

    return {
      ...summary,
      events: events.map((event) => ({
        id: event.id,
        provider: event.provider,
        providerEventId: event.providerEventId ?? null,
        eventType: event.eventType,
        subscriptionKey: event.subscriptionKey ?? null,
        customerKey: event.customerKey ?? null,
        occurredAt: event.occurredAt.toISOString(),
        recordedAt: event.recordedAt.toISOString(),
        status: event.status,
        failureReason: event.failureReason ?? null,
        source: event.source,
      })),
    };
  }

  async applyManualOverride(
    adminUserId: number,
    workspaceId: number,
    input: {
      planCode: PlanCode;
      billingStatus: BillingState;
      entitlementSource?: NullableEntitlementSource;
      customerKey?: string | null;
      subscriptionKey?: string | null;
      currentPeriodEnd?: string | null;
      cancelAtPeriodEnd?: boolean;
      billingOwnerUserId?: number | null;
      purchasedSeatCount?: number | null;
      changeReason: string;
    },
  ): Promise<AdminBillingWorkspaceDetail> {
    const existing =
      await this.billingStorage.findWorkspaceBillingAdminDetail(workspaceId);

    if (!existing) {
      throw new NotFoundError("NOT_FOUND");
    }

    const occurredAt = new Date();
    const currentPeriodEnd = input.currentPeriodEnd
      ? new Date(input.currentPeriodEnd)
      : null;
    const nextEntitlementSource =
      input.entitlementSource !== undefined
        ? input.entitlementSource
        : input.planCode === "BASIC" || input.planCode === "STANDARD"
          ? ("MANUAL_GRANT" as EntitlementSource)
          : existing.entitlementSource ?? null;
    const nextBillingOwnerUserId =
      input.billingOwnerUserId !== undefined
        ? input.billingOwnerUserId
        : existing.billingOwnerUserId ?? null;
    const shouldApplySeatEntitlement =
      input.planCode === "BASIC" &&
      (input.billingStatus === "ACTIVE" || input.billingStatus === "CANCELED");
    const memberCount = shouldApplySeatEntitlement
      ? await this.billingStorage.countWorkspaceMembers(workspaceId)
      : 0;
    const nextPurchasedSeatCount = shouldApplySeatEntitlement
      ? Math.max(input.purchasedSeatCount ?? memberCount, memberCount, 1)
      : input.purchasedSeatCount === null
        ? 0
        : null;
    const event = await this.billingStorage.appendBillingEvent({
      workspaceId,
      providerEventId: null,
      eventType: "admin.manual_override",
      subscriptionKey: normalizeNullableText(input.subscriptionKey),
      customerKey: normalizeNullableText(input.customerKey),
      occurredAt,
      payloadJson: JSON.stringify({
        actorAdminUserId: adminUserId,
        reason: input.changeReason,
        previousState: snapshotBillingState(existing),
        nextState: {
          planCode: input.planCode,
          billingStatus: input.billingStatus,
          entitlementSource: nextEntitlementSource,
          customerKey: normalizeNullableText(input.customerKey),
          subscriptionKey: normalizeNullableText(input.subscriptionKey),
          currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
          billingOwnerUserId: nextBillingOwnerUserId,
          purchasedSeatCount: nextPurchasedSeatCount,
        },
      }),
      status: "ACCEPTED",
      failureReason: null,
      source: "MANUAL_CORRECTION",
    });

    await this.billingStorage.upsertWorkspaceBillingState({
      workspaceId,
      billingStatus: input.billingStatus,
      planCode: input.planCode,
      entitlementSource: nextEntitlementSource,
      customerKey: normalizeNullableText(input.customerKey),
      subscriptionKey: normalizeNullableText(input.subscriptionKey),
      currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
      billingOwnerUserId: nextBillingOwnerUserId,
      lastEventId: event.id,
      lastEventOccurredAt: occurredAt,
    });

    await this.billingStorage.updateWorkspaceBillingProjection({
      workspaceId,
      planCode: input.planCode,
      billingCustomerExternalRef: existing.billingCustomerExternalRef ?? null,
      billingOwnerUserId: nextBillingOwnerUserId,
    });

    if (nextPurchasedSeatCount !== null) {
      await this.billingStorage.upsertWorkspaceSeatEntitlement({
        workspaceId,
        purchasedSeatCount: nextPurchasedSeatCount,
        seatSource: "MANUAL_GRANT",
      });
    }

    await this.auditLogStorage.create({
      actorType: "ADMIN",
      actorAdminUserId: adminUserId,
      workspaceId,
      entityType: "WORKSPACE",
      entityId: workspaceId,
      actionType: "UPDATE",
      metadata: JSON.stringify({
        domain: "BILLING",
        reason: input.changeReason,
        previousState: snapshotBillingState(existing),
        nextState: {
          planCode: input.planCode,
          billingStatus: input.billingStatus,
          entitlementSource: nextEntitlementSource,
          customerKey: normalizeNullableText(input.customerKey),
          subscriptionKey: normalizeNullableText(input.subscriptionKey),
          currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
          billingOwnerUserId: nextBillingOwnerUserId,
          purchasedSeatCount: nextPurchasedSeatCount,
        },
      }),
    });

    return this.getWorkspaceDetail(workspaceId);
  }

  private async attachRiskSummary(
    workspaces: BillingWorkspaceSearchResult[] | BillingWorkspaceDetailResult[],
  ): Promise<AdminBillingWorkspaceSummary[]> {
    if (workspaces.length === 0) {
      return [];
    }

    const riskByWorkspaceId = await this.billingStorage.getRecentBillingRiskSummaries(
      workspaces.map((workspace) => workspace.workspaceId),
      getBillingRiskLookbackStart(new Date()),
    );

    return workspaces.map((workspace) =>
      toAdminBillingWorkspaceSummary(
        workspace,
        riskByWorkspaceId.get(workspace.workspaceId) ?? {
          recentRefundCount: 0,
          recentRevokedCount: 0,
        },
      ),
    );
  }
}

function toAdminBillingWorkspaceSummary(
  workspace: BillingWorkspaceSearchResult | BillingWorkspaceDetailResult,
  riskSummary: {
    recentRefundCount: number;
    recentRevokedCount: number;
  },
): AdminBillingWorkspaceSummary {
  const totalRiskEvents =
    riskSummary.recentRefundCount + riskSummary.recentRevokedCount;

  return {
    workspaceId: workspace.workspaceId,
    workspaceName: workspace.workspaceName,
    planCode: workspace.planCode,
    billingStatus: workspace.billingStatus,
    entitlementSource: workspace.entitlementSource ?? null,
    provider: workspace.provider,
    currentPeriodEnd: workspace.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: workspace.cancelAtPeriodEnd,
    billingOwnerUserId: workspace.billingOwnerUserId ?? null,
    customerKey: workspace.customerKey ?? null,
    subscriptionKey: workspace.subscriptionKey ?? null,
    billingCustomerExternalRef: workspace.billingCustomerExternalRef ?? null,
    lastEventOccurredAt: workspace.lastEventOccurredAt?.toISOString() ?? null,
    updatedAt: workspace.updatedAt?.toISOString() ?? null,
    purchasedSeatCount: workspace.purchasedSeatCount ?? null,
    recentRefundCount: riskSummary.recentRefundCount,
    recentRevokedCount: riskSummary.recentRevokedCount,
    requiresManualReview: totalRiskEvents >= BILLING_RISK_REVIEW_THRESHOLD,
  };
}

function toAdminBillingProviderProduct(product: {
  id: number;
  provider: "POLAR";
  environment: "sandbox" | "production";
  planCode: "BASIC" | "STANDARD";
  providerProductId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AdminBillingProviderProduct {
  return {
    id: product.id,
    provider: product.provider,
    environment: product.environment,
    planCode: product.planCode,
    providerProductId: product.providerProductId,
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

function getBillingRiskLookbackStart(now: Date): Date {
  const lookback = new Date(now);
  lookback.setDate(lookback.getDate() - BILLING_RISK_LOOKBACK_DAYS);
  return lookback;
}

function normalizeNullableText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function snapshotBillingState(
  workspace: BillingWorkspaceDetailResult,
): Record<string, unknown> {
  return {
    planCode: workspace.planCode,
    billingStatus: workspace.billingStatus,
    entitlementSource: workspace.entitlementSource ?? null,
    provider: workspace.provider,
    currentPeriodEnd: workspace.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: workspace.cancelAtPeriodEnd,
    billingOwnerUserId: workspace.billingOwnerUserId ?? null,
    customerKey: workspace.customerKey ?? null,
    subscriptionKey: workspace.subscriptionKey ?? null,
    billingCustomerExternalRef: workspace.billingCustomerExternalRef ?? null,
    lastEventOccurredAt: workspace.lastEventOccurredAt?.toISOString() ?? null,
    updatedAt: workspace.updatedAt?.toISOString() ?? null,
    purchasedSeatCount: workspace.purchasedSeatCount ?? null,
  };
}
