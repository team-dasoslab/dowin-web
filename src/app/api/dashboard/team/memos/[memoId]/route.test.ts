import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockDeleteTeamMemo = vi.fn();

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
      deleteTeamMemo: mockDeleteTeamMemo,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/dashboard/storage/team-memo.storage", () => ({
  TeamMemoStorage: vi.fn(),
}));

describe("DELETE /api/dashboard/team/memos/:memoId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/dashboard/team/memos/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ memoId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("삭제 요청을 처리한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 11 });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/dashboard/team/memos/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ memoId: "1" }) },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteTeamMemo).toHaveBeenCalledWith(11, 1);
  });
});
