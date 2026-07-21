import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockResolveIdByUid = vi.fn();

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();

const mockGetMembers = vi.fn();

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
      getMembers: mockGetMembers,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return { resolveIdByUid: mockResolveIdByUid };
    //
    return {
      resolveIdByUid: mockResolveIdByUid,
    };
  }),
}));

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: mockRequireWorkspaceAccess,
}));
vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: mockAssertWorkspaceOperationAllowed,
}));

describe("GET /api/workspaces/:id/members", () => {
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
    mockResolveIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces/1/members"), {
      params: Promise.resolve({ workspaceId: "1" }),
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

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces/1/members"), {
      params: Promise.resolve({ workspaceId: "1" }),
    });

    expect(response.status).toBe(403);
    expect(mockGetMembers).not.toHaveBeenCalled();
  });

  it("해당 워크스페이스 ADMIN이면 목록을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    mockGetMembers.mockResolvedValue([{ userId: 1, nickname: "관리자" }]);

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces/1/members"), {
      params: Promise.resolve({ workspaceId: "1" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetMembers).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }));
  });
});
