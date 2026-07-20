import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockRequireWorkspaceAccess = vi.fn();
const mockAssertWorkspaceOperationAllowed = vi.fn();
const mockGetMyBilling = vi.fn();

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
  WorkspaceStorage: vi.fn(function () {
    return { resolveIdByUid: vi.fn().mockResolvedValue(1) };
  }),
}));

vi.mock("@/domain/billing/storage/billing.storage", () => ({
  BillingStorage: vi.fn(),
}));

vi.mock("@/domain/billing/services/billing.service", () => ({
  BillingService: vi.fn(function MockBillingService() {
    return {
      getMyBilling: mockGetMyBilling,
    };
  }),
}));

describe("GET /api/billing/me", () => {
  beforeEach(() => {
    if (typeof mockRequireWorkspaceAccess !== "undefined")
      mockRequireWorkspaceAccess.mockResolvedValue({
        workspaceId: 1,
        userId: 1,
        role: "MEMBER",
        entitlement: { planCode: "BASIC" },
      });
    if (typeof mockAssertWorkspaceOperationAllowed !== "undefined")
      mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws_uid", id: "1" }),
    } as unknown as { params: Promise<{ workspaceId: string }> });

    expect(response.status).toBe(401);
  });

  it("세션이 있으면 현재 billing 상태를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockRequireWorkspaceAccess.mockResolvedValue({
      workspaceId: 1,
      userId: 1,
      role: "MEMBER",
      entitlement: { planCode: "BASIC" },
    });
    mockAssertWorkspaceOperationAllowed.mockResolvedValue(undefined);
    mockGetMyBilling.mockResolvedValue({
      workspaceId: 1,
      workspaceName: "Dowin",
      planCode: "FREE",
      billingStatus: "NONE",
      entitlementSource: null,
      provider: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      billingOwnerUserId: null,
      recentRefundCount: 0,
      recentRevokedCount: 0,
      requiresManualReview: false,
      canManageBilling: true,
    });

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws_uid", id: "1" }),
    } as unknown as { params: Promise<{ workspaceId: string }> });
    const body = (await response.json()) as { workspaceId: number };

    expect(response.status).toBe(200);
    expect(body.workspaceId).toBe(1);
    expect(mockGetMyBilling).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 1, userId: 1 }),
    );
  });
});
