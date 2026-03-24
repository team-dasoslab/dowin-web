import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockSignup = vi.fn();
const mockCookieSet = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockCookieSet,
  })),
}));

vi.mock("@/domain/auth/storage/auth.storage", () => ({
  AuthStorage: vi.fn(),
}));

vi.mock("@/domain/auth/services/auth.service", () => ({
  AuthService: vi.fn(function MockAuthService() {
    return {
      signup: mockSignup,
    };
  }),
}));

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("요청 바디가 유효하지 않으면 422를 반환한다", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          customId: "ab",
          nickname: "",
          password: "short",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(422);
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("회원가입 성공 시 201과 세션 쿠키를 반환한다", async () => {
    mockSignup.mockResolvedValue({
      user: {
        id: 1,
        nickname: "존",
        isFirstLogin: true,
      },
      recoveryCodes: ["AAAA1111AA", "BBBB2222BB"],
      sessionId: "session-123",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          customId: "john123",
          nickname: "존",
          password: "newSecurePass1!",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(mockSignup).toHaveBeenCalledWith("john123", "존", "newSecurePass1!");
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 1,
        nickname: "존",
        isFirstLogin: true,
      },
      recoveryCodes: ["AAAA1111AA", "BBBB2222BB"],
    });
  });
});
