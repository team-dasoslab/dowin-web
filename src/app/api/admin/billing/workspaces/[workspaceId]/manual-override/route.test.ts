import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockRequireAdminSession = vi.fn();
const mockRequireAdminRole = vi.fn();
const mockApplyManualOverride = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/admin-authz", () => ({
  requireAdminSession: mockRequireAdminSession,
  requireAdminRole: mockRequireAdminRole,
}));

vi.mock("@/domain/billing/storage/billing.storage", () => ({
  BillingStorage: vi.fn(),
}));

vi.mock("@/domain/audit/storage/audit-log.storage", () => ({
  AuditLogStorage: vi.fn(),
}));

vi.mock("@/domain/billing/services/admin-billing.service", () => ({
  AdminBillingService: vi.fn(function MockAdminBillingService() {
    return {
      applyManualOverride: mockApplyManualOverride,
    };
  }),
}));

describe("POST /api/admin/billing/workspaces/[workspaceId]/manual-override", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockRequireAdminSession.mockResolvedValue({ adminUserId: 1 });
    mockRequireAdminRole.mockResolvedValue({ role: "SYSTEM_ADMIN" });
  });

  it("system admin이 billing 수동 보정을 실행한다", async () => {
    mockApplyManualOverride.mockResolvedValue({
      workspaceId: 3,
      workspaceName: "Dowin",
      planCode: "STANDARD",
      billingStatus: "ACTIVE",
      events: [],
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://example.com", {
        method: "POST",
        body: JSON.stringify({
          planCode: "STANDARD",
          billingStatus: "ACTIVE",
          customerKey: "cus_123",
          subscriptionKey: "sub_123",
          currentPeriodEnd: "2026-05-31T00:00:00.000Z",
          changeReason: "웹훅 누락 수동 보정",
        }),
      }),
      {
        params: Promise.resolve({ workspaceId: "3" }),
      },
    );
    const body = (await response.json()) as { workspaceId: number };

    expect(response.status).toBe(200);
    expect(body.workspaceId).toBe(3);
    expect(mockApplyManualOverride).toHaveBeenCalledWith(1, 3, {
      planCode: "STANDARD",
      billingStatus: "ACTIVE",
      customerKey: "cus_123",
      subscriptionKey: "sub_123",
      currentPeriodEnd: "2026-05-31T00:00:00.000Z",
      changeReason: "웹훅 누락 수동 보정",
    });
  });
});
