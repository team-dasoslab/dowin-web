import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockLeaveWorkspace = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      leaveWorkspace: mockLeaveWorkspace,
    };
  }),
}));

describe("DELETE /api/workspaces/:id/leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1/leave", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("ADMIN이 바로 탈퇴하려 하면 409를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockLeaveWorkspace.mockRejectedValue(
      new ConflictError("ADMIN_TRANSFER_REQUIRED"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1/leave", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(409);
  });

  it("MEMBER면 탈퇴하고 204를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockLeaveWorkspace.mockResolvedValue(undefined);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1/leave", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(204);
    expect(mockLeaveWorkspace).toHaveBeenCalledWith(1, 1);
  });
});
