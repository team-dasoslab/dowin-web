import { describe, expect, it, vi } from "vitest";
import { WorkspaceCheckoutService } from "@/domain/workspace/services/workspace-checkout.service";
import type { PolarBillingClient } from "@/domain/billing/polar";

type WorkspacePort = ConstructorParameters<typeof WorkspaceCheckoutService>[0];
type BillingPort = ConstructorParameters<typeof WorkspaceCheckoutService>[1];

const createStorage = (
  overrides: Partial<WorkspacePort> = {},
): WorkspacePort => ({
  findWorkspaceById: vi.fn().mockResolvedValue(null),
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
    seats: null,
  }),
  updateSubscriptionSeats: vi.fn(),
  findSubscriptionByCheckoutId: vi.fn().mockResolvedValue(null),
  findSubscriptionSeatMemberId: vi.fn().mockResolvedValue(null),
  assignSubscriptionSeat: vi.fn().mockResolvedValue(null),
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
        minSeats: 5,
        maxSeats: 5,
        successPath: "/workspace/checkout/success",
        workspaceCheckoutId: "pending_ws_1",
      }),
    );
  });

  it("이미 다른 워크스페이스에 속한 사용자도 새 checkout을 생성할 수 있다", async () => {
    const storage = createStorage();
    const billingStorage = createBillingStorage();
    const polarClient = createPolarClient();
    const service = new WorkspaceCheckoutService(
      storage,
      billingStorage,
      polarClient,
    );

    await expect(
      service.prepareWorkspaceCheckout({
        userId: 9,
        workspaceName: "새 운영팀",
        seatCount: 3,
        locale: "ko",
        idempotencyKey: "idem-2",
        now: new Date("2026-05-28T00:00:00.000Z"),
      }),
    ).resolves.toEqual({
      workspaceCheckoutId: "pending_ws_1",
      checkoutUrl: "https://polar.test/checkout",
    });
  });

  it("같은 사용자의 기존 pending checkout이 있어도 새 idempotency 요청은 새 seatCount로 checkout을 생성한다", async () => {
    const storage = createStorage();
    const polarClient = createPolarClient();
    const service = new WorkspaceCheckoutService(
      storage,
      createBillingStorage(),
      polarClient,
    );

    await service.prepareWorkspaceCheckout({
      userId: 9,
      workspaceName: "좌석 1명 팀",
      seatCount: 1,
      locale: "ko",
      idempotencyKey: "new-seat-1",
      now: new Date("2026-05-28T00:00:00.000Z"),
    });

    expect(polarClient.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        seats: 1,
        minSeats: 1,
        maxSeats: 1,
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

  it("완료된 checkout 재진입 시 completed workspace id로 워크스페이스를 반환한다", async () => {
    const storage = createStorage({
      findPendingWorkspaceCheckoutByUid: vi.fn().mockResolvedValue({
        id: 10,
        uid: "pending_ws_1",
        userId: 9,
        workspaceName: "운영팀",
        requestedSeatCount: 5,
        status: "COMPLETED",
        providerCheckoutId: "checkout_1",
        completedWorkspaceId: 33,
        expiresAt: new Date("2026-05-28T01:00:00.000Z"),
      }),
      findWorkspaceById: vi.fn().mockResolvedValue({
        id: 33,
        uid: "ws_completed",
      }),
    });
    const service = new WorkspaceCheckoutService(
      storage,
      createBillingStorage(),
      createPolarClient(),
    );

    await expect(
      service.completeWorkspaceCheckout({
        userId: 9,
        workspaceCheckoutId: "pending_ws_1",
        now: new Date("2026-05-28T00:10:00.000Z"),
      }),
    ).resolves.toEqual({ workspaceId: "ws_completed" });
    expect(storage.findWorkspaceById).toHaveBeenCalledWith(33);
  });

  it("checkout detail에 실제 seat 수가 있으면 요청 seat 대신 실제 결제 seat로 provision한다", async () => {
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
      createPolarClient({
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
          seats: 7,
        }),
      }),
    );

    await service.completeWorkspaceCheckout({
      userId: 9,
      workspaceCheckoutId: "pending_ws_1",
      checkoutId: "checkout_1",
      now: new Date("2026-05-28T00:10:00.000Z"),
    });

    expect(storage.provisionCompletedWorkspaceCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        purchasedSeatCount: 7,
      }),
    );
  });

  it("checkout detail의 subscription id가 늦게 채워지면 재조회 후 provision한다", async () => {
    const getCheckoutSession = vi
      .fn()
      .mockResolvedValueOnce({
        checkoutId: "checkout_1",
        status: "succeeded",
        metadata: {
          flow: "workspace_setup",
          workspaceCheckoutId: "pending_ws_1",
        },
        externalCustomerId: "workspace-checkout:pending_ws_1",
        customerKey: "cus_1",
        subscriptionKey: null,
        seats: 5,
      })
      .mockResolvedValueOnce({
        checkoutId: "checkout_1",
        status: "succeeded",
        metadata: {
          flow: "workspace_setup",
          workspaceCheckoutId: "pending_ws_1",
        },
        externalCustomerId: "workspace-checkout:pending_ws_1",
        customerKey: "cus_1",
        subscriptionKey: "sub_1",
        seats: 5,
      });
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
      createPolarClient({ getCheckoutSession }),
      { verifyRetryDelayMs: 0 },
    );

    await service.completeWorkspaceCheckout({
      userId: 9,
      workspaceCheckoutId: "pending_ws_1",
      checkoutId: "checkout_1",
      now: new Date("2026-05-28T00:10:00.000Z"),
    });

    expect(getCheckoutSession).toHaveBeenCalledTimes(2);
    expect(storage.provisionCompletedWorkspaceCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        subscriptionKey: "sub_1",
      }),
    );
  });

  it("checkout detail에 subscription id가 없으면 checkout id로 subscription을 조회해 provision한다", async () => {
    const getCheckoutSession = vi.fn().mockResolvedValue({
      checkoutId: "checkout_1",
      status: "succeeded",
      metadata: {
        flow: "workspace_setup",
        workspaceCheckoutId: "pending_ws_1",
      },
      externalCustomerId: "workspace-checkout:pending_ws_1",
      customerKey: "cus_checkout",
      subscriptionKey: null,
      seats: null,
    });
    const findSubscriptionByCheckoutId = vi.fn().mockResolvedValue({
      subscriptionKey: "sub_from_checkout",
      customerKey: "cus_subscription",
      seats: 7,
    });
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
      createPolarClient({
        getCheckoutSession,
        findSubscriptionByCheckoutId,
      }),
      {
        verifyRetryCount: 0,
        verifyRetryDelayMs: 0,
      },
    );

    await service.completeWorkspaceCheckout({
      userId: 9,
      workspaceCheckoutId: "pending_ws_1",
      checkoutId: "checkout_1",
      now: new Date("2026-05-28T00:10:00.000Z"),
    });

    expect(findSubscriptionByCheckoutId).toHaveBeenCalledWith({
      checkoutId: "checkout_1",
    });
    expect(storage.provisionCompletedWorkspaceCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        purchasedSeatCount: 7,
        customerKey: "cus_checkout",
        subscriptionKey: "sub_from_checkout",
      }),
    );
  });

  it("checkout detail과 subscription fallback 모두 구독키를 찾지 못하면 workspace를 provision하지 않는다", async () => {
    const getCheckoutSession = vi.fn().mockResolvedValue({
      checkoutId: "checkout_1",
      status: "succeeded",
      metadata: {
        flow: "workspace_setup",
        workspaceCheckoutId: "pending_ws_1",
      },
      externalCustomerId: "workspace-checkout:pending_ws_1",
      customerKey: "cus_1",
      subscriptionKey: null,
      seats: 5,
    });
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
      createPolarClient({ getCheckoutSession }),
      {
        verifyRetryCount: 1,
        verifyRetryDelayMs: 0,
      },
    );

    await expect(
      service.completeWorkspaceCheckout({
        userId: 9,
        workspaceCheckoutId: "pending_ws_1",
        checkoutId: "checkout_1",
        now: new Date("2026-05-28T00:10:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "WORKSPACE_CHECKOUT_NOT_READY",
      statusCode: 409,
    });
    expect(getCheckoutSession).toHaveBeenCalledTimes(3);
    expect(storage.provisionCompletedWorkspaceCheckout).not.toHaveBeenCalled();
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

  it("결제를 시작한 사용자와 현재 세션 사용자가 다르면 명시적으로 거절한다", async () => {
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
    });
    const service = new WorkspaceCheckoutService(
      storage,
      createBillingStorage(),
      createPolarClient(),
    );

    await expect(
      service.completeWorkspaceCheckout({
        userId: 10,
        workspaceCheckoutId: "pending_ws_1",
        checkoutId: "checkout_1",
        now: new Date("2026-05-28T00:10:00.000Z"),
      }),
    ).rejects.toMatchObject({
      code: "WORKSPACE_CHECKOUT_OWNER_MISMATCH",
      statusCode: 403,
    });
  });
});
