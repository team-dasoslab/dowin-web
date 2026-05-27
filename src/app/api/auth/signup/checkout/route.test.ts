import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockPrepareSignupCheckout = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(async () => new Map()),
}));

vi.mock("@/domain/auth/storage/auth.storage", () => ({
  AuthStorage: vi.fn(),
}));

vi.mock("@/domain/billing/storage/billing.storage", () => ({
  BillingStorage: vi.fn(),
}));

vi.mock("@/domain/billing/polar", () => ({
  createPolarBillingClient: vi.fn(() => ({ environment: "sandbox" })),
}));

vi.mock("@/domain/auth/services/signup-checkout.service", () => ({
  SignupCheckoutService: vi.fn(function MockSignupCheckoutService() {
    return {
      prepareSignupCheckout: mockPrepareSignupCheckout,
    };
  }),
}));

describe("POST /api/auth/signup/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("멱등 키가 없으면 422를 반환한다", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup/checkout", {
        method: "POST",
        body: JSON.stringify({
          customId: "john123",
          nickname: "존",
          password: "newSecurePass1!",
          workspaceName: "우리 팀",
          seatCount: 5,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(422);
    expect(mockPrepareSignupCheckout).not.toHaveBeenCalled();
  });

  it("유효한 요청이면 checkout URL을 반환한다", async () => {
    mockPrepareSignupCheckout.mockResolvedValue({
      signupIntentId: "signup_intent_1",
      checkoutUrl: "https://polar.sh/checkout/basic",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup/checkout", {
        method: "POST",
        body: JSON.stringify({
          customId: "john123",
          nickname: "존",
          password: "newSecurePass1!",
          workspaceName: "우리 팀",
          seatCount: 5,
        }),
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "signup-key-1",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(mockPrepareSignupCheckout).toHaveBeenCalledWith({
      customId: "john123",
      nickname: "존",
      password: "newSecurePass1!",
      workspaceName: "우리 팀",
      seatCount: 5,
      locale: "ko",
      idempotencyKey: "signup-key-1",
    });
    await expect(response.json()).resolves.toEqual({
      signupIntentId: "signup_intent_1",
      checkoutUrl: "https://polar.sh/checkout/basic",
    });
  });
});
