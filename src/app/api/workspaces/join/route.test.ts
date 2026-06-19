import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockGuardRestrictedTestAccountWrite = vi.fn();
const mockResolveWorkspaceIdByUid = vi.fn();
const mockJoinWorkspace = vi.fn();
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

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSession,
}));

vi.mock("@/lib/server/restricted-test-account", () => ({
  guardRestrictedTestAccountWrite: mockGuardRestrictedTestAccountWrite,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      resolveWorkspaceIdByUid: mockResolveWorkspaceIdByUid,
      joinWorkspace: mockJoinWorkspace,
    };
  }),
}));

describe("POST /api/workspaces/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockGuardRestrictedTestAccountWrite.mockResolvedValue(null);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/join", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws_ops" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(401);
    expect(mockJoinWorkspace).not.toHaveBeenCalled();
  });

  it("워크스페이스 참가 후 active workspace 쿠키를 갱신한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 7 });
    mockResolveWorkspaceIdByUid.mockResolvedValue(3);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/join", {
        method: "POST",
        body: JSON.stringify({ workspaceId: "ws_ops" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockJoinWorkspace).toHaveBeenCalledWith(3, 7);
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
