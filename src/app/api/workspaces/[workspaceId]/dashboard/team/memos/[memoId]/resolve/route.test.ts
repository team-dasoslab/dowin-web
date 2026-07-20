import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockResolveTeamMemo = vi.fn();
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
      resolveTeamMemo: mockResolveTeamMemo,
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

describe("PATCH /api/workspaces/:workspaceId/dashboard/team/memos/:memoId/resolve", () => {
  beforeEach(() => {
    if (typeof mockRequireWorkspaceAccess !== "undefined") mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    if (typeof mockAssertWorkspaceOperationAllowed !== "undefined") mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(7);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/workspaces/7/dashboard/team/memos/1/resolve", {
        method: "PATCH",
        body: JSON.stringify({ isResolved: true }),
      }),
      { params: Promise.resolve({ workspaceId: "7", memoId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("완료 상태 변경 요청을 처리한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 7, userId: 11, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    mockResolveTeamMemo.mockResolvedValue({ id: 1, isResolved: true });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new NextRequest("http://localhost/api/workspaces/7/dashboard/team/memos/1/resolve", {
        method: "PATCH",
        body: JSON.stringify({ isResolved: true }),
      }),
      { params: Promise.resolve({ workspaceId: "7", memoId: "1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockResolveTeamMemo).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 7 }),
      1,
      true
    );
  });
});
