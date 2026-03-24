import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockJoinWorkspaceByInvite = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSession,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
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
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/join-by-invite", {
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

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/join-by-invite", {
        method: "POST",
        body: JSON.stringify({ code: "ABCD123456" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockJoinWorkspaceByInvite).toHaveBeenCalledWith("ABCD123456", 7);
  });
});
