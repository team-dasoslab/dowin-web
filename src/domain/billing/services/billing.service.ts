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
  "findUserWorkspace" | "findMembershipByUserId"
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
  planCode: "FREE" | "STANDARD";
  billingStatus: "NONE" | "ACTIVE" | "CANCELED" | "EXPIRED" | "REVOKED";
  entitlementSource: NullableEntitlementSource;
  provider: "POLAR" | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingOwnerUserId: number | null;
  recentRefundCount: number;
  recentRevokedCount: number;
  requiresManualReview: boolean;
  canManageBilling: boolean;
};

type BillingPort = Pick<
  BillingStorage,
  | "findWorkspaceBillingState"
  | "findActiveProviderProduct"
  | "getRecentBillingRiskSummary"
  | "findCheckoutSessionCreatedEvent"
  | "appendCheckoutEvent"
>;

function readCheckoutUrl(payloadJson: string | null | undefined): string | null {
  if (!payloadJson) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadJson) as { checkoutUrl?: unknown };
    return typeof payload.checkoutUrl === "string" ? payload.checkoutUrl : null;
  } catch {
    return null;
  }
}

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

  async getMyBilling(userId: number): Promise<BillingOverview> {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    if (!workspace) {
      throw new NotFoundError("NOT_FOUND");
    }

    const membership = await this.workspaceStorage.findMembershipByUserId(userId);
    const billingState = await this.billingStorage.findWorkspaceBillingState(
      workspace.id,
    );
    const riskSummary = await this.getBillingRiskSummary(workspace.id);

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
      canManageBilling: membership?.role === "ADMIN",
    };
  }

  async prepareCheckout(
    userId: number,
    idempotencyKey: string,
    locale: "ko" | "en",
  ) {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    const membership = await this.workspaceStorage.findMembershipByUserId(userId);

    if (!workspace || !membership) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (membership.role !== "ADMIN") {
      throw new ForbiddenError("FORBIDDEN");
    }

    if (!this.polarClient) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const billingState = await this.billingStorage.findWorkspaceBillingState(
      workspace.id,
    );
    const riskSummary = await this.getBillingRiskSummary(workspace.id);

    if (
      billingState &&
      (billingState.billingStatus === "ACTIVE" ||
        billingState.billingStatus === "CANCELED")
    ) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    if (riskSummary.requiresManualReview) {
      throw new ConflictError("BILLING_REVIEW_REQUIRED");
    }

    const product = await this.billingStorage.findActiveProviderProduct({
      provider: "POLAR",
      environment: this.polarClient.environment,
      planCode: "STANDARD",
    });

    if (!product) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const existingCheckoutEvent =
      await this.billingStorage.findCheckoutSessionCreatedEvent(
        workspace.id,
        idempotencyKey,
      );
    const existingCheckoutUrl = readCheckoutUrl(
      existingCheckoutEvent?.payloadJson,
    );

    if (existingCheckoutUrl) {
      return { checkoutUrl: existingCheckoutUrl };
    }

    const occurredAt = new Date();

    await this.billingStorage.appendCheckoutEvent({
      workspaceId: workspace.id,
      requestedByUserId: userId,
      requestId: idempotencyKey,
      targetPlanCode: "STANDARD",
      eventType: "CHECKOUT_REQUESTED",
      occurredAt,
      payloadJson: JSON.stringify({ locale }),
    });

    try {
      const checkout = await this.polarClient.createCheckoutSession({
        productId: product.providerProductId,
        externalCustomerId:
          workspace.billingCustomerExternalRef ?? `workspace:${workspace.id}`,
        idempotencyKey,
        locale,
        metadata: {
          workspaceId: String(workspace.id),
          requestedByUserId: String(userId),
          targetPlanCode: "STANDARD",
        },
      });

      await this.billingStorage.appendCheckoutEvent({
        workspaceId: workspace.id,
        requestedByUserId: userId,
        requestId: idempotencyKey,
        targetPlanCode: "STANDARD",
        eventType: "CHECKOUT_SESSION_CREATED",
        occurredAt: new Date(),
        payloadJson: JSON.stringify(checkout),
      });

      const storedCheckoutEvent =
        await this.billingStorage.findCheckoutSessionCreatedEvent(
          workspace.id,
          idempotencyKey,
        );
      const storedCheckoutUrl = readCheckoutUrl(storedCheckoutEvent?.payloadJson);

      return {
        checkoutUrl: storedCheckoutUrl ?? checkout.checkoutUrl,
      };
    } catch (error) {
      await this.billingStorage.appendCheckoutEvent({
        workspaceId: workspace.id,
        requestedByUserId: userId,
        requestId: idempotencyKey,
        targetPlanCode: "STANDARD",
        eventType: "CHECKOUT_FAILED",
        occurredAt: new Date(),
        payloadJson: JSON.stringify({
          locale,
          message: error instanceof Error ? error.message : "unknown_error",
        }),
      });

      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  async getPortalUrl(userId: number): Promise<string> {
    const workspace = await this.workspaceStorage.findUserWorkspace(userId);
    const membership = await this.workspaceStorage.findMembershipByUserId(userId);
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
