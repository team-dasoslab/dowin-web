import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockResolveTeamMemo = vi.fn();

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
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/dashboard/storage/team-memo.storage", () => ({
  TeamMemoStorage: vi.fn(),
}));

describe("PATCH /api/dashboard/team/memos/:memoId/resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/dashboard/team/memos/1/resolve", {
        method: "PATCH",
        body: JSON.stringify({ isResolved: true }),
      }),
      { params: Promise.resolve({ memoId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("완료 상태 변경 요청을 처리한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });
    mockResolveTeamMemo.mockResolvedValue({ id: 1, isResolved: true });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/dashboard/team/memos/1/resolve", {
        method: "PATCH",
        body: JSON.stringify({ isResolved: true }),
      }),
      { params: Promise.resolve({ memoId: "1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockResolveTeamMemo).toHaveBeenCalledWith(11, 1, true);
  });
});
