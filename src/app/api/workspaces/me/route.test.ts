import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGetMyWorkspace = vi.fn();
const mockCookiesGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: mockCookiesGet,
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
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      getMyWorkspace: mockGetMyWorkspace,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

describe("GET /api/workspaces/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
    expect(mockGetMyWorkspace).not.toHaveBeenCalled();
  });

  it("워크스페이스 멤버 한도 상태를 포함해 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 7 });
    mockGetMyWorkspace.mockResolvedValue({
      id: "ws_ops",
      name: "운영팀",
      planCode: "FREE",
      memberCount: 11,
      freeMemberLimit: 10,
      isOverFreeMemberLimit: true,
      createdAt: new Date("2026-04-01T00:00:00.000Z"),
    });

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        id: "ws_ops",
        memberCount: 11,
        freeMemberLimit: 10,
        isOverFreeMemberLimit: true,
      }),
    );
    expect(mockGetMyWorkspace).toHaveBeenCalledWith(7, undefined);
  });
});
