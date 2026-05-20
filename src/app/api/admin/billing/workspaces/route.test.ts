import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockRequireAdminSession = vi.fn();
const mockRequireAnyAdminRole = vi.fn();
const mockListWorkspaces = vi.fn();

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
      listWorkspaces: mockListWorkspaces,
    };
  }),
}));

describe("GET /api/admin/billing/workspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockRequireAdminSession.mockResolvedValue({ adminUserId: 1 });
    mockRequireAnyAdminRole.mockResolvedValue({ role: "SUPPORT_ADMIN" });
  });

  it("운영 billing 목록을 반환한다", async () => {
    mockListWorkspaces.mockResolvedValue([
      {
        workspaceId: 3,
        workspaceName: "Dowin",
        planCode: "STANDARD",
        billingStatus: "ACTIVE",
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("https://example.com/api/admin/billing/workspaces?workspaceName=Dowin"),
    );
    const body = (await response.json()) as Array<{ workspaceId: number }>;

    expect(response.status).toBe(200);
    expect(body[0]?.workspaceId).toBe(3);
    expect(mockListWorkspaces).toHaveBeenCalledWith({
      workspaceName: "Dowin",
    });
  });
});
