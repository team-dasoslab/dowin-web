import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ForbiddenError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockRequireWorkspaceMember = vi.fn();
const mockResolveWorkspaceIdByUid = vi.fn();
const mockUpdateTag = vi.fn();
const mockDeleteTag = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: mockRequireWorkspaceAccess,
}));

vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: mockAssertWorkspaceOperationAllowed,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/authz", () => ({
  requireWorkspaceMember: mockRequireWorkspaceMember,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
  })),
  headers: vi.fn(async () => new Map()),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function () { return { resolveIdByUid: vi.fn().mockResolvedValue(1) }; }),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      resolveWorkspaceIdByUid: mockResolveWorkspaceIdByUid,
      updateTag: mockUpdateTag,
      deleteTag: mockDeleteTag,
    };
  }),
}));

describe("PUT /api/workspaces/[id]/tags/[tagId]", () => {
  beforeEach(() => {
    if (typeof mockRequireWorkspaceAccess !== "undefined") mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    if (typeof mockAssertWorkspaceOperationAllowed !== "undefined") mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveWorkspaceIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/workspaces/1/tags/3", {
        method: "PUT",
        body: JSON.stringify({ name: "건강" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ workspaceId: "1", tagId: "3" }) },
    );

    expect(response.status).toBe(401);
  });

  it("워크스페이스 멤버가 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    mockRequireWorkspaceAccess.mockRejectedValue(new ForbiddenError("FORBIDDEN"));

    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/workspaces/1/tags/3", {
        method: "PUT",
        body: JSON.stringify({ name: "건강" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ workspaceId: "1", tagId: "3" }) },
    );

    expect(response.status).toBe(403);
    expect(mockUpdateTag).not.toHaveBeenCalled();
  });

  it("워크스페이스 멤버면 태그 이름을 수정한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 5 });
    mockRequireWorkspaceMember.mockResolvedValue({
      id: 1,
      userId: 5,
      role: "MEMBER",
    });
    mockUpdateTag.mockResolvedValue({ id: 3, name: "Deep Work" });

    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/workspaces/1/tags/3", {
        method: "PUT",
        body: JSON.stringify({ name: " Deep   Work " }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ workspaceId: "1", tagId: "3" }) },
    );

    expect(response.status).toBe(200);
    expect(mockUpdateTag).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }), 3, {
      name: "Deep   Work",
      normalizedName: "deep work",
    });
  });
});

describe("DELETE /api/workspaces/[id]/tags/[tagId]", () => {
  beforeEach(() => {
    if (typeof mockRequireWorkspaceAccess !== "undefined") mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    if (typeof mockAssertWorkspaceOperationAllowed !== "undefined") mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveWorkspaceIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1/tags/3", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1", tagId: "3" }) },
    );

    expect(response.status).toBe(401);
  });

  it("워크스페이스 멤버면 태그를 삭제한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 5 });
    mockRequireWorkspaceMember.mockResolvedValue({
      id: 1,
      userId: 5,
      role: "MEMBER",
    });

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1/tags/3", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1", tagId: "3" }) },
    );

    expect(response.status).toBe(204);
    expect(mockDeleteTag).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }), 3);
  });
});
