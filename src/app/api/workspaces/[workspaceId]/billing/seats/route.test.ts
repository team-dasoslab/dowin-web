import { ConflictError } from "@/lib/server/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCloudflareContext = vi.fn();
const mockGetDb = vi.fn();
const mockGetSessionWithRefresh = vi.fn();
const mockUpdateSubscriptionSeats = vi.fn();

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
      updateSubscriptionSeats: mockUpdateSubscriptionSeats,
    };
  }),
}));

describe("PATCH /api/workspaces/[workspaceId]/billing/seats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCloudflareContext.mockReturnValue({ env: { DB: {} } });
    mockGetDb.mockReturnValue({});
  });

  it("세션이 없으면 401을 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(new Request("http://localhost"), {
      params: Promise.resolve({ workspaceId: "ws_uid" }),
    });

    expect(response.status).toBe(401);
  });

  it("seatCount가 유효하지 않으면 422를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ seatCount: 0 }),
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(mockUpdateSubscriptionSeats).not.toHaveBeenCalled();
  });

  it("구독 seat 변경 요청 결과를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockUpdateSubscriptionSeats.mockResolvedValue({
      seatCount: 5,
      appliedSeatCount: 5,
      pendingSeatCount: null,
    });

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ seatCount: 5 }),
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );
    const body = (await response.json()) as {
      seatCount: number;
      appliedSeatCount: number | null;
      pendingSeatCount: number | null;
    };

    expect(response.status).toBe(200);
    expect(body).toEqual({
      seatCount: 5,
      appliedSeatCount: 5,
      pendingSeatCount: null,
    });
    expect(mockUpdateSubscriptionSeats).toHaveBeenCalledWith({
      workspaceUid: "ws_uid",
      userId: 1,
      seatCount: 5,
    });
  });

  it("현재 멤버 수보다 낮은 seat 요청은 409를 반환한다", async () => {
    mockGetSessionWithRefresh.mockResolvedValue({ userId: 1 });
    mockUpdateSubscriptionSeats.mockRejectedValue(
      new ConflictError("BILLING_SEAT_COUNT_BELOW_MEMBER_COUNT"),
    );

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ seatCount: 2 }),
      }),
      { params: Promise.resolve({ workspaceId: "ws_uid" }) },
    );
    const body = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(409);
    expect(body.error.code).toBe("BILLING_SEAT_COUNT_BELOW_MEMBER_COUNT");
  });
});
