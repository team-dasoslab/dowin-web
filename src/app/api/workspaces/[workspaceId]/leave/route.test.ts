import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ConflictError } from "@/lib/server/errors";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockResolveWorkspaceIdByUid = vi.fn();
const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockResolveIdByUid = vi.fn();
const mockLeaveWorkspace = vi.fn();

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
      leaveWorkspace: mockLeaveWorkspace,
    };
  }),
}));

describe("DELETE /api/workspaces/:id/leave", () => {
  beforeEach(() => {
    if (typeof mockRequireWorkspaceAccess !== "undefined") mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    if (typeof mockAssertWorkspaceOperationAllowed !== "undefined") mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockResolveWorkspaceIdByUid.mockResolvedValue(1);
    mockResolveIdByUid.mockResolvedValue(1);
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1/leave", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("ADMIN이 바로 탈퇴하려 하면 409를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    mockLeaveWorkspace.mockRejectedValue(
      new ConflictError("ADMIN_TRANSFER_REQUIRED"),
    );

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1/leave", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(409);
  });

  it("MEMBER면 탈퇴하고 204를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockLeaveWorkspace.mockResolvedValue(undefined);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new NextRequest("http://localhost/api/workspaces/1/leave", {
        method: "DELETE",
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(204);
    expect(mockLeaveWorkspace).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1, userId: 1 }));
  });
});
