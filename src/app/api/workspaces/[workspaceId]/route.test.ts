import { ConflictError, ForbiddenError } from "@/lib/server/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAdminInWorkspace = vi.fn();
const mockResolveIdByUid = vi.fn();
const mockUpdateWorkspaceName = vi.fn();
const mockDeleteWorkspace = vi.fn();

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
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return {
      resolveIdByUid: mockResolveIdByUid,
    };
  }),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      updateWorkspaceName: mockUpdateWorkspaceName,
      deleteWorkspace: mockDeleteWorkspace,
    };
  }),
}));

vi.mock("@/lib/server/authz", () => ({
  requireWorkspaceAdminInWorkspace: mockRequireWorkspaceAdminInWorkspace,
}));

describe("PUT /api/workspaces/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/workspaces/1", {
        method: "PUT",
        body: JSON.stringify({ name: "새 이름" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("관리자가 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockRejectedValue(
      new ForbiddenError("FORBIDDEN"),
    );

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/workspaces/1", {
        method: "PUT",
        body: JSON.stringify({ name: "새 이름" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(mockUpdateWorkspaceName).not.toHaveBeenCalled();
  });

  it("관리자면 워크스페이스 이름을 수정하고 200을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockResolvedValue({
      id: 1,
      role: "ADMIN",
    });
    mockUpdateWorkspaceName.mockResolvedValue({
      id: 1,
      name: "새 이름",
      planCode: "FREE",
      createdAt: new Date("2026-03-18T00:00:00.000Z"),
    });

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/workspaces/1", {
        method: "PUT",
        body: JSON.stringify({ name: "새 이름" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockUpdateWorkspaceName).toHaveBeenCalledWith(1, "새 이름");
  });
});

describe("DELETE /api/workspaces/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("관리자가 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockRejectedValue(
      new ForbiddenError("FORBIDDEN"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(mockDeleteWorkspace).not.toHaveBeenCalled();
  });

  it("관리자면 워크스페이스를 삭제하고 204를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockResolvedValue({
      id: 1,
      role: "ADMIN",
    });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteWorkspace).toHaveBeenCalledWith(1);
  });

  it("활성 구독이 있으면 409를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAdminInWorkspace.mockResolvedValue({
      id: 1,
      role: "ADMIN",
    });
    mockDeleteWorkspace.mockRejectedValue(
      new ConflictError("WORKSPACE_ACTIVE_SUBSCRIPTION_DELETE_FORBIDDEN"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(409);
  });
});
