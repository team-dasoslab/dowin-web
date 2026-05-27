import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
  type PolarBillingClient,
  isPolarRecoverableError,
} from "@/domain/billing/polar";
import { BillingStorage } from "@/domain/billing/storage/billing.storage";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import { ConflictError } from "@/lib/server/errors";

const SIGNUP_CHECKOUT_EXPIRES_MS = 30 * 60 * 1000;

type AuthPort = Pick<
  AuthStorage,
  | "findUserByCustomId"
  | "findActivePendingSignupCheckoutByCustomId"
  | "findPendingSignupCheckoutByRequestId"
  | "createPendingSignupCheckout"
  | "markPendingSignupCheckoutCreated"
  | "markPendingSignupCheckoutFailed"
>;

type BillingPort = Pick<BillingStorage, "findActiveProviderProduct">;

export class SignupCheckoutService {
  constructor(
    private authStorage: AuthPort,
    private billingStorage: BillingPort,
    private polarClient: PolarBillingClient | null,
  ) {}

  async prepareSignupCheckout(input: {
    customId: string;
    nickname: string;
    password: string;
    workspaceName: string;
    seatCount: number;
    locale: "ko" | "en";
    idempotencyKey: string;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    const existingUser = await this.authStorage.findUserByCustomId(input.customId);

    if (existingUser) {
      throw new ConflictError("CUSTOM_ID_ALREADY_EXISTS");
    }

    const existingByRequest =
      await this.authStorage.findPendingSignupCheckoutByRequestId(
        input.idempotencyKey,
      );

    if (existingByRequest) {
      if (
        existingByRequest.customId !== input.customId ||
        existingByRequest.expiresAt <= now
      ) {
        throw new ConflictError("SIGNUP_CHECKOUT_ALREADY_PENDING");
      }

      if (existingByRequest.checkoutUrl) {
        return {
          signupIntentId: existingByRequest.uid,
          checkoutUrl: existingByRequest.checkoutUrl,
        };
      }
    }

    const activePending =
      await this.authStorage.findActivePendingSignupCheckoutByCustomId(
        input.customId,
        now,
      );

    if (activePending?.checkoutUrl) {
      return {
        signupIntentId: activePending.uid,
        checkoutUrl: activePending.checkoutUrl,
      };
    }

    if (activePending) {
      throw new ConflictError("SIGNUP_CHECKOUT_ALREADY_PENDING");
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
    const pending = await this.authStorage.createPendingSignupCheckout({
      uid,
      requestId: input.idempotencyKey,
      customId: input.customId,
      nickname: input.nickname,
      passwordHash: await bcrypt.hash(input.password, 10),
      locale: input.locale,
      workspaceName: input.workspaceName,
      requestedSeatCount: input.seatCount,
      targetPlanCode: "BASIC",
      provider: "POLAR",
      providerProductId: product.providerProductId,
      expiresAt: new Date(now.getTime() + SIGNUP_CHECKOUT_EXPIRES_MS),
    });

    try {
      const checkout = await this.polarClient.createCheckoutSession({
        productId: product.providerProductId,
        externalCustomerId: `signup:${pending.uid}`,
        idempotencyKey: input.idempotencyKey,
        locale: input.locale,
        seats: input.seatCount,
        successPath: "/auth/signup/success",
        signupIntentId: pending.uid,
        metadata: {
          flow: "signup",
          signupIntentId: pending.uid,
          targetPlanCode: "BASIC",
          requestedSeatCount: String(input.seatCount),
        },
      });

      const updated = await this.authStorage.markPendingSignupCheckoutCreated(
        pending.id,
        {
          providerCheckoutId: checkout.checkoutId,
          checkoutUrl: checkout.checkoutUrl,
        },
      );

      return {
        signupIntentId: updated?.uid ?? pending.uid,
        checkoutUrl: checkout.checkoutUrl,
      };
    } catch (error) {
      await this.authStorage.markPendingSignupCheckoutFailed(pending.id);

      if (isPolarRecoverableError(error)) {
        throw new ConflictError("BILLING_NOT_READY");
      }

      throw error;
    }
  }
}
