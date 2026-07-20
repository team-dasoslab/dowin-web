import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockResolveIdByUid = vi.fn();

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();

const mockResolveWorkspaceIdByUid = vi.fn();
const mockRemoveMember = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      resolveWorkspaceIdByUid: mockResolveWorkspaceIdByUid,
      removeMember: mockRemoveMember,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return { resolveIdByUid: mockResolveIdByUid };
  }),
}));

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: mockRequireWorkspaceAccess,
}));
vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: mockAssertWorkspaceOperationAllowed,
}));

describe("DELETE /api/workspaces/:id/members/:memberId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(1);
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "ADMIN",
      entitlement: { planCode: "BASIC" },
    });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    mockResolveWorkspaceIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(new NextRequest("http://localhost/api/workspaces/1/members/9"), {
      params: Promise.resolve({ workspaceId: "1", memberId: "9" }),
    });

    expect(response.status).toBe(401);
  });

  it("해당 워크스페이스 ADMIN이 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "MEMBER",
      entitlement: { planCode: "BASIC" },
    });

    const { DELETE } = await import("./route");
    const response = await DELETE(new NextRequest("http://localhost/api/workspaces/1/members/9"), {
      params: Promise.resolve({ workspaceId: "1", memberId: "9" }),
    });

    expect(response.status).toBe(403);
    expect(mockRemoveMember).not.toHaveBeenCalled();
  });

  it("ADMIN이면 멤버를 퇴출하고 204를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { DELETE } = await import("./route");
    const response = await DELETE(new NextRequest("http://localhost/api/workspaces/1/members/9"), {
      params: Promise.resolve({ workspaceId: "1", memberId: "9" }),
    });

    expect(response.status).toBe(204);
    expect(mockRemoveMember).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }), 9);
  });
});
