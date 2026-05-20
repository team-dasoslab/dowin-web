import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGetMyBilling = vi.fn();

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
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("세션이 있으면 현재 billing 상태를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
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
    const response = await GET();
    const body = (await response.json()) as { workspaceId: number };

    expect(response.status).toBe(200);
    expect(body.workspaceId).toBe(1);
    expect(mockGetMyBilling).toHaveBeenCalledWith(1);
  });
});
