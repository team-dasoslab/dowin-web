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
  | "searchAdminBillingWorkspaces"
  | "findWorkspaceBillingAdminDetail"
  | "listBillingEventsForWorkspace"
  | "getRecentBillingRiskSummaries"
  | "appendBillingEvent"
  | "upsertWorkspaceBillingState"
  | "updateWorkspaceBillingProjection"
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
    recentRefundCount: riskSummary.recentRefundCount,
    recentRevokedCount: riskSummary.recentRevokedCount,
    requiresManualReview: totalRiskEvents >= BILLING_RISK_REVIEW_THRESHOLD,
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
  };
}
