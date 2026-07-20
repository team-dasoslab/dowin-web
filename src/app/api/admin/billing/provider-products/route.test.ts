import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockRequireAdminSession = vi.fn();
const mockRequireAdminRole = vi.fn();
const mockRequireAnyAdminRole = vi.fn();
const mockListProviderProducts = vi.fn();
const mockUpsertProviderProduct = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/admin-authz", () => ({
  requireAdminSession: mockRequireAdminSession,
  requireAdminRole: mockRequireAdminRole,
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
      listProviderProducts: mockListProviderProducts,
      upsertProviderProduct: mockUpsertProviderProduct,
    };
  }),
}));

describe("/api/admin/billing/provider-products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
    mockRequireAdminSession.mockResolvedValue({ adminUserId: 1 });
    mockRequireAdminRole.mockResolvedValue({ role: "SYSTEM_ADMIN" });
    mockRequireAnyAdminRole.mockResolvedValue({ role: "SUPPORT_ADMIN" });
  });

  it("SYSTEM_ADMIN에게 provider product 목록을 반환한다", async () => {
    mockListProviderProducts.mockResolvedValue([
      {
        id: 9,
        provider: "POLAR",
        environment: "production",
        planCode: "BASIC",
        providerProductId: "prod_basic_live",
        isActive: true,
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET();
    const body = (await response.json()) as Array<{ providerProductId: string }>;

    expect(response.status).toBe(200);
    expect(body[0]?.providerProductId).toBe("prod_basic_live");
    expect(mockRequireAnyAdminRole).toHaveBeenCalledWith({}, 1, [
      "SUPPORT_ADMIN",
      "SYSTEM_ADMIN",
    ]);
  });

  it("provider product 매핑을 upsert한다", async () => {
    mockUpsertProviderProduct.mockResolvedValue({
      id: 9,
      provider: "POLAR",
      environment: "production",
      planCode: "BASIC",
      providerProductId: "prod_basic_live",
      isActive: true,
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("https://example.com/api/admin/billing/provider-products", {
        method: "POST",
        body: JSON.stringify({
          provider: "POLAR",
          environment: "production",
          planCode: "BASIC",
          providerProductId: "prod_basic_live",
          isActive: true,
          changeReason: "Basic product 등록",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );

    expect(response.status).toBe(200);
    expect(mockUpsertProviderProduct).toHaveBeenCalledWith(1, {
      provider: "POLAR",
      environment: "production",
      planCode: "BASIC",
      providerProductId: "prod_basic_live",
      isActive: true,
      changeReason: "Basic product 등록",
    });
  });
});
