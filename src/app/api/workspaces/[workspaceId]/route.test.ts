import { ConflictError } from "@/lib/server/errors";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockResolveIdByUid = vi.fn();

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();

const mockUpdateWorkspace = vi.fn();
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
      updateWorkspace: mockUpdateWorkspace,
      deleteWorkspace: mockDeleteWorkspace,
    };
  }),
}));

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: mockRequireWorkspaceAccess,
}));
vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: mockAssertWorkspaceOperationAllowed,
}));

describe("PUT /api/workspaces/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(1);
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "ADMIN",
      entitlement: { planCode: "BASIC" },
    });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    mockResolveIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/workspaces/1", {
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
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "MEMBER",
      entitlement: { planCode: "BASIC" },
    });

    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/workspaces/1", {
        method: "PUT",
        body: JSON.stringify({ name: "새 이름" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(mockUpdateWorkspace).not.toHaveBeenCalled();
  });

  it("관리자면 워크스페이스 이름을 수정하고 200을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    mockUpdateWorkspace.mockResolvedValue({
      id: 1,
      name: "새 이름",
      planCode: "FREE",
      createdAt: new Date("2026-03-18T00:00:00.000Z"),
    });

    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/workspaces/1", {
        method: "PUT",
        body: JSON.stringify({ name: "새 이름" }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockUpdateWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 1, userId: 1, role: "ADMIN" }),
      { name: "새 이름" },
    );
  });
});

describe("DELETE /api/workspaces/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveIdByUid.mockResolvedValue(1);
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "ADMIN",
      entitlement: { planCode: "BASIC" },
    });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("관리자가 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "MEMBER",
      entitlement: { planCode: "BASIC" },
    });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(mockDeleteWorkspace).not.toHaveBeenCalled();
  });

  it("관리자면 워크스페이스를 삭제하고 204를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 1, userId: 1, role: "ADMIN" }),
    );
  });

  it("활성 구독이 있으면 409를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    mockDeleteWorkspace.mockRejectedValue(
      new ConflictError("WORKSPACE_ACTIVE_SUBSCRIPTION_DELETE_FORBIDDEN"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(409);
  });
});
