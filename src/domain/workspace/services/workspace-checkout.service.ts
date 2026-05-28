import { nanoid } from "nanoid";
import {
  type PolarBillingClient,
  isPolarRecoverableError,
} from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { WorkspaceStorage } from "@/domain/workspace/storage/workspace.storage";
import { ConflictError, NotFoundError } from "@/lib/server/errors";

const WORKSPACE_CHECKOUT_EXPIRES_MS = 30 * 60 * 1000;

type WorkspacePort = Pick<
  WorkspaceStorage,
  | "findUserWorkspace"
  | "findActivePendingWorkspaceCheckoutByUserId"
  | "findPendingWorkspaceCheckoutByRequestId"
  | "findPendingWorkspaceCheckoutByUid"
  | "createPendingWorkspaceCheckout"
  | "markPendingWorkspaceCheckoutCreated"
  | "markPendingWorkspaceCheckoutFailed"
  | "provisionCompletedWorkspaceCheckout"
>;

type BillingPort = Pick<BillingStorage, "findActiveProviderProduct">;

function getWorkspacePublicId(workspace: { id: number; uid: string | null }) {
  if (!workspace.uid) {
    throw new Error(`WORKSPACE_UID_MISSING:${workspace.id}`);
  }

  return workspace.uid;
}

export class WorkspaceCheckoutService {
  constructor(
    private workspaceStorage: WorkspacePort,
    private billingStorage: BillingPort,
    private polarClient: PolarBillingClient | null,
  ) {}

  async prepareWorkspaceCheckout(input: {
    userId: number;
    workspaceName: string;
    seatCount: number;
    locale: "ko" | "en";
    idempotencyKey: string;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    const existingWorkspace = await this.workspaceStorage.findUserWorkspace(
      input.userId,
    );

    if (existingWorkspace) {
      throw new ConflictError("ALREADY_IN_WORKSPACE");
    }

    const existingByRequest =
      await this.workspaceStorage.findPendingWorkspaceCheckoutByRequestId(
        input.idempotencyKey,
      );

    if (existingByRequest) {
      if (
        existingByRequest.userId !== input.userId ||
        existingByRequest.expiresAt <= now
      ) {
        throw new ConflictError("WORKSPACE_CHECKOUT_ALREADY_PENDING");
      }

      if (existingByRequest.checkoutUrl) {
        return {
          workspaceCheckoutId: existingByRequest.uid,
          checkoutUrl: existingByRequest.checkoutUrl,
        };
      }
    }

    const activePending =
      await this.workspaceStorage.findActivePendingWorkspaceCheckoutByUserId(
        input.userId,
        now,
      );

    if (activePending?.checkoutUrl) {
      return {
        workspaceCheckoutId: activePending.uid,
        checkoutUrl: activePending.checkoutUrl,
      };
    }

    if (activePending) {
      throw new ConflictError("WORKSPACE_CHECKOUT_ALREADY_PENDING");
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

    const uid = nanoid();
    const pending = await this.workspaceStorage.createPendingWorkspaceCheckout({
      uid,
      requestId: input.idempotencyKey,
      userId: input.userId,
      locale: input.locale,
      workspaceName: input.workspaceName,
      requestedSeatCount: input.seatCount,
      targetPlanCode: "BASIC",
      provider: "POLAR",
      providerProductId: product.providerProductId,
      expiresAt: new Date(now.getTime() + WORKSPACE_CHECKOUT_EXPIRES_MS),
    });

    try {
      const checkout = await this.polarClient.createCheckoutSession({
        productId: product.providerProductId,
        externalCustomerId: `workspace-checkout:${pending.uid}`,
        idempotencyKey: input.idempotencyKey,
        locale: input.locale,
        seats: input.seatCount,
        successPath: "/workspace/checkout/success",
        workspaceCheckoutId: pending.uid,
        metadata: {
          flow: "workspace_setup",
          workspaceCheckoutId: pending.uid,
          userId: String(input.userId),
          targetPlanCode: "BASIC",
          requestedSeatCount: String(input.seatCount),
        },
      });

      const updated =
        await this.workspaceStorage.markPendingWorkspaceCheckoutCreated(
          pending.id,
          {
            providerCheckoutId: checkout.checkoutId,
            checkoutUrl: checkout.checkoutUrl,
          },
        );

      return {
        workspaceCheckoutId: updated?.uid ?? pending.uid,
        checkoutUrl: checkout.checkoutUrl,
      };
    } catch (error) {
      await this.workspaceStorage.markPendingWorkspaceCheckoutFailed(pending.id);

      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }

  async completeWorkspaceCheckout(input: {
    userId: number;
    workspaceCheckoutId: string;
    checkoutId: string;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    const pending =
      await this.workspaceStorage.findPendingWorkspaceCheckoutByUid(
        input.workspaceCheckoutId,
      );

    if (!pending) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (pending.userId !== input.userId) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (pending.status === "COMPLETED" && pending.completedWorkspaceId) {
      const workspace = await this.workspaceStorage.findUserWorkspace(
        input.userId,
      );
      if (!workspace) {
        throw new ConflictError("WORKSPACE_CHECKOUT_NOT_READY");
      }
      return { workspaceId: getWorkspacePublicId(workspace) };
    }

    if (pending.expiresAt <= now) {
      throw new ConflictError("WORKSPACE_CHECKOUT_NOT_READY");
    }

    if (
      pending.status !== "CHECKOUT_CREATED" ||
      !pending.providerCheckoutId ||
      pending.providerCheckoutId !== input.checkoutId
    ) {
      throw new ConflictError("WORKSPACE_CHECKOUT_NOT_READY");
    }

    if (!this.polarClient) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const checkout = await this.getVerifiedCheckout(input.checkoutId);

    if (
      checkout.status !== "succeeded" ||
      checkout.metadata.workspaceCheckoutId !== pending.uid ||
      checkout.metadata.flow !== "workspace_setup" ||
      checkout.externalCustomerId !== `workspace-checkout:${pending.uid}`
    ) {
      throw new ConflictError("WORKSPACE_CHECKOUT_NOT_READY");
    }

    const existingWorkspace = await this.workspaceStorage.findUserWorkspace(
      input.userId,
    );

    if (existingWorkspace) {
      throw new ConflictError("ALREADY_IN_WORKSPACE");
    }

    const workspace =
      await this.workspaceStorage.provisionCompletedWorkspaceCheckout({
        pendingId: pending.id,
        pendingUid: pending.uid,
        userId: pending.userId,
        workspaceName: pending.workspaceName,
        purchasedSeatCount: pending.requestedSeatCount,
        customerKey: checkout.customerKey,
        subscriptionKey: checkout.subscriptionKey,
        now,
      });

    return { workspaceId: getWorkspacePublicId(workspace) };
  }

  private async getVerifiedCheckout(checkoutId: string) {
    try {
      const checkout = await this.polarClient?.getCheckoutSession({ checkoutId });

      if (!checkout) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      return {
        ...checkout,
        status: checkout.status?.toLowerCase() ?? null,
      };
    } catch (error) {
      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }
}
