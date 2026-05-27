import { nanoid, customAlphabet } from "nanoid";
import { createHash } from "node:crypto";
import { SESSION_TTL_MS } from "@/domain/auth/constants";
import { AuthStorage } from "@/domain/auth/storage/auth.storage";
import {
  type PolarBillingClient,
  isPolarRecoverableError,
} from "@/domain/billing/polar";
import { ConflictError, NotFoundError } from "@/lib/server/errors";

const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_LENGTH = 10;
const RECOVERY_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateRecoveryCode = customAlphabet(
  RECOVERY_CODE_ALPHABET,
  RECOVERY_CODE_LENGTH,
);

type AuthPort = Pick<
  AuthStorage,
  | "findPendingSignupCheckoutByUid"
  | "findUserByCustomId"
  | "provisionCompletedSignup"
  | "createRecoveryCodes"
  | "createSession"
>;

export class SignupCompletionService {
  constructor(
    private authStorage: AuthPort,
    private polarClient: PolarBillingClient | null,
  ) {}

  async completeSignup(input: {
    signupIntentId: string;
    checkoutId: string;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    const pending = await this.authStorage.findPendingSignupCheckoutByUid(
      input.signupIntentId,
    );

    if (!pending) {
      throw new NotFoundError("NOT_FOUND");
    }

    if (pending.status === "COMPLETED") {
      throw new ConflictError("SIGNUP_ALREADY_COMPLETED");
    }

    if (pending.expiresAt <= now) {
      throw new ConflictError("SIGNUP_CHECKOUT_NOT_READY");
    }

    if (
      pending.status !== "CHECKOUT_CREATED" ||
      !pending.providerCheckoutId ||
      pending.providerCheckoutId !== input.checkoutId
    ) {
      throw new ConflictError("SIGNUP_CHECKOUT_NOT_READY");
    }

    if (!this.polarClient) {
      throw new ConflictError("BILLING_NOT_READY");
    }

    const checkout = await this.getVerifiedCheckout(input.checkoutId);

    if (
      checkout.status !== "succeeded" ||
      checkout.metadata.signupIntentId !== pending.uid ||
      checkout.metadata.flow !== "signup" ||
      checkout.externalCustomerId !== `signup:${pending.uid}`
    ) {
      throw new ConflictError("SIGNUP_CHECKOUT_NOT_READY");
    }

    const existingUser = await this.authStorage.findUserByCustomId(
      pending.customId,
    );

    if (existingUser) {
      throw new ConflictError("CUSTOM_ID_ALREADY_EXISTS");
    }

    const { user } = await this.authStorage.provisionCompletedSignup({
      pendingId: pending.id,
      pendingUid: pending.uid,
      customId: pending.customId,
      nickname: pending.nickname,
      passwordHash: pending.passwordHash,
      locale: pending.locale,
      workspaceName: pending.workspaceName,
      purchasedSeatCount: pending.requestedSeatCount,
      customerKey: checkout.customerKey,
      subscriptionKey: checkout.subscriptionKey,
      now,
    });

    const recoveryCodes = Array.from(
      { length: RECOVERY_CODE_COUNT },
      () => generateRecoveryCode(),
    );

    await this.authStorage.createRecoveryCodes(
      recoveryCodes.map((code) => ({
        userId: user.id,
        codeHash: hashRecoveryCode(code),
      })),
    );

    const sessionId = nanoid();
    await this.authStorage.createSession({
      id: sessionId,
      userId: user.id,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
    });

    return {
      user: {
        id: user.id,
        nickname: user.nickname,
        isFirstLogin: user.isFirstLogin,
        locale: user.locale,
      },
      recoveryCodes,
      sessionId,
    };
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

function hashRecoveryCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}
