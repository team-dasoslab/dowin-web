import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockResetPasswordByRecoveryCode = vi.fn();

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
      resetPasswordByRecoveryCode: mockResetPasswordByRecoveryCode,
    };
  }),
}));

describe("PUT /api/auth/password/by-recovery-code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("요청 바디가 유효하지 않으면 422를 반환한다", async () => {
    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/auth/password/by-recovery-code", {
        method: "PUT",
        body: JSON.stringify({
          recoveryCode: "bad",
          newPassword: "short",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(422);
    expect(mockResetPasswordByRecoveryCode).not.toHaveBeenCalled();
  });

  it("복원코드 비밀번호 재설정에 성공하면 200을 반환한다", async () => {
    mockResetPasswordByRecoveryCode.mockResolvedValue(undefined);

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/auth/password/by-recovery-code", {
        method: "PUT",
        body: JSON.stringify({
          recoveryCode: "ABCD-EFGH23",
          newPassword: "newSecurePass1!",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockResetPasswordByRecoveryCode).toHaveBeenCalledWith(
      "ABCDEFGH23",
      "newSecurePass1!",
    );
    await expect(response.json()).resolves.toEqual({
      message: "비밀번호가 변경되었습니다.",
    });
  });
});
