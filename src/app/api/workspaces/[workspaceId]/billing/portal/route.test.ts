import { ConflictError } from "@/lib/server/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws_uid" }),
    });

    expect(response.status).toBe(401);
  });

  it("portal url이 있으면 redirect한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockResolvedValue("https://example.com/portal");

    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws_uid" }),
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/portal");
  });

  it("JSON 요청이면 portal url을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockResolvedValue("https://example.com/portal");

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost", {
        headers: {
          accept: "application/json",
        },
      }),
      {
        params: Promise.resolve({ workspaceId: "ws_uid" }),
      },
    );

    await expect(response.json()).resolves.toEqual({
      portalUrl: "https://example.com/portal",
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("JSON 요청에서 연동 전이면 에러 응답을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockRejectedValue(new ConflictError("BILLING_NOT_READY"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/ws_uid/billing/portal", {
        headers: {
          accept: "application/json",
        },
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );

    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "BILLING_NOT_READY",
      },
    });
    expect(response.status).toBe(409);
    expect(response.headers.get("location")).toBeNull();
  });

  it("연동 전에는 기존 billing 화면으로 redirect한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockRejectedValue(new ConflictError("BILLING_NOT_READY"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/ws_uid/billing/portal", {
        headers: {
          referer: "http://localhost/ko/ws_uid/workspace/billing",
        },
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/ko/ws_uid/workspace/billing?billing=portal_error&code=BILLING_NOT_READY",
    );
  });

  it("referer가 없으면 workspace billing fallback으로 redirect한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockGetPortalUrl.mockRejectedValue(new ConflictError("BILLING_NOT_READY"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/workspaces/ws_uid/billing/portal"),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/ws_uid/workspace/billing?billing=portal_error&code=BILLING_NOT_READY",
    );
  });
});
