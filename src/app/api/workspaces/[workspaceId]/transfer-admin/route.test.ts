import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockResolveIdByUid = vi.fn();

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();

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

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function MockWorkspaceStorage() {
    return { resolveIdByUid: mockResolveIdByUid };
    //
    return {
      resolveIdByUid: mockResolveIdByUid,
    };
  }),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      transferAdmin: mockTransferAdmin,
    };
  }),
}));

vi.mock("@/lib/server/workspace-context", () => ({
  requireWorkspaceAccess: mockRequireWorkspaceAccess,
}));
vi.mock("@/domain/workspace/plan-limits", () => ({
  assertWorkspaceOperationAllowed: mockAssertWorkspaceOperationAllowed,
}));

describe("POST /api/workspaces/:id/transfer-admin", () => {
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

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/1/transfer-admin", {
        method: "POST",
        body: JSON.stringify({ memberId: 9 }),
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

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/1/transfer-admin", {
        method: "POST",
        body: JSON.stringify({ memberId: 9 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(403);
    expect(mockTransferAdmin).not.toHaveBeenCalled();
  });

  it("관리자면 권한을 이전하고 200을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/1/transfer-admin", {
        method: "POST",
        body: JSON.stringify({ memberId: 9 }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(200);
    expect(mockTransferAdmin).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }), 9);
  });
});
