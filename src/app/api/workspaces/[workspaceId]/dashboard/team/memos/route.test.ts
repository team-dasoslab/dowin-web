import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockListTeamMemos = vi.fn();
const mockCreateTeamMemo = vi.fn();
const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockResolveIdByUid = vi.fn();

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: () => mockRequireWorkspaceAccess(),
}));

vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: () => mockAssertWorkspaceOperationAllowed(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/dashboard/services/team-memo.service", () => ({
  TeamMemoService: vi.fn(function MockTeamMemoService() {
    return {
      listTeamMemos: mockListTeamMemos,
      createTeamMemo: mockCreateTeamMemo,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return {
      resolveIdByUid: mockResolveIdByUid,
    };
  }),
}));

vi.mock("@/domain/dashboard/storage/team-memo.storage", () => ({
  TeamMemoStorage: vi.fn(),
}));

describe("GET/POST /api/workspaces/:workspaceId/dashboard/team/memos", () => {
  beforeEach(() => {
    if (typeof mockRequireWorkspaceAccess !== "undefined")
      mockRequireWorkspaceAccess.mockResolvedValue({
        workspaceId: 1,
        userId: 1,
        role: "MEMBER",
        entitlement: { planCode: "BASIC" },
      });
    if (typeof mockAssertWorkspaceOperationAllowed !== "undefined")
      mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(7);
  });

  it("GET 요청에서 세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/workspaces/7/dashboard/team/memos?targetUserId=12"),
      { params: Promise.resolve({ workspaceId: "7" }) },
    );

    expect(response.status).toBe(401);
  });

  it("GET 요청을 처리한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 7,
      userId: 11,
      role: "MEMBER",
      entitlement: { planCode: "BASIC" },
    });
    mockListTeamMemos.mockResolvedValue({
      id: 7,
      targetUserId: 12,
      memos: [],
    });

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/workspaces/7/dashboard/team/memos?targetUserId=12"),
      { params: Promise.resolve({ workspaceId: "7" }) },
    );

    expect(response.status).toBe(200);
    expect(mockListTeamMemos).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7 }), 12);
  });

  it("POST 요청을 처리한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 7,
      userId: 11,
      role: "MEMBER",
      entitlement: { planCode: "BASIC" },
    });
    mockCreateTeamMemo.mockResolvedValue({
      id: 1,
      content: "메모",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/7/dashboard/team/memos", {
        method: "POST",
        body: JSON.stringify({
          targetUserId: 12,
          content: "메모",
        }),
      }),
      { params: Promise.resolve({ workspaceId: "7" }) },
    );

    expect(response.status).toBe(201);
    expect(mockCreateTeamMemo).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 7 }), {
      targetUserId: 12,
      content: "메모",
    });
  });
});
