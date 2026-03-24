import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAdmin = vi.fn();
const mockCreateUser = vi.fn();
const mockAddMember = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/auth/storage/auth.storage", () => ({
  AuthStorage: vi.fn(),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return {
    addMember: mockAddMember,
    };
  }),
}));

vi.mock("@/domain/auth/services/auth.service", () => ({
  AuthService: vi.fn(function MockAuthService() {
    return {
    createUser: mockCreateUser,
    };
  }),
}));

vi.mock("@/lib/server/authz", () => ({
  requireWorkspaceAdmin: mockRequireWorkspaceAdmin,
}));

describe("POST /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          customId: "newmember",
          nickname: "새멤버",
          password: "newSecurePass1!",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("ADMIN이 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdmin.mockRejectedValue(new ForbiddenError("FORBIDDEN"));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          customId: "newmember",
          nickname: "새멤버",
          password: "newSecurePass1!",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(403);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it("ADMIN이면 사용자를 생성하고 201을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdmin.mockResolvedValue({
      workspaceId: 7,
      role: "ADMIN",
    });
    mockCreateUser.mockResolvedValue({
      id: 2,
      customId: "newmember",
      nickname: "새멤버",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          customId: "newmember",
          nickname: "새멤버",
          password: "newSecurePass1!",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(201);
    expect(mockCreateUser).toHaveBeenCalledWith(
      "newmember",
      "새멤버",
      "newSecurePass1!",
    );
    expect(mockAddMember).toHaveBeenCalledWith(7, 2, "MEMBER");
  });
});
