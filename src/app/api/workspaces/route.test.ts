import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockListMyWorkspaces = vi.fn();
const mockCreateWorkspace = vi.fn();
const mockGuardRestrictedTestAccountWrite = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
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
  WorkspaceStorage: vi.fn(),
}));

describe("/api/workspaces", () => {
  beforeEach(() => {
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
    const response = await GET();
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

  it("POST는 워크스페이스 생성 결과를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 9 });
    mockCreateWorkspace.mockResolvedValue({
      id: "ws_new",
      name: "새 워크스페이스",
      planCode: "FREE",
      createdAt: new Date("2026-05-21T00:00:00.000Z"),
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: "새 워크스페이스" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockCreateWorkspace).toHaveBeenCalledWith(9, "새 워크스페이스");
    expect(body).toEqual(
      expect.objectContaining({
        id: "ws_new",
        name: "새 워크스페이스",
      }),
    );
  });
});
