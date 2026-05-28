import { describe, expect, it, vi } from "vitest";
import { WorkspaceCheckoutService } from "@/domain/workspace/services/workspace-checkout.service";
import type { PolarBillingClient } from "@/domain/billing/polar";

type WorkspacePort = ConstructorParameters<typeof WorkspaceCheckoutService>[0];
type BillingPort = ConstructorParameters<typeof WorkspaceCheckoutService>[1];

const createStorage = (
  overrides: Partial<WorkspacePort> = {},
): WorkspacePort => ({
  findUserWorkspace: vi.fn().mockResolvedValue(null),
  findActivePendingWorkspaceCheckoutByUserId: vi.fn().mockResolvedValue(null),
  findPendingWorkspaceCheckoutByRequestId: vi.fn().mockResolvedValue(null),
  findPendingWorkspaceCheckoutByUid: vi.fn(),
  createPendingWorkspaceCheckout: vi.fn().mockResolvedValue({
    id: 10,
    uid: "pending_ws_1",
  }),
  markPendingWorkspaceCheckoutCreated: vi.fn().mockResolvedValue({
    uid: "pending_ws_1",
  }),
  markPendingWorkspaceCheckoutFailed: vi.fn(),
  provisionCompletedWorkspaceCheckout: vi.fn(),
  ...overrides,
});

const createBillingStorage = (
  overrides: Partial<BillingPort> = {},
): BillingPort => ({
  findActiveProviderProduct: vi.fn().mockResolvedValue({
    providerProductId: "prod_basic",
  }),
  ...overrides,
});

const createPolarClient = (
  overrides: Partial<PolarBillingClient> = {},
): PolarBillingClient => ({
  environment: "sandbox",
  createCheckoutSession: vi.fn().mockResolvedValue({
    checkoutId: "checkout_1",
    checkoutUrl: "https://polar.test/checkout",
  }),
  createCustomerSession: vi.fn(),
  getCheckoutSession: vi.fn().mockResolvedValue({
    checkoutId: "checkout_1",
    status: "succeeded",
    metadata: {
      flow: "workspace_setup",
      workspaceCheckoutId: "pending_ws_1",
    },
    externalCustomerId: "workspace-checkout:pending_ws_1",
    customerKey: "cus_1",
    subscriptionKey: "sub_1",
  }),
  ...overrides,
});

describe("WorkspaceCheckoutService", () => {
  it("Basic seat 워크스페이스 checkout을 생성한다", async () => {
    const storage = createStorage();
    const billingStorage = createBillingStorage();
    const polarClient = createPolarClient();
    const service = new WorkspaceCheckoutService(
      storage,
      billingStorage,
      polarClient,
    );

    const result = await service.prepareWorkspaceCheckout({
      userId: 9,
      workspaceName: "운영팀",
      seatCount: 5,
      locale: "ko",
      idempotencyKey: "idem-1",
      now: new Date("2026-05-28T00:00:00.000Z"),
    });

    expect(result).toEqual({
      workspaceCheckoutId: "pending_ws_1",
      checkoutUrl: "https://polar.test/checkout",
    });
    expect(polarClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod_basic",
        externalCustomerId: "workspace-checkout:pending_ws_1",
        seats: 5,
        successPath: "/workspace/checkout/success",
        workspaceCheckoutId: "pending_ws_1",
      }),
    );
  });

  it("결제 성공 검증 후 Basic 워크스페이스를 provision한다", async () => {
    const storage = createStorage({
      findPendingWorkspaceCheckoutByUid: vi.fn().mockResolvedValue({
        id: 10,
        uid: "pending_ws_1",
        userId: 9,
        workspaceName: "운영팀",
        requestedSeatCount: 5,
        status: "CHECKOUT_CREATED",
        providerCheckoutId: "checkout_1",
        expiresAt: new Date("2026-05-28T01:00:00.000Z"),
      }),
      provisionCompletedWorkspaceCheckout: vi.fn().mockResolvedValue({
        id: 3,
        uid: "ws_public",
      }),
    });
    const service = new WorkspaceCheckoutService(
      storage,
      createBillingStorage(),
      createPolarClient(),
    );

    const result = await service.completeWorkspaceCheckout({
      userId: 9,
      workspaceCheckoutId: "pending_ws_1",
      checkoutId: "checkout_1",
      now: new Date("2026-05-28T00:10:00.000Z"),
    });

    expect(result).toEqual({ workspaceId: "ws_public" });
    expect(storage.provisionCompletedWorkspaceCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        pendingId: 10,
        pendingUid: "pending_ws_1",
        userId: 9,
        workspaceName: "운영팀",
        purchasedSeatCount: 5,
        customerKey: "cus_1",
        subscriptionKey: "sub_1",
      }),
    );
  });

  it("callback에 checkoutId가 없어도 pending row의 provider checkout id로 검증한다", async () => {
    const polarClient = createPolarClient();
    const storage = createStorage({
      findPendingWorkspaceCheckoutByUid: vi.fn().mockResolvedValue({
        id: 10,
        uid: "pending_ws_1",
        userId: 9,
        workspaceName: "운영팀",
        requestedSeatCount: 5,
        status: "CHECKOUT_CREATED",
        providerCheckoutId: "checkout_1",
        expiresAt: new Date("2026-05-28T01:00:00.000Z"),
      }),
      provisionCompletedWorkspaceCheckout: vi.fn().mockResolvedValue({
        id: 3,
        uid: "ws_public",
      }),
    });
    const service = new WorkspaceCheckoutService(
      storage,
      createBillingStorage(),
      polarClient,
    );

    await service.completeWorkspaceCheckout({
      userId: 9,
      workspaceCheckoutId: "pending_ws_1",
      now: new Date("2026-05-28T00:10:00.000Z"),
    });

    expect(polarClient.getCheckoutSession).toHaveBeenCalledWith({
      checkoutId: "checkout_1",
    });
  });
});
