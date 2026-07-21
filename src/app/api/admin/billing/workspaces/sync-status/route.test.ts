import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockRequireAdminSession = vi.fn();
const mockRequireAdminRole = vi.fn();
const mockSyncAllWorkspaceBillingStatuses = vi.fn();

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
      syncAllWorkspaceBillingStatuses: mockSyncAllWorkspaceBillingStatuses,
    };
  }),
}));

describe("POST /api/admin/billing/workspaces/sync-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockRequireAdminSession.mockResolvedValue({ adminUserId: 1 });
    mockRequireAdminRole.mockResolvedValue({ role: "SYSTEM_ADMIN" });
  });

  it("system admin이 billing 상태 전체 동기화를 실행한다", async () => {
    mockSyncAllWorkspaceBillingStatuses.mockResolvedValue({
      syncedCount: 2,
      workspaceIds: [3, 4],
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("https://example.com/api/admin/billing/workspaces/sync-status", {
        method: "POST",
      }),
      { params: Promise.resolve({}) },
    );
    const body = (await response.json()) as {
      syncedCount: number;
      workspaceIds: number[];
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({ syncedCount: 2, workspaceIds: [3, 4] });
    expect(mockSyncAllWorkspaceBillingStatuses).toHaveBeenCalledWith(1);
  });
});
