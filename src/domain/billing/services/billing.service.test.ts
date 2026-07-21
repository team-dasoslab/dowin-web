import { ConflictError, ForbiddenError } from "@/lib/server/errors";
import { type WorkspaceAccessContext } from "@/lib/server/workspace-context";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BillingService } from "./billing.service";

describe("BillingService", () => {
  const ctx: WorkspaceAccessContext = {
    workspaceId: 1,
    workspacePublicId: "ws_abc",
    workspaceName: "My Workspace",
    userId: 100,
    role: "ADMIN",
    membershipId: 10,
    allowPastDailyLogEdit: false,
    entitlement: {
      canAccessBasicSubscription: true,
      entitlementSource: null,
      billingStatus: "ACTIVE",
      planCode: "BASIC",
    },
    capacity: {
      hasAvailableMemberSlot: true,
      isOverLimit: false,
    },
  };
  const memberCtx: WorkspaceAccessContext = {
    ...ctx,
    role: "MEMBER",
  };
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("billing state가 없으면 workspace planCode와 NONE 상태를 반환한다", async () => {
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
        countMembers: vi.fn().mockResolvedValue(1),
        findSeatEntitlement: vi.fn().mockResolvedValue(null),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
    );

    await expect(service.getMyBilling(ctx)).resolves.toEqual({
      workspaceId: "ws_abc",
      workspaceName: "Dowin",
      planCode: "BASIC",
      billingStatus: "NONE",
      entitlementSource: null,
      provider: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      billingOwnerUserId: null,
      recentRefundCount: 0,
      recentRevokedCount: 0,
      requiresManualReview: false,
      purchasedSeatCount: null,
      pendingSeatCount: null,
      pendingSeatEffectiveAt: null,
      usedSeatCount: 1,
      canManageBilling: true,
      promotionalDurationDays: null,
    });
  });

  it("seat entitlement가 있으면 결제 seat 수와 사용 seat 수를 반환한다", async () => {
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
        countMembers: vi.fn().mockResolvedValue(3),
        findSeatEntitlement: vi.fn().mockResolvedValue({
          purchasedSeatCount: 5,
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          provider: "POLAR",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          billingOwnerUserId: 7,
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
    );

    await expect(service.getMyBilling(ctx)).resolves.toMatchObject({
      purchasedSeatCount: 5,
      pendingSeatCount: null,
      pendingSeatEffectiveAt: null,
      usedSeatCount: 3,
    });
  });

  it("Polar 구독에 예약된 seat 변경이 있으면 overview에 포함한다", async () => {
    const getSubscriptionSeatUpdate = vi.fn().mockResolvedValue({
      subscriptionId: "sub_123",
      seats: 10,
      pendingSeats: 5,
    });
    const currentPeriodEnd = new Date("2026-07-01T00:00:00.000Z");
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
        countMembers: vi.fn().mockResolvedValue(5),
        findSeatEntitlement: vi.fn().mockResolvedValue({
          purchasedSeatCount: 10,
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          provider: "POLAR",
          subscriptionKey: "sub_123",
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          billingOwnerUserId: 7,
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate,
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(service.getMyBilling(ctx)).resolves.toMatchObject({
      purchasedSeatCount: 10,
      pendingSeatCount: 5,
      pendingSeatEffectiveAt: currentPeriodEnd.toISOString(),
    });
    expect(getSubscriptionSeatUpdate).toHaveBeenCalledWith({
      subscriptionId: "sub_123",
    });
  });

  it("Polar 현재 seat가 DB projection보다 최신이면 overview와 projection을 보정한다", async () => {
    const getSubscriptionSeatUpdate = vi.fn().mockResolvedValue({
      subscriptionId: "sub_123",
      seats: 20,
      pendingSeats: 5,
    });
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const currentPeriodEnd = new Date("2026-07-06T00:00:00.000Z");
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
        countMembers: vi.fn().mockResolvedValue(5),
        findSeatEntitlement: vi.fn().mockResolvedValue({
          purchasedSeatCount: 10,
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          provider: "POLAR",
          subscriptionKey: "sub_123",
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
          billingOwnerUserId: 7,
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        upsertWorkspaceSeatEntitlement,
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate,
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(service.getMyBilling(ctx)).resolves.toMatchObject({
      purchasedSeatCount: 20,
      pendingSeatCount: 5,
      pendingSeatEffectiveAt: currentPeriodEnd.toISOString(),
    });
    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith({
      workspaceId: 1,
      purchasedSeatCount: 20,
      seatSource: "POLAR",
    });
  });

  it("billing risk 조회는 workspace, customer, owner 범위를 함께 전달한다", async () => {
    const getRecentBillingRiskSummary = vi.fn().mockResolvedValue({
      recentRefundCount: 1,
      recentRevokedCount: 0,
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
          billingOwnerUserId: 7,
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
        countMembers: vi.fn().mockResolvedValue(2),
        findSeatEntitlement: vi.fn().mockResolvedValue(null),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          provider: "POLAR",
          customerKey: "cus_123",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          billingOwnerUserId: 9,
        }),
        getRecentBillingRiskSummary,
      } as never,
    );

    await service.getMyBilling(ctx);

    expect(getRecentBillingRiskSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 1,
        customerKey: "cus_123",
        customerExternalRef: "workspace:1",
        billingOwnerUserId: 9,
      }),
    );
  });

  it("manual grant 상태에서는 portal을 열 수 없다", async () => {
    const createCustomerSession = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: null,
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "MANUAL_GRANT",
          customerKey: null,
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(service.getPortalUrl(ctx)).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_NOT_READY",
      }),
    );
    expect(createCustomerSession).not.toHaveBeenCalled();
  });

  it("Polar entitlementSource면 portal session을 생성한다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const findSubscriptionSeatMemberId = vi.fn().mockResolvedValue("mem_123");
    const assignSubscriptionSeat = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "POLAR",
          customerKey: "cus_123",
          planCode: "BASIC",
          subscriptionKey: "sub_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId,
        assignSubscriptionSeat,
      },
    );

    await expect(service.getPortalUrl(ctx)).resolves.toBe("https://polar.sh/portal");
    expect(findSubscriptionSeatMemberId).toHaveBeenCalledWith({
      subscriptionId: "sub_123",
    });
    expect(assignSubscriptionSeat).not.toHaveBeenCalled();
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: "cus_123",
      memberId: "mem_123",
    });
  });

  it("seat 기반 team customer도 Polar customer session 생성에 위임한다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const findSubscriptionSeatMemberId = vi.fn().mockResolvedValue("mem_123");
    const assignSubscriptionSeat = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "POLAR",
          customerKey: "cus_123",
          subscriptionKey: "sub_123",
          planCode: "BASIC",
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId,
        assignSubscriptionSeat,
      },
    );

    await expect(service.getPortalUrl(ctx)).resolves.toBe("https://polar.sh/portal");
    expect(findSubscriptionSeatMemberId).toHaveBeenCalledWith({
      subscriptionId: "sub_123",
    });
    expect(assignSubscriptionSeat).not.toHaveBeenCalled();
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: "cus_123",
      memberId: "mem_123",
    });
  });

  it("subscription seat가 없으면 billing owner seat를 assign한 뒤 portal session을 생성한다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const findSubscriptionSeatMemberId = vi.fn().mockResolvedValue(null);
    const assignSubscriptionSeat = vi.fn().mockResolvedValue("mem_assigned");
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
          billingOwnerUserId: 9,
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "POLAR",
          customerKey: "cus_123",
          subscriptionKey: "sub_123",
          planCode: "BASIC",
          billingOwnerUserId: 7,
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId,
        assignSubscriptionSeat,
      },
    );

    await expect(service.getPortalUrl(ctx)).resolves.toBe("https://polar.sh/portal");
    expect(assignSubscriptionSeat).toHaveBeenCalledWith({
      subscriptionId: "sub_123",
      customerId: "cus_123",
    });
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: "cus_123",
      memberId: "mem_assigned",
    });
  });

  it("customerKey가 없으면 external customer id로 portal session을 만든다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(service.getPortalUrl(ctx)).resolves.toBe("https://polar.sh/portal");
    expect(createCustomerSession).toHaveBeenCalledWith({
      externalCustomerId: "workspace:1",
    });
  });

  it("NONE 상태의 관리자 워크스페이스는 Basic checkout을 시작할 수 있다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_123",
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembership: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
        countMembers: vi.fn().mockResolvedValue(3),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_basic",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.startBasicCheckout(ctx, {
        locale: "ko",
        idempotencyKey: "idem_1",
      }),
    ).resolves.toEqual({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_123",
    });
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod_basic",
        externalCustomerId: "workspace:1",
        idempotencyKey: "idem_1",
        locale: "ko",
        seats: 3,
        minSeats: 3,
        maxSeats: 999,
        successPath: "/billing/polar/success",
        metadata: expect.objectContaining({
          flow: "workspace_resubscribe",
          workspaceId: "1",
          workspaceUid: "ws_abc",
          requestedByUserId: "100",
          targetPlanCode: "BASIC",
          requestedSeatCount: "3",
        }),
      }),
    );
  });

  it("같은 customer나 billing owner의 최근 위험 이력이 있으면 Basic checkout을 막는다", async () => {
    const createCheckoutSession = vi.fn();
    const getRecentBillingRiskSummary = vi.fn().mockResolvedValue({
      recentRefundCount: 2,
      recentRevokedCount: 0,
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: "workspace:1",
          billingOwnerUserId: 7,
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(1),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "NONE",
          entitlementSource: "POLAR",
          customerKey: "cus_123",
          billingOwnerUserId: 7,
        }),
        findActiveProviderProduct: vi.fn(),
        getRecentBillingRiskSummary,
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.startBasicCheckout(ctx, {
        locale: "ko",
        idempotencyKey: "idem_risk",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_REVIEW_REQUIRED",
      }),
    );
    expect(getRecentBillingRiskSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 1,
        customerKey: "cus_123",
        customerExternalRef: "workspace:1",
        billingOwnerUserId: 7,
      }),
    );
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("EXPIRED 상태에서는 기존 customer external ref로 Basic checkout을 시작한다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: null,
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: "workspace-checkout:pending_1",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(1),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "EXPIRED",
          entitlementSource: "POLAR",
        }),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_basic",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await service.startBasicCheckout(ctx, {
      seatCount: 2,
      locale: "en",
      idempotencyKey: "idem_2",
    });

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        externalCustomerId: "workspace-checkout:pending_1",
        seats: 2,
        minSeats: 1,
        maxSeats: 999,
      }),
    );
  });

  it("프로모션 혜택이 만료된 워크스페이스는 Basic checkout을 시작할 수 있다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_promo",
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_promo",
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(2),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "EXPIRED",
          entitlementSource: "BETA_PROMOTIONAL_GRANT",
          customerKey: null,
          billingOwnerUserId: 7,
        }),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_basic",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.startBasicCheckout(ctx, {
        locale: "ko",
        idempotencyKey: "idem_promo",
      }),
    ).resolves.toEqual({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_promo",
    });
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        externalCustomerId: "workspace:1",
        seats: 2,
        minSeats: 2,
        metadata: expect.objectContaining({
          flow: "workspace_resubscribe",
          workspaceUid: "ws_promo",
          targetPlanCode: "BASIC",
        }),
      }),
    );
  });

  it("수동 권한이 종료된 워크스페이스도 Basic checkout을 시작할 수 있다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: "chk_manual",
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_manual",
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(1),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "NONE",
          entitlementSource: "MANUAL_GRANT",
          customerKey: null,
          billingOwnerUserId: 7,
        }),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_basic",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await service.startBasicCheckout(ctx, {
      locale: "ko",
      idempotencyKey: "idem_manual",
    });

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        externalCustomerId: "workspace:1",
        metadata: expect.objectContaining({
          flow: "workspace_resubscribe",
          workspaceUid: "ws_manual",
        }),
      }),
    );
  });

  it("요청 seat가 현재 멤버 수보다 작으면 현재 멤버 수를 checkout seat 최소값으로 사용한다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
      checkoutId: null,
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(4),
        findSeatEntitlement: vi.fn(),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_basic",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await service.startBasicCheckout(ctx, {
      seatCount: 1,
      locale: "ko",
      idempotencyKey: "idem_2",
    });

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        seats: 4,
        minSeats: 4,
        maxSeats: 999,
      }),
    );
  });

  it("ACTIVE 상태에서는 새 checkout 대신 portal을 쓰도록 막는다", async () => {
    const createCheckoutSession = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(1),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
        }),
        findActiveProviderProduct: vi.fn(),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.startBasicCheckout(ctx, {
        locale: "ko",
        idempotencyKey: "idem_3",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_NOT_READY",
      }),
    );
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("REVOKED 상태는 마지막 entitlement source와 무관하게 수동 검토로 막는다", async () => {
    const createCheckoutSession = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_revoked",
          name: "Dowin",
          planCode: "FREE",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(1),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "REVOKED",
          entitlementSource: "BETA_PROMOTIONAL_GRANT",
        }),
        findActiveProviderProduct: vi.fn(),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats: vi.fn(),
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.startBasicCheckout(ctx, {
        locale: "ko",
        idempotencyKey: "idem_revoked",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_REVIEW_REQUIRED",
      }),
    );
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("ACTIVE Basic Polar 구독의 seat 증가를 즉시 반영 정책으로 요청한다", async () => {
    const updateSubscriptionSeats = vi.fn().mockResolvedValue({
      subscriptionId: "sub_123",
      seats: 6,
      pendingSeats: null,
    });
    const upsertWorkspaceSeatEntitlement = vi.fn().mockResolvedValue(undefined);
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(4),
        findSeatEntitlement: vi.fn().mockResolvedValue({
          purchasedSeatCount: 5,
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          subscriptionKey: "sub_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
        upsertWorkspaceSeatEntitlement,
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats,
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.updateSubscriptionSeats(ctx, {
        seatCount: 6,
      }),
    ).resolves.toEqual({
      seatCount: 6,
      appliedSeatCount: 6,
      pendingSeatCount: null,
      effectiveTiming: "IMMEDIATE",
    });
    expect(updateSubscriptionSeats).toHaveBeenCalledWith({
      subscriptionId: "sub_123",
      seatCount: 6,
      prorationBehavior: "prorate",
    });
    expect(upsertWorkspaceSeatEntitlement).toHaveBeenCalledWith({
      workspaceId: 1,
      purchasedSeatCount: 6,
      seatSource: "POLAR",
    });
  });

  it("ACTIVE Basic Polar 구독의 seat 감소를 다음 결제주기 적용 정책으로 요청한다", async () => {
    const updateSubscriptionSeats = vi.fn().mockResolvedValue({
      subscriptionId: "sub_123",
      seats: 5,
      pendingSeats: 4,
    });
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(3),
        findSeatEntitlement: vi.fn().mockResolvedValue({
          purchasedSeatCount: 5,
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          subscriptionKey: "sub_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats,
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.updateSubscriptionSeats(ctx, {
        seatCount: 4,
      }),
    ).resolves.toEqual({
      seatCount: 4,
      appliedSeatCount: 5,
      pendingSeatCount: 4,
      effectiveTiming: "NEXT_PERIOD",
    });
    expect(updateSubscriptionSeats).toHaveBeenCalledWith({
      subscriptionId: "sub_123",
      seatCount: 4,
      prorationBehavior: "next_period",
    });
  });

  it("요청 seat가 현재 구매 seat와 같으면 Polar 변경 요청을 보내지 않는다", async () => {
    const updateSubscriptionSeats = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(3),
        findSeatEntitlement: vi.fn().mockResolvedValue({
          purchasedSeatCount: 5,
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          subscriptionKey: "sub_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats,
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.updateSubscriptionSeats(ctx, {
        seatCount: 5,
      }),
    ).resolves.toEqual({
      seatCount: 5,
      appliedSeatCount: 5,
      pendingSeatCount: null,
      effectiveTiming: "UNCHANGED",
    });
    expect(updateSubscriptionSeats).not.toHaveBeenCalled();
  });

  it("요청 seat가 현재 멤버 수보다 작으면 구독 seat 변경을 막는다", async () => {
    const updateSubscriptionSeats = vi.fn();
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "BASIC",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "ADMIN" }),
        countMembers: vi.fn().mockResolvedValue(4),
        findSeatEntitlement: vi.fn(),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          planCode: "BASIC",
          billingStatus: "ACTIVE",
          entitlementSource: "POLAR",
          subscriptionKey: "sub_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
        getCheckoutSession: vi.fn(),
        updateSubscriptionSeats,
        getSubscriptionSeatUpdate: vi.fn().mockResolvedValue(null),
        findSubscriptionByCheckoutId: vi.fn(),
        findSubscriptionSeatMemberId: vi.fn(),
        assignSubscriptionSeat: vi.fn(),
      },
    );

    await expect(
      service.updateSubscriptionSeats(ctx, {
        seatCount: 3,
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_SEAT_COUNT_BELOW_MEMBER_COUNT",
      }),
    );
    expect(updateSubscriptionSeats).not.toHaveBeenCalled();
  });

  it("관리자가 아니면 Basic checkout을 시작할 수 없다", async () => {
    const service = new BillingService(
      {
        resolveIdByUid: vi.fn().mockResolvedValue(1),
        findWorkspaceById: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_abc",
          name: "Dowin",
          planCode: "FREE",
        }),
        findMembership: vi.fn().mockResolvedValue({ role: "MEMBER" }),
        countMembers: vi.fn(),
      } as never,
      {
        findWorkspaceBillingState: vi.fn(),
        findActiveProviderProduct: vi.fn(),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
    );

    await expect(
      service.startBasicCheckout(memberCtx, {
        locale: "ko",
        idempotencyKey: "idem_4",
      }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<ForbiddenError>>({
        code: "FORBIDDEN",
      }),
    );
  });
});
