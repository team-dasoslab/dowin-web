import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockCompleteSignup = vi.fn();
const mockCookieSet = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: mockCookieSet,
  })),
}));

vi.mock("@/domain/auth/storage/auth.storage", () => ({
  AuthStorage: vi.fn(),
}));

vi.mock("@/domain/billing/polar", () => ({
  createPolarBillingClient: vi.fn(() => ({ environment: "sandbox" })),
}));

vi.mock("@/domain/auth/services/signup-completion.service", () => ({
  SignupCompletionService: vi.fn(function MockSignupCompletionService() {
    return {
      completeSignup: mockCompleteSignup,
    };
  }),
}));

describe("POST /api/auth/signup/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("요청 바디가 유효하지 않으면 422를 반환한다", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup/complete", {
        method: "POST",
        body: JSON.stringify({
          signupIntentId: "",
          checkoutId: "",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(422);
    expect(mockCompleteSignup).not.toHaveBeenCalled();
  });

  it("가입 완료 성공 시 세션 쿠키와 복원코드를 반환한다", async () => {
    mockCompleteSignup.mockResolvedValue({
      user: {
        id: 1,
        nickname: "존",
        isFirstLogin: true,
        locale: "ko",
      },
      recoveryCodes: ["AAAA1111AA"],
      sessionId: "session-123",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup/complete", {
        method: "POST",
        body: JSON.stringify({
          signupIntentId: "signup_intent_1",
          checkoutId: "chk_basic",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(mockCompleteSignup).toHaveBeenCalledWith({
      signupIntentId: "signup_intent_1",
      checkoutId: "chk_basic",
    });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "dowin_sid",
      "session-123",
      expect.objectContaining({
        httpOnly: true,
      }),
    );
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 1,
        nickname: "존",
        isFirstLogin: true,
        locale: "ko",
      },
      recoveryCodes: ["AAAA1111AA"],
    });
  });
});
