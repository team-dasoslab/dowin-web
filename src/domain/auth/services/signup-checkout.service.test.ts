import { describe, expect, it, vi } from "vitest";
import { SignupCheckoutService } from "./signup-checkout.service";

describe("SignupCheckoutService", () => {
  const now = new Date("2026-05-28T00:00:00.000Z");

  function createService(overrides?: {
    auth?: Record<string, unknown>;
    billing?: Record<string, unknown>;
    polar?: Record<string, unknown> | null;
  }) {
    const auth = {
      findUserByCustomId: vi.fn().mockResolvedValue(null),
      findActivePendingSignupCheckoutByCustomId: vi.fn().mockResolvedValue(null),
      findPendingSignupCheckoutByRequestId: vi.fn().mockResolvedValue(null),
      createPendingSignupCheckout: vi.fn().mockResolvedValue({
        id: 10,
        uid: "signup_intent_1",
      }),
      markPendingSignupCheckoutCreated: vi.fn().mockResolvedValue({
        uid: "signup_intent_1",
      }),
      markPendingSignupCheckoutFailed: vi.fn().mockResolvedValue(null),
      ...overrides?.auth,
    };
    const billing = {
      findActiveProviderProduct: vi.fn().mockResolvedValue({
        providerProductId: "prod_basic",
      }),
      ...overrides?.billing,
    };
    const polar =
      overrides?.polar === null
        ? null
        : {
            environment: "sandbox" as const,
            createCheckoutSession: vi.fn().mockResolvedValue({
              checkoutUrl: "https://polar.sh/checkout/basic",
              checkoutId: "chk_basic",
            }),
            createCustomerSession: vi.fn(),
            ...overrides?.polar,
          };

    return {
      service: new SignupCheckoutService(auth as never, billing as never, polar),
      auth,
      billing,
      polar,
    };
  }

  it("Basic signup checkout을 생성하고 seat 수를 Polar에 전달한다", async () => {
    const { service, auth, billing, polar } = createService();

    await expect(
      service.prepareSignupCheckout({
        customId: "john123",
        nickname: "존",
        password: "newSecurePass1!",
        workspaceName: "우리 팀",
        seatCount: 5,
        locale: "ko",
        idempotencyKey: "signup-key-1",
        now,
      }),
    ).resolves.toEqual({
      signupIntentId: "signup_intent_1",
      checkoutUrl: "https://polar.sh/checkout/basic",
    });

    expect(billing.findActiveProviderProduct).toHaveBeenCalledWith({
      provider: "POLAR",
      environment: "sandbox",
      planCode: "BASIC",
    });
    expect(auth.createPendingSignupCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "signup-key-1",
        customId: "john123",
        workspaceName: "우리 팀",
        requestedSeatCount: 5,
        targetPlanCode: "BASIC",
        providerProductId: "prod_basic",
      }),
    );
    expect(polar?.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod_basic",
        externalCustomerId: "signup:signup_intent_1",
        seats: 5,
        metadata: expect.objectContaining({
          flow: "signup",
          targetPlanCode: "BASIC",
          requestedSeatCount: "5",
        }),
      }),
    );
    expect(auth.markPendingSignupCheckoutCreated).toHaveBeenCalledWith(10, {
      providerCheckoutId: "chk_basic",
      checkoutUrl: "https://polar.sh/checkout/basic",
    });
  });

  it("이미 생성된 같은 멱등 키 checkout이 있으면 기존 URL을 재사용한다", async () => {
    const { service, polar } = createService({
      auth: {
        findPendingSignupCheckoutByRequestId: vi.fn().mockResolvedValue({
          uid: "signup_existing",
          customId: "john123",
          expiresAt: new Date("2026-05-28T00:10:00.000Z"),
          checkoutUrl: "https://polar.sh/existing",
        }),
      },
    });

    await expect(
      service.prepareSignupCheckout({
        customId: "john123",
        nickname: "존",
        password: "newSecurePass1!",
        workspaceName: "우리 팀",
        seatCount: 5,
        locale: "ko",
        idempotencyKey: "signup-key-1",
        now,
      }),
    ).resolves.toEqual({
      signupIntentId: "signup_existing",
      checkoutUrl: "https://polar.sh/existing",
    });
    expect(polar?.createCheckoutSession).not.toHaveBeenCalled();
  });

  it("이미 가입된 아이디면 checkout을 만들지 않는다", async () => {
    const { service } = createService({
      auth: {
        findUserByCustomId: vi.fn().mockResolvedValue({ id: 1 }),
      },
    });

    await expect(
      service.prepareSignupCheckout({
        customId: "john123",
        nickname: "존",
        password: "newSecurePass1!",
        workspaceName: "우리 팀",
        seatCount: 5,
        locale: "ko",
        idempotencyKey: "signup-key-1",
        now,
      }),
    ).rejects.toMatchObject({
      code: "CUSTOM_ID_ALREADY_EXISTS",
    });
  });

  it("Polar 연동 또는 Basic product 매핑이 없으면 checkout을 만들지 않는다", async () => {
    const { service } = createService({
      billing: {
        findActiveProviderProduct: vi.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.prepareSignupCheckout({
        customId: "john123",
        nickname: "존",
        password: "newSecurePass1!",
        workspaceName: "우리 팀",
        seatCount: 5,
        locale: "ko",
        idempotencyKey: "signup-key-1",
        now,
      }),
    ).rejects.toMatchObject({
      code: "BILLING_NOT_READY",
    });
  });
});
