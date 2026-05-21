import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockSetActiveWorkspaceCookie = vi.fn();
const mockFindMembership = vi.fn();
const mockListMyWorkspaces = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/active-workspace", () => ({
  setActiveWorkspaceCookie: mockSetActiveWorkspaceCookie,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return {
      findMembership: mockFindMembership,
    };
  }),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      listMyWorkspaces: mockListMyWorkspaces,
    };
  }),
}));

describe("PUT /api/workspaces/current", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/workspaces/current", {
        method: "PUT",
        body: JSON.stringify({ workspaceId: 7 }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("멤버십이 있으면 active workspace를 전환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 12 });
    mockFindMembership.mockResolvedValue({ workspaceId: 7, userId: 12, role: "ADMIN" });
    mockListMyWorkspaces.mockResolvedValue([
      {
        id: 3,
        name: "운영팀",
        planCode: "STANDARD",
        role: "MEMBER",
        isCurrent: false,
        createdAt: new Date("2026-05-01T00:00:00.000Z"),
      },
      {
        id: 7,
        name: "개인",
        planCode: "FREE",
        role: "ADMIN",
        isCurrent: true,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/workspaces/current", {
        method: "PUT",
        body: JSON.stringify({ workspaceId: 7 }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mockSetActiveWorkspaceCookie).toHaveBeenCalledWith(7);
    expect(body).toEqual(
      expect.objectContaining({
        id: 7,
        role: "ADMIN",
        isCurrent: true,
      }),
    );
  });
});
