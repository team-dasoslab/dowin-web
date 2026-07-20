import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockJoinWorkspaceByInvite = vi.fn();
const mockGuardRestrictedTestAccountWrite = vi.fn();
const mockCookieSet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: mockCookieSet,
  })),
  headers: vi.fn(() => new Headers()),
}));

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
  getSessionWithRefresh: mockGetSession,
}));

vi.mock("@/lib/server/restricted-test-account", () => ({
  guardRestrictedTestAccountWrite: mockGuardRestrictedTestAccountWrite,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function () {
    return { resolveIdByUid: vi.fn().mockResolvedValue(1) };
  }),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      joinWorkspaceByInvite: mockJoinWorkspaceByInvite,
    };
  }),
}));

describe("POST /api/workspaces/join-by-invite", () => {
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

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/join-by-invite", {
        method: "POST",
        body: JSON.stringify({ code: "ABCD123456" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("초대코드로 참가 요청을 처리한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 7 });
    mockJoinWorkspaceByInvite.mockResolvedValue({
      id: "ws_ops",
      name: "운영팀",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/join-by-invite", {
        method: "POST",
        body: JSON.stringify({ code: "ABCD123456" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockJoinWorkspaceByInvite).toHaveBeenCalledWith("ABCD123456", 7);
    expect(mockCookieSet).toHaveBeenCalledWith(
      "dowin_workspace_id",
      "ws_ops",
      expect.objectContaining({
        httpOnly: true,
        path: "/",
        sameSite: "lax",
      }),
    );
  });
});
