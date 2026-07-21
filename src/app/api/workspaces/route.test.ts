import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockListMyWorkspaces = vi.fn();
const mockCreateWorkspace = vi.fn();
const mockGuardRestrictedTestAccountWrite = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: mockRequireWorkspaceAccess,
}));

vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: mockAssertWorkspaceOperationAllowed,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/restricted-test-account", () => ({
  guardRestrictedTestAccountWrite: mockGuardRestrictedTestAccountWrite,
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      listMyWorkspaces: mockListMyWorkspaces,
      createWorkspace: mockCreateWorkspace,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function () {
    return { resolveIdByUid: vi.fn().mockResolvedValue(1) };
  }),
}));

describe("/api/workspaces", () => {
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
    mockGuardRestrictedTestAccountWrite.mockResolvedValue(null);
  });

  it("GET은 내 워크스페이스 목록을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 9 });
    mockListMyWorkspaces.mockResolvedValue([
      {
        id: "ws_ops",
        name: "운영팀",
        planCode: "STANDARD",
        role: "ADMIN",
        isCurrent: true,
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces"), {
      params: Promise.resolve({}),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockListMyWorkspaces).toHaveBeenCalledWith(9);
    expect(body).toEqual([
      expect.objectContaining({
        id: "ws_ops",
        isCurrent: true,
      }),
    ]);
  });

  it("POST는 직접 워크스페이스 생성을 막고 결제 checkout을 요구한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 9 });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "새 워크스페이스" }),
      }),
      { params: Promise.resolve({}) },
    );
    const body = (await response.json()) as {
      error: {
        code: string;
      };
    };

    expect(response.status).toBe(409);
    expect(mockCreateWorkspace).not.toHaveBeenCalled();
    expect(body.error.code).toBe("WORKSPACE_PAYMENT_REQUIRED");
  });
});
