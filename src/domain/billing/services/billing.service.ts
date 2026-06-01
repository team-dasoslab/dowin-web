import {
  type PolarBillingClient,
  isPolarRecoverableError,
} from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { type NullableEntitlementSource } from "@/domain/billing/types";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/server/errors";

type WorkspacePort = Pick<
  WorkspaceStorage,
  | "resolveIdByUid"
  | "findWorkspaceById"
  | "findMembership"
  | "findMembershipByUserId"
  | "countMembers"
  | "findSeatEntitlement"
>;
type BillingRiskSummary = {
  recentRefundCount: number;
  recentRevokedCount: number;
  requiresManualReview: boolean;
};

const BILLING_RISK_REVIEW_THRESHOLD = 2;
const BILLING_RISK_LOOKBACK_DAYS = 30;

export type BillingOverview = {
  workspaceId: string;
  workspaceName: string;
  planCode: "BASIC" | "FREE" | "STANDARD";
  billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  entitlementSource: NullableEntitlementSource;
  provider: "POLAR" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingOwnerUserId: number | null;
  recentRefundCount: number;
  recentRevokedCount: number;
  requiresManualReview: boolean;
  purchasedSeatCount: number | null;
  usedSeatCount: number;
  canManageBilling: boolean;
};

type BillingPort = Pick<
  BillingStorage,
  | "findWorkspaceBillingState"
  | "findActiveProviderProduct"
  | "getRecentBillingRiskSummary"
>;

function getBillingRiskLookbackStart(now: Date): Date {
  const lookback = new Date(now);
  lookback.setDate(lookback.getDate() - BILLING_RISK_LOOKBACK_DAYS);
  return lookback;
}

function getWorkspacePublicId(workspace: { id: number; uid: string | null }) {
  if (!workspace.uid) {
    throw new Error(`WORKSPACE_UID_MISSING:${workspace.id}`);
  }

  return workspace.uid;
}

export class BillingService {
  constructor(
    private workspaceStorage: WorkspacePort,
    private billingStorage: BillingPort,
    private polarClient: PolarBillingClient | null = null,
  ) {}

  private async getWorkspace(workspaceUid: string, userId: number) {
    const internalId = await this.workspaceStorage.resolveIdByUid(workspaceUid);
    if (!internalId) {
      throw new NotFoundError("NOT_FOUND");
    }

    const membership = await this.workspaceStorage.findMembership(internalId, userId);
    if (!membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    const workspace = await this.workspaceStorage.findWorkspaceById(internalId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    return { workspace, membership };
  }

  async getMyBilling(workspaceUid: string, userId: number): Promise<BillingOverview> {
    const { workspace, membership } = await this.getWorkspace(workspaceUid, userId);
    const billingState = await this.billingStorage.findWorkspaceBillingState(
      workspace.id,
    );
    const [riskSummary, seatEntitlement, usedSeatCount] = await Promise.all([
      this.getBillingRiskSummary(workspace.id),
      this.workspaceStorage.findSeatEntitlement(workspace.id),
      this.workspaceStorage.countMembers(workspace.id),
    ]);

    return {
      workspaceId: getWorkspacePublicId(workspace),
      workspaceName: workspace.name,
      planCode: billingState?.planCode ?? workspace.planCode,
      billingStatus: billingState?.billingStatus ?? "NONE",
      entitlementSource: billingState?.entitlementSource ?? null,
      provider: billingState?.provider ?? null,
      currentPeriodEnd: billingState?.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: billingState?.cancelAtPeriodEnd ?? false,
      billingOwnerUserId: billingState?.billingOwnerUserId ?? null,
      recentRefundCount: riskSummary.recentRefundCount,
      recentRevokedCount: riskSummary.recentRevokedCount,
      requiresManualReview: riskSummary.requiresManualReview,
      purchasedSeatCount: seatEntitlement?.purchasedSeatCount ?? null,
      usedSeatCount,
      canManageBilling: membership?.role === "ADMIN",
    };
  }

  async getPortalUrl(workspaceUid: string, userId: number): Promise<string> {
    const { workspace, membership } = await this.getWorkspace(workspaceUid, userId);
    const billingState = workspace
      ? await this.billingStorage.findWorkspaceBillingState(workspace.id)
      : null;

    if (!workspace || !membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    if (!this.polarClient) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (billingState && billingState.entitlementSource !== "POLAR") {
      throw new ConflictError("BILLING_NOT_READY");
    }

    try {
      const customerSessionInput = billingState?.customerKey
        ? { customerId: billingState.customerKey }
        : {
            externalCustomerId:
              workspace.billingCustomerExternalRef ?? `workspace:${workspace.id}`,
          };
      const { customerPortalUrl } =
        await this.polarClient.createCustomerSession(customerSessionInput);
      return customerPortalUrl;
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  async startBasicCheckout(input: {
    workspaceUid: string;
    userId: number;
    seatCount?: number;
    locale: "ko" | "en";
    idempotencyKey: string;
  }): Promise<{ checkoutUrl: string; checkoutId: string | null }> {
    const { workspace, membership } = await this.getWorkspace(
      input.workspaceUid,
      input.userId,
    );

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const riskSummary = await this.getBillingRiskSummary(workspace.id);
    if (riskSummary.requiresManualReview) {
      throw new ConflictError("BILLING_REVIEW_REQUIRED");
    }

    const billingState = await this.billingStorage.findWorkspaceBillingState(
      workspace.id,
    );
    const billingStatus = billingState?.billingStatus ?? "NONE";

    if (billingStatus === "REVOKED") {
      throw new ConflictError("BILLING_REVIEW_REQUIRED");
    }

    if (billingStatus !== "NONE" && billingStatus !== "EXPIRED") {
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (billingState && billingState.entitlementSource !== "POLAR") {
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (!this.polarClient) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const product = await this.billingStorage.findActiveProviderProduct({
      provider: "POLAR",
      environment: this.polarClient.environment,
      planCode: "BASIC",
    });

    if (!product) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const memberCount = await this.workspaceStorage.countMembers(workspace.id);
    const seatCount = input.seatCount ?? Math.max(memberCount, 1);
    if (seatCount < memberCount) {
      throw new ForbiddenError("WORKSPACE_SEAT_LIMIT_EXCEEDED");
    }

    try {
      return await this.polarClient.createCheckoutSession({
        productId: product.providerProductId,
        externalCustomerId:
          workspace.billingCustomerExternalRef ?? `workspace:${workspace.id}`,
        idempotencyKey: input.idempotencyKey,
        locale: input.locale,
        seats: seatCount,
        successPath: "/billing/polar/success",
        metadata: {
          flow: "workspace_resubscribe",
          workspaceId: String(workspace.id),
          workspaceUid: getWorkspacePublicId(workspace),
          requestedByUserId: String(input.userId),
          targetPlanCode: "BASIC",
          requestedSeatCount: String(seatCount),
        },
      });
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  private async getBillingRiskSummary(
    workspaceId: number,
  ): Promise<BillingRiskSummary> {
    const { recentRefundCount, recentRevokedCount } =
      await this.billingStorage.getRecentBillingRiskSummary(
        workspaceId,
        getBillingRiskLookbackStart(new Date()),
      );
    const totalRiskEvents = recentRefundCount + recentRevokedCount;

    return {
      recentRefundCount,
      recentRevokedCount,
      requiresManualReview: totalRiskEvents >= BILLING_RISK_REVIEW_THRESHOLD,
    };
  }
}
