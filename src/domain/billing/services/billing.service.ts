import {
  type PolarBillingClient,
  getPolarApiErrorInfo,
  isPolarRecoverableError,
} from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import {
  type BillingPlanCode,
  type BillingStatus,
  type NullableEntitlementSource,
} from "@/domain/billing/types";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/server/errors";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";

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
const BASIC_CHECKOUT_MAX_SEATS = 999;

export type BillingOverview = {
  workspaceId: string;
  workspaceName: string;
  planCode: BillingPlanCode;
  billingStatus: BillingStatus;
  entitlementSource: NullableEntitlementSource;
  provider: "POLAR" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingOwnerUserId: number | null;
  recentRefundCount: number;
  recentRevokedCount: number;
  requiresManualReview: boolean;
  purchasedSeatCount: number | null;
  pendingSeatCount: number | null;
  pendingSeatEffectiveAt: string | null;
  usedSeatCount: number;
  canManageBilling: boolean;
  promotionalDurationDays?: number | null;
};

type BillingPort = Pick<
  BillingStorage,
  | "findWorkspaceBillingState"
  | "findActiveProviderProduct"
  | "getRecentBillingRiskSummary"
  | "upsertWorkspaceSeatEntitlement"
  | "findLatestPromotionalGrantDuration"
>;

type BillingRiskScope = {
  workspaceId: number;
  customerKey?: string | null;
  customerExternalRef?: string | null;
  billingOwnerUserId?: number | null;
};

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

function truncateForLog(value: string, maxLength = 1000): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export class BillingService {
  constructor(
    private workspaceStorage: WorkspacePort,
    private billingStorage: BillingPort,
    private polarClient: PolarBillingClient | null = null,
  ) {}

  async getMyBilling(context: WorkspaceAccessContext): Promise<BillingOverview> {
    const workspace = await this.workspaceStorage.findWorkspaceById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const billingState = await this.billingStorage.findWorkspaceBillingState(context.workspaceId);
    const [
      riskSummary,
      seatEntitlement,
      usedSeatCount,
      pendingSeatUpdate,
      promotionalDurationDays,
    ] = await Promise.all([
      this.getBillingRiskSummary({
        workspaceId: context.workspaceId,
        customerKey: billingState?.customerKey ?? null,
        customerExternalRef: workspace.billingCustomerExternalRef ?? null,
        billingOwnerUserId:
          billingState?.billingOwnerUserId ?? workspace.billingOwnerUserId ?? null,
      }),
      this.workspaceStorage.findSeatEntitlement(context.workspaceId),
      this.workspaceStorage.countMembers(context.workspaceId),
      this.getPendingSeatUpdate(billingState),
      billingState?.entitlementSource === "BETA_PROMOTIONAL_GRANT"
        ? this.billingStorage.findLatestPromotionalGrantDuration(workspace.id)
        : null,
    ]);

    const purchasedSeatCount = this.getAuthoritativePurchasedSeatCount(
      seatEntitlement?.purchasedSeatCount ?? null,
      pendingSeatUpdate?.seats ?? null,
    );

    if (
      purchasedSeatCount !== null &&
      purchasedSeatCount !== (seatEntitlement?.purchasedSeatCount ?? null)
    ) {
      await this.billingStorage.upsertWorkspaceSeatEntitlement({
        workspaceId: workspace.id,
        purchasedSeatCount,
        seatSource: "POLAR",
      });
    }

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
      purchasedSeatCount,
      pendingSeatCount: pendingSeatUpdate?.pendingSeats ?? null,
      pendingSeatEffectiveAt:
        pendingSeatUpdate?.pendingSeats !== null && pendingSeatUpdate?.pendingSeats !== undefined
          ? (billingState?.currentPeriodEnd?.toISOString() ?? null)
          : null,
      usedSeatCount,
      canManageBilling: context.role === "ADMIN",
      promotionalDurationDays: promotionalDurationDays ?? null,
    };
  }

  private async getPendingSeatUpdate(
    billingState: Awaited<ReturnType<BillingPort["findWorkspaceBillingState"]>>,
  ) {
    if (
      !this.polarClient ||
      billingState?.entitlementSource !== "POLAR" ||
      billingState.billingStatus !== "ACTIVE" ||
      !billingState.subscriptionKey
    ) {
      return null;
    }

    try {
      return await this.polarClient.getSubscriptionSeatUpdate({
        subscriptionId: billingState.subscriptionKey,
      });
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        return null;
      }

      throw error;
    }
  }

  private getAuthoritativePurchasedSeatCount(
    projectedSeatCount: number | null,
    polarSeatCount: number | null,
  ) {
    if (
      typeof polarSeatCount === "number" &&
      Number.isInteger(polarSeatCount) &&
      polarSeatCount > 0
    ) {
      return polarSeatCount;
    }

    return projectedSeatCount;
  }

  async getPortalUrl(context: WorkspaceAccessContext): Promise<string> {
    if (context.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const workspace = await this.workspaceStorage.findWorkspaceById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }
    const billingState = await this.billingStorage.findWorkspaceBillingState(context.workspaceId);

    if (!this.polarClient) {
      console.error("[billing.portal] Polar client is not configured", {
        workspaceId: context.workspaceId,
        userId: context.userId,
        hasBillingCustomerExternalRef: Boolean(workspace.billingCustomerExternalRef),
        billingStatus: billingState?.billingStatus ?? "NONE",
        entitlementSource: billingState?.entitlementSource ?? null,
      });
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (billingState && billingState.entitlementSource !== "POLAR") {
      console.warn("[billing.portal] non-Polar entitlement cannot open portal", {
        workspaceId: context.workspaceId,
        userId: context.userId,
        billingStatus: billingState.billingStatus,
        entitlementSource: billingState.entitlementSource,
      });
      throw new ConflictError("BILLING_NOT_READY");
    }

    const polarClient = this.polarClient;
    let polarOperation:
      | "customer_seats.list"
      | "customer_seats.assign"
      | "customer_sessions.create" = "customer_sessions.create";

    try {
      const subscriptionKey = billingState?.subscriptionKey ?? null;
      const customerKey = billingState?.customerKey ?? null;
      const memberId =
        subscriptionKey && customerKey
          ? await (async () => {
              polarOperation = "customer_seats.list";
              const existingMemberId = await polarClient.findSubscriptionSeatMemberId({
                subscriptionId: subscriptionKey,
              });
              if (existingMemberId) {
                return existingMemberId;
              }

              polarOperation = "customer_seats.assign";
              return polarClient.assignSubscriptionSeat({
                subscriptionId: subscriptionKey,
                customerId: customerKey,
              });
            })()
          : null;
      const customerSessionInput = billingState?.customerKey
        ? {
            customerId: billingState.customerKey,
            ...(memberId ? { memberId } : {}),
          }
        : {
            externalCustomerId: workspace.billingCustomerExternalRef ?? `workspace:${workspace.id}`,
          };

      const { customerPortalUrl } = await (async () => {
        polarOperation = "customer_sessions.create";
        return polarClient.createCustomerSession(customerSessionInput);
      })();
      return customerPortalUrl;
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        const polarError = getPolarApiErrorInfo(error);
        console.error("[billing.portal] Polar portal request failed", {
          workspaceId: context.workspaceId,
          userId: context.userId,
          polarOperation,
          billingStatus: billingState?.billingStatus ?? "NONE",
          entitlementSource: billingState?.entitlementSource ?? null,
          hasCustomerKey: Boolean(billingState?.customerKey),
          hasBillingCustomerExternalRef: Boolean(workspace.billingCustomerExternalRef),
          polarStatus: polarError?.status ?? null,
          polarBody: polarError ? truncateForLog(polarError.body) : null,
        });
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  async startBasicCheckout(
    context: WorkspaceAccessContext,
    input: {
      seatCount?: number;
      locale: "ko" | "en";
      idempotencyKey: string;
      returnPath?: string;
    },
  ): Promise<{ checkoutUrl: string; checkoutId: string | null }> {
    if (context.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const workspace = await this.workspaceStorage.findWorkspaceById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const billingState = await this.billingStorage.findWorkspaceBillingState(context.workspaceId);
    const billingStatus = billingState?.billingStatus ?? "NONE";

    const riskSummary = await this.getBillingRiskSummary({
      workspaceId: workspace.id,
      customerKey: billingState?.customerKey ?? null,
      customerExternalRef: workspace.billingCustomerExternalRef ?? null,
      billingOwnerUserId: billingState?.billingOwnerUserId ?? workspace.billingOwnerUserId ?? null,
    });
    if (riskSummary.requiresManualReview) {
      throw new ConflictError("BILLING_REVIEW_REQUIRED");
    }

    if (billingStatus === "REVOKED") {
      throw new ConflictError("BILLING_REVIEW_REQUIRED");
    }

    if (billingStatus !== "NONE" && billingStatus !== "EXPIRED") {
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
    const minSeatCount = Math.max(memberCount, 1);
    const seatCount = Math.max(input.seatCount ?? minSeatCount, minSeatCount);

    try {
      return await this.polarClient.createCheckoutSession({
        productId: product.providerProductId,
        externalCustomerId: workspace.billingCustomerExternalRef ?? `workspace:${workspace.id}`,
        idempotencyKey: input.idempotencyKey,
        locale: input.locale,
        seats: seatCount,
        minSeats: minSeatCount,
        maxSeats: BASIC_CHECKOUT_MAX_SEATS,
        successPath: "/billing/polar/success",
        returnPath: input.returnPath,
        metadata: {
          flow: "workspace_resubscribe",
          workspaceId: String(workspace.id),
          workspaceUid: getWorkspacePublicId(workspace),
          requestedByUserId: String(context.userId),
          targetPlanCode: "BASIC",
          requestedSeatCount: String(seatCount),
        },
      });
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        const polarError = getPolarApiErrorInfo(error);
        console.error("[billing.checkout] Polar checkout request failed", {
          workspaceId: context.workspaceId,
          userId: context.userId,
          billingStatus,
          entitlementSource: billingState?.entitlementSource ?? null,
          hasBillingCustomerExternalRef: Boolean(workspace.billingCustomerExternalRef),
          polarStatus: polarError?.status ?? null,
          polarBody: polarError ? truncateForLog(polarError.body) : null,
        });
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  async updateSubscriptionSeats(
    context: WorkspaceAccessContext,
    input: {
      seatCount: number;
    },
  ): Promise<{
    seatCount: number;
    appliedSeatCount: number | null;
    pendingSeatCount: number | null;
    effectiveTiming: "IMMEDIATE" | "NEXT_PERIOD" | "UNCHANGED";
  }> {
    if (context.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    const workspace = await this.workspaceStorage.findWorkspaceById(context.workspaceId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const billingState = await this.billingStorage.findWorkspaceBillingState(context.workspaceId);

    if (
      !billingState ||
      billingState.planCode !== "BASIC" ||
      billingState.billingStatus !== "ACTIVE" ||
      billingState.entitlementSource !== "POLAR" ||
      !billingState.subscriptionKey
    ) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (!this.polarClient) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const memberCount = await this.workspaceStorage.countMembers(workspace.id);
    if (input.seatCount < memberCount) {
      throw new ConflictError("BILLING_SEAT_COUNT_BELOW_MEMBER_COUNT");
    }

    const seatEntitlement = await this.workspaceStorage.findSeatEntitlement(workspace.id);
    const currentSeatCount = seatEntitlement?.purchasedSeatCount ?? null;

    if (!currentSeatCount) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (input.seatCount === currentSeatCount) {
      return {
        seatCount: input.seatCount,
        appliedSeatCount: currentSeatCount,
        pendingSeatCount: null,
        effectiveTiming: "UNCHANGED",
      };
    }

    const isSeatIncrease = input.seatCount > currentSeatCount;
    const prorationBehavior = isSeatIncrease ? "prorate" : "next_period";

    try {
      const result = await this.polarClient.updateSubscriptionSeats({
        subscriptionId: billingState.subscriptionKey,
        seatCount: input.seatCount,
        prorationBehavior,
      });
      const appliedSeatCount =
        typeof result.seats === "number" && Number.isInteger(result.seats) && result.seats > 0
          ? result.seats
          : null;

      if (appliedSeatCount !== null && appliedSeatCount !== currentSeatCount) {
        await this.billingStorage.upsertWorkspaceSeatEntitlement({
          workspaceId: workspace.id,
          purchasedSeatCount: appliedSeatCount,
          seatSource: "POLAR",
        });
      }

      return {
        seatCount: input.seatCount,
        appliedSeatCount,
        pendingSeatCount: result.pendingSeats,
        effectiveTiming: isSeatIncrease ? "IMMEDIATE" : "NEXT_PERIOD",
      };
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  private async getBillingRiskSummary(scope: BillingRiskScope): Promise<BillingRiskSummary> {
    const { recentRefundCount, recentRevokedCount } =
      await this.billingStorage.getRecentBillingRiskSummary({
        ...scope,
        since: getBillingRiskLookbackStart(new Date()),
      });
    const totalRiskEvents = recentRefundCount + recentRevokedCount;

    return {
      recentRefundCount,
      recentRevokedCount,
      requiresManualReview: totalRiskEvents >= BILLING_RISK_REVIEW_THRESHOLD,
    };
  }
}
