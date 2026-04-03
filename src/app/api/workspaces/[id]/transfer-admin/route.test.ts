import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAdminInWorkspace = vi.fn();
const mockTransferAdmin = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/authz", () => ({
  requireWorkspaceAdminInWorkspace: mockRequireWorkspaceAdminInWorkspace,
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      transferAdmin: mockTransferAdmin,
    };
  }),
}));

describe("POST /api/workspaces/:id/transfer-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/1/transfer-admin", {
        method: "POST",
        body: JSON.stringify({ memberId: 9 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("관리자가 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockRejectedValue(
      new ForbiddenError("FORBIDDEN"),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/1/transfer-admin", {
        method: "POST",
        body: JSON.stringify({ memberId: 9 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(mockTransferAdmin).not.toHaveBeenCalled();
  });

  it("관리자면 권한을 이전하고 200을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockResolvedValue({
      workspaceId: 1,
      role: "ADMIN",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/workspaces/1/transfer-admin", {
        method: "POST",
        body: JSON.stringify({ memberId: 9 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ id: "1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockTransferAdmin).toHaveBeenCalledWith(1, 1, 9);
  });
});
