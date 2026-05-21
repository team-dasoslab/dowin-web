import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockRequireAdminSession = vi.fn();
const mockRequireAnyAdminRole = vi.fn();
const mockGetWorkspaceDetail = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/admin-authz", () => ({
  requireAdminSession: mockRequireAdminSession,
  requireAnyAdminRole: mockRequireAnyAdminRole,
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
      getWorkspaceDetail: mockGetWorkspaceDetail,
    };
  }),
}));

describe("GET /api/admin/billing/workspaces/[workspaceId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockRequireAdminSession.mockResolvedValue({ adminUserId: 1 });
    mockRequireAnyAdminRole.mockResolvedValue({ role: "SUPPORT_ADMIN" });
  });

  it("운영 billing 상세를 반환한다", async () => {
    mockGetWorkspaceDetail.mockResolvedValue({
      workspaceId: 3,
      workspaceName: "Dowin",
      planCode: "STANDARD",
      billingStatus: "ACTIVE",
      entitlementSource: "POLAR",
      events: [],
    });

    const { GET } = await import("./route");
    const response = await GET(new Request("https://example.com"), {
      params: Promise.resolve({ workspaceId: "3" }),
    });
    const body = (await response.json()) as { workspaceId: number };

    expect(response.status).toBe(200);
    expect(body.workspaceId).toBe(3);
    expect(mockGetWorkspaceDetail).toHaveBeenCalledWith(3);
  });
});
