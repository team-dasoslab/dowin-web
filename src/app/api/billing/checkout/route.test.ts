import { ConflictError } from "@/lib/server/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockPrepareCheckout = vi.fn();

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
      prepareCheckout: mockPrepareCheckout,
    };
  }),
}));

describe("POST /api/billing/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/billing/checkout", { method: "POST" }),
    );

    expect(response.status).toBe(401);
  });

  it("Idempotency-Key가 없으면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ locale: "ko" }),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("locale body가 없으면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: {
          "Idempotency-Key": "req-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(422);
  });

  it("연동 전에는 409 billing not ready를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockPrepareCheckout.mockRejectedValue(new ConflictError("BILLING_NOT_READY"));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: {
          "Idempotency-Key": "req-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: "ko" }),
      }),
    );
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("BILLING_NOT_READY");
  });

  it("수동 검토 대상이면 409 billing review required를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockPrepareCheckout.mockRejectedValue(
      new ConflictError("BILLING_REVIEW_REQUIRED"),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: {
          "Idempotency-Key": "req-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: "ko" }),
      }),
    );
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("BILLING_REVIEW_REQUIRED");
  });

  it("locale를 포함해 checkout 준비를 요청한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockPrepareCheckout.mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/billing/checkout", {
        method: "POST",
        headers: {
          "Idempotency-Key": "req-1",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locale: "en" }),
      }),
    );
    const body = (await response.json()) as { checkoutUrl: string };

    expect(response.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://polar.sh/checkout");
    expect(mockPrepareCheckout).toHaveBeenCalledWith(1, "req-1", "en");
  });
});
