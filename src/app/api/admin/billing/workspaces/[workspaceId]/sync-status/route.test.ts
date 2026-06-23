import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockRequireAdminSession = vi.fn();
const mockRequireAdminRole = vi.fn();
const mockSyncWorkspaceBillingStatus = vi.fn();

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
      syncWorkspaceBillingStatus: mockSyncWorkspaceBillingStatus,
    };
  }),
}));

describe("POST /api/admin/billing/workspaces/[workspaceId]/sync-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockRequireAdminSession.mockResolvedValue({ adminUserId: 1 });
    mockRequireAdminRole.mockResolvedValue({ role: "SYSTEM_ADMIN" });
  });

  it("system admin이 billing 상태 단건 동기화를 실행한다", async () => {
    mockSyncWorkspaceBillingStatus.mockResolvedValue({
      workspaceId: 3,
      workspaceName: "Dowin",
      planCode: "FREE",
      billingStatus: "EXPIRED",
      entitlementSource: "MANUAL_GRANT",
      events: [],
    });

    const { POST } = await import("./route");
    const response = await POST(new Request("https://example.com"), {
      params: Promise.resolve({ workspaceId: "3" }),
    });
    const body = (await response.json()) as { workspaceId: number };

    expect(response.status).toBe(200);
    expect(body.workspaceId).toBe(3);
    expect(mockSyncWorkspaceBillingStatus).toHaveBeenCalledWith(1, 3);
  });
});
