import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockRequireWorkspaceAdminInWorkspace = vi.fn();
const mockRemoveMember = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/lib/server/authz", () => ({
  requireWorkspaceAdminInWorkspace: mockRequireWorkspaceAdminInWorkspace,
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
    removeMember: mockRemoveMember,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

describe("DELETE /api/workspaces/:id/members/:memberId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1/members/9"),
      { params: Promise.resolve({ id: "1", memberId: "9" }) },
    );

    expect(response.status).toBe(401);
  });

  it("해당 워크스페이스 ADMIN이 아니면 403을 반환한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockRejectedValue(
      new ForbiddenError("FORBIDDEN"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1/members/9"),
      { params: Promise.resolve({ id: "1", memberId: "9" }) },
    );

    expect(response.status).toBe(403);
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it("ADMIN이면 멤버를 퇴출하고 204를 반환한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "ADMIN",
    });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1/members/9"),
      { params: Promise.resolve({ id: "1", memberId: "9" }) },
    );

    expect(response.status).toBe(204);
    expect(mockRemoveMember).toHaveBeenCalledWith(1, 1, 9);
  });
});
