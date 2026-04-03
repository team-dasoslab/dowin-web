import { beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError, ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockDeleteMyAccount = vi.fn();
const mockCookieDelete = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/auth")>(
    "@/lib/server/auth",
  );

  return {
    ...actual,
    getSessionWithRefresh: mockGetSessionWithRefresh,
  };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    delete: mockCookieDelete,
  }),
}));

vi.mock("@/domain/profile/storage/profile.storage", () => ({
  ProfileStorage: vi.fn(),
}));

vi.mock("@/domain/profile/services/profile.service", () => ({
  ProfileService: vi.fn(function MockProfileService() {
    return {
      deleteMyAccount: mockDeleteMyAccount,
    };
  }),
}));

describe("DELETE /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/users/me", {
        method: "DELETE",
        body: JSON.stringify({ currentPassword: "password123" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("비밀번호가 틀리면 400을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockDeleteMyAccount.mockRejectedValue(new BadRequestError("WRONG_PASSWORD"));

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/users/me", {
        method: "DELETE",
        body: JSON.stringify({ currentPassword: "wrong-password" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(400);
  });

  it("유일한 ADMIN은 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockDeleteMyAccount.mockRejectedValue(
      new ForbiddenError("LAST_ADMIN_ACCOUNT_DELETION_FORBIDDEN"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/users/me", {
        method: "DELETE",
        body: JSON.stringify({ currentPassword: "password123" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(403);
  });

  it("탈퇴 성공 시 204를 반환하고 세션 쿠키를 지운다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockDeleteMyAccount.mockResolvedValue(undefined);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/users/me", {
        method: "DELETE",
        body: JSON.stringify({ currentPassword: "password123" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(204);
    expect(mockDeleteMyAccount).toHaveBeenCalledWith(1, "password123");
    expect(mockCookieDelete).toHaveBeenCalled();
  });
});
