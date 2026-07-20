import { ForbiddenError } from "@/lib/server/errors";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockRequireWorkspaceMember = vi.fn();
const mockResolveWorkspaceIdByUid = vi.fn();
const mockListTags = vi.fn();
const mockCreateTag = vi.fn();

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

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(function () { return { resolveIdByUid: vi.fn().mockResolvedValue(1) }; }),
}));

vi.mock("@/domain/workspace/services/workspace.service", () => ({
  WorkspaceService: vi.fn(function MockWorkspaceService() {
    return {
      resolveWorkspaceIdByUid: mockResolveWorkspaceIdByUid,
      listTags: mockListTags,
      createTag: mockCreateTag,
    };
  }),
}));

describe("GET /api/workspaces/[id]/tags", () => {
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

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces/1/tags"), {
      params: Promise.resolve({ workspaceId: "1" }),
    });

    expect(response.status).toBe(401);
  });

  it("워크스페이스 멤버가 아니면 403을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAccess.mockResolvedValue({ workspaceId: 1, userId: 1, role: "MEMBER", entitlement: { planCode: "BASIC" } });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    mockRequireWorkspaceAccess.mockRejectedValue(new ForbiddenError("FORBIDDEN"));

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces/1/tags"), {
      params: Promise.resolve({ workspaceId: "1" }),
    });

    expect(response.status).toBe(403);
    expect(mockListTags).not.toHaveBeenCalled();
  });

  it("워크스페이스 멤버면 태그 목록을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceMember.mockResolvedValue({
      id: 1,
      userId: 1,
      role: "MEMBER",
    });
    mockListTags.mockResolvedValue([{ id: 1, name: "운동" }]);

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workspaces/1/tags"), {
      params: Promise.resolve({ workspaceId: "1" }),
    });

    expect(response.status).toBe(200);
    expect(mockListTags).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }));
  });
});

describe("POST /api/workspaces/[id]/tags", () => {
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

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/1/tags", {
        method: "POST",
        body: JSON.stringify({ name: "운동" }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("워크스페이스 멤버면 태그를 생성하고 201을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 7 });
    mockRequireWorkspaceMember.mockResolvedValue({
      id: 1,
      userId: 7,
      role: "MEMBER",
    });
    mockCreateTag.mockResolvedValue({ id: 3, name: "Deep Work" });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/workspaces/1/tags", {
        method: "POST",
        body: JSON.stringify({ name: " Deep   Work " }),
        headers: { "Content-Type": "application/json" },
      }),
      { params: Promise.resolve({ workspaceId: "1" }) },
    );

    expect(response.status).toBe(201);
    expect(mockCreateTag).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 1 }), {
      name: "Deep   Work",
      normalizedName: "deep work",
    });
  });
});
