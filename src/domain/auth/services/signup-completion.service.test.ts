import { describe, expect, it, vi } from "vitest";
import { SignupCompletionService } from "./signup-completion.service";

describe("SignupCompletionService", () => {
  const now = new Date("2026-05-28T00:00:00.000Z");

  function createService(overrides?: {
    auth?: Record<string, unknown>;
    polar?: Record<string, unknown> | null;
  }) {
    const auth = {
      findPendingSignupCheckoutByUid: vi.fn().mockResolvedValue({
        id: 10,
        uid: "signup_intent_1",
        customId: "john123",
        nickname: "존",
        passwordHash: "hashed-password",
        locale: "ko",
        workspaceName: "우리 팀",
        requestedSeatCount: 5,
        status: "CHECKOUT_CREATED",
        providerCheckoutId: "chk_basic",
        expiresAt: new Date("2026-05-28T00:30:00.000Z"),
      }),
      findUserByCustomId: vi.fn().mockResolvedValue(null),
      provisionCompletedSignup: vi.fn().mockResolvedValue({
        user: {
          id: 1,
          nickname: "존",
          isFirstLogin: true,
          locale: "ko",
        },
        workspace: {
          id: 3,
        },
      }),
      createRecoveryCodes: vi.fn().mockResolvedValue(null),
      createSession: vi.fn().mockResolvedValue(null),
      ...overrides?.auth,
    };
    const polar =
      overrides?.polar === null
        ? null
        : {
            environment: "sandbox" as const,
            getCheckoutSession: vi.fn().mockResolvedValue({
              checkoutId: "chk_basic",
              status: "succeeded",
              metadata: {
                flow: "signup",
                signupIntentId: "signup_intent_1",
              },
              externalCustomerId: "signup:signup_intent_1",
              subscriptionKey: "sub_123",
              customerKey: "cus_123",
            }),
            createCheckoutSession: vi.fn(),
            createCustomerSession: vi.fn(),
            ...overrides?.polar,
          };

    return {
      service: new SignupCompletionService(auth as never, polar),
      auth,
      polar,
    };
  }

  it("성공한 Polar checkout을 검증하고 가입 리소스를 provision한다", async () => {
    const { service, auth, polar } = createService();

    const result = await service.completeSignup({
      signupIntentId: "signup_intent_1",
      checkoutId: "chk_basic",
      now,
    });

    expect(polar?.getCheckoutSession).toHaveBeenCalledWith({
      checkoutId: "chk_basic",
    });
    expect(auth.provisionCompletedSignup).toHaveBeenCalledWith({
      pendingId: 10,
      pendingUid: "signup_intent_1",
      customId: "john123",
      nickname: "존",
      passwordHash: "hashed-password",
      locale: "ko",
      workspaceName: "우리 팀",
      purchasedSeatCount: 5,
      customerKey: "cus_123",
      subscriptionKey: "sub_123",
      now,
    });
    expect(auth.createRecoveryCodes).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 1,
          codeHash: expect.any(String),
        }),
      ]),
    );
    expect(auth.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        expiresAt: expect.any(Date),
      }),
    );
    expect(result.user).toEqual({
      id: 1,
      nickname: "존",
      isFirstLogin: true,
      locale: "ko",
    });
    expect(result.recoveryCodes).toHaveLength(8);
    expect(result.sessionId).toEqual(expect.any(String));
  });

  it("이미 완료된 intent는 중복 provision하지 않는다", async () => {
    const { service, auth } = createService({
      auth: {
        findPendingSignupCheckoutByUid: vi.fn().mockResolvedValue({
          id: 10,
          uid: "signup_intent_1",
          status: "COMPLETED",
          expiresAt: new Date("2026-05-28T00:30:00.000Z"),
        }),
      },
    });

    await expect(
      service.completeSignup({
        signupIntentId: "signup_intent_1",
        checkoutId: "chk_basic",
        now,
      }),
    ).rejects.toMatchObject({ code: "SIGNUP_ALREADY_COMPLETED" });
    expect(auth.provisionCompletedSignup).not.toHaveBeenCalled();
  });

  it("checkout 검증 결과가 pending intent와 맞지 않으면 완료하지 않는다", async () => {
    const { service, auth } = createService({
      polar: {
        getCheckoutSession: vi.fn().mockResolvedValue({
          checkoutId: "chk_basic",
          status: "succeeded",
          metadata: {
            flow: "signup",
            signupIntentId: "other_intent",
          },
          externalCustomerId: "signup:other_intent",
          subscriptionKey: "sub_123",
          customerKey: "cus_123",
        }),
      },
    });

    await expect(
      service.completeSignup({
        signupIntentId: "signup_intent_1",
        checkoutId: "chk_basic",
        now,
      }),
    ).rejects.toMatchObject({ code: "SIGNUP_CHECKOUT_NOT_READY" });
    expect(auth.provisionCompletedSignup).not.toHaveBeenCalled();
  });
});
