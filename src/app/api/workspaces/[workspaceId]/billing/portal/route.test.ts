import { ConflictError } from "@/lib/server/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockGetPortalUrl = vi.fn();

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
      getPortalUrl: mockGetPortalUrl,
    };
  }),
}));

describe("GET /api/billing/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ workspaceId: "ws_uid", id: "1" }) } as unknown as { params: Promise<Record<string, string>> });

    expect(response.status).toBe(401);
  });

  it("portal url이 있으면 redirect한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockResolvedValue("https://example.com/portal");

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ workspaceId: "ws_uid", id: "1" }) } as unknown as { params: Promise<Record<string, string>> });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/portal");
  });

  it("연동 전에는 409 billing not ready를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockRejectedValue(new ConflictError("BILLING_NOT_READY"));

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ workspaceId: "ws_uid", id: "1" }) } as unknown as { params: Promise<Record<string, string>> });
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("BILLING_NOT_READY");
  });
});
