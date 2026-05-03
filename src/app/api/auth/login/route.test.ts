import { TooManyRequestsError } from "@/lib/server/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockLogin = vi.fn();
const mockCookies = vi.fn();
const mockHeaders = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/domain/auth/storage/auth.storage", () => ({
  AuthStorage: vi.fn(),
}));

vi.mock("@/domain/auth/services/auth.service", () => ({
  AuthService: vi.fn(function MockAuthService() {
    return {
      login: mockLogin,
    };
  }),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
  headers: mockHeaders,
}));

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
      set: vi.fn(),
    });
    mockHeaders.mockResolvedValue(new Headers());
  });

  it("입력값이 유효하지 않으면 422를 반환한다", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customId: "ab",
          password: "",
        }),
      }),
    );

    expect(response.status).toBe(422);
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("로그인 차단 상태면 429를 반환한다", async () => {
    mockLogin.mockRejectedValue(new TooManyRequestsError("LOGIN_RATE_LIMITED"));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": "1.2.3.4",
        },
        body: JSON.stringify({
          customId: "john123",
          password: "password123",
        }),
      }),
    );

    const body = (await response.json()) as {
      error: {
        code: string;
      };
    };

    expect(response.status).toBe(429);
    expect(body.error.code).toBe("LOGIN_RATE_LIMITED");
    expect(mockLogin).toHaveBeenCalledWith("john123", "password123", "1.2.3.4");
  });
});
