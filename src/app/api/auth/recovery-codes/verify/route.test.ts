import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockVerifyRecoveryCode = vi.fn();

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
      verifyRecoveryCode: mockVerifyRecoveryCode,
    };
  }),
}));

describe("POST /api/auth/recovery-codes/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("요청 바디가 유효하지 않으면 422를 반환한다", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/recovery-codes/verify", {
        method: "POST",
        body: JSON.stringify({
          recoveryCode: "bad",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(422);
    expect(mockVerifyRecoveryCode).not.toHaveBeenCalled();
  });

  it("복원코드 검증에 성공하면 계정 정보를 반환한다", async () => {
    mockVerifyRecoveryCode.mockResolvedValue({
      customId: "john123",
      nickname: "존",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/auth/recovery-codes/verify", {
        method: "POST",
        body: JSON.stringify({
          recoveryCode: "ABCD-EFGH23",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockVerifyRecoveryCode).toHaveBeenCalledWith("ABCDEFGH23");
    await expect(response.json()).resolves.toEqual({
      user: {
        customId: "john123",
        nickname: "존",
      },
    });
  });
});
