import { ConflictError } from "@/lib/server/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockStartBasicCheckout = vi.fn();

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: mockGetCloudflareContext,
}));

vi.mock("@/db", () => ({
  getDb: mockGetDb,
}));

vi.mock("@/lib/server/auth", () => ({
  getSessionWithRefresh: mockGetSessionWithRefresh,
}));

vi.mock("@/lib/server/restricted-test-account", () => ({
  guardRestrictedTestAccountWrite: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/domain/workspace/storage/workspace.storage", () => ({
  WorkspaceStorage: vi.fn(),
}));

vi.mock("@/domain/billing/storage/billing.storage", () => ({
  BillingStorage: vi.fn(),
}));

vi.mock("@/domain/billing/polar", () => ({
  createPolarBillingClient: vi.fn().mockReturnValue({ environment: "sandbox" }),
}));

vi.mock("@/domain/billing/services/billing.service", () => ({
  BillingService: vi.fn(function MockBillingService() {
    return {
      startBasicCheckout: mockStartBasicCheckout,
    };
  }),
}));

describe("POST /api/workspaces/[workspaceId]/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws_uid" }),
    });

    expect(response.status).toBe(401);
  });

  it("Idempotency-Key가 없으면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ seatCount: 2 }),
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockStartBasicCheckout).not.toHaveBeenCalled();
  });

  it("Basic checkout URL을 생성해 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockStartBasicCheckout.mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_123",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Idempotency-Key": "idem_1" },
        body: JSON.stringify({ seatCount: 3 }),
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );
    const body = (await response.json()) as {
      checkoutUrl: string;
      checkoutId: string;
    };

    expect(response.status).toBe(201);
    expect(body).toEqual({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_123",
    });
    expect(mockStartBasicCheckout).toHaveBeenCalledWith({
      workspaceUid: "ws_uid",
      userId: 1,
      seatCount: 3,
      locale: "ko",
      idempotencyKey: "idem_1",
    });
  });

  it("현재 상태에서 checkout을 열 수 없으면 409를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockStartBasicCheckout.mockRejectedValue(
      new ConflictError("BILLING_NOT_READY"),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "Idempotency-Key": "idem_2" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("BILLING_NOT_READY");
  });
});
