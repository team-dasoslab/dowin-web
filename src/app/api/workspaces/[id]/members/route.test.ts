import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSession = vi.fn();
const mockRequireWorkspaceAdminInWorkspace = vi.fn();
const mockGetMembers = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSession: mockGetSession,
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
    getMembers: mockGetMembers,
    };
  }),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/lib/server/authz", () => ({
  requireWorkspaceAdminInWorkspace: mockRequireWorkspaceAdminInWorkspace,
}));

describe("GET /api/workspaces/:id/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/workspaces/1/members"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("해당 워크스페이스 ADMIN이 아니면 403을 반환한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockRejectedValue(
      new ForbiddenError("FORBIDDEN"),
    );

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/workspaces/1/members"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(403);
    expect(mockGetMembers).not.toHaveBeenCalled();
  });

  it("해당 워크스페이스 ADMIN이면 목록을 반환한다", async () => {
    mockGetSession.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "ADMIN",
    });
    mockGetMembers.mockResolvedValue([{ userId: 1, nickname: "관리자" }]);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/workspaces/1/members"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(200);
    expect(mockGetMembers).toHaveBeenCalledWith(1, 1);
  });
});
