import { ConflictError, ForbiddenError } from "@/lib/server/errors";
import { describe, expect, it, vi } from "vitest";
import { BillingService } from "./billing.service";

describe("BillingService", () => {
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

    await expect(service.getMyBilling("ws_abc", 7)).resolves.toEqual({
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
      usedSeatCount: 1,
      canManageBilling: true,
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

    await expect(service.getMyBilling("ws_abc", 7)).resolves.toMatchObject({
      purchasedSeatCount: 5,
      usedSeatCount: 3,
    });
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
      },
    );

    await expect(service.getPortalUrl("ws_abc", 7)).rejects.toEqual(
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
        }),
        getRecentBillingRiskSummary: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
        getCheckoutSession: vi.fn(),
      },
    );

    await expect(service.getPortalUrl("ws_abc", 7)).resolves.toBe(
      "https://polar.sh/portal",
    );
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: "cus_123",
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
      },
    );

    await expect(service.getPortalUrl("ws_abc", 7)).resolves.toBe(
      "https://polar.sh/portal",
    );
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
      },
    );

    await expect(
      service.startBasicCheckout({
        workspaceUid: "ws_abc",
        userId: 7,
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
        successPath: "/billing/polar/success",
        metadata: expect.objectContaining({
          flow: "workspace_resubscribe",
          workspaceId: "1",
          workspaceUid: "ws_abc",
          requestedByUserId: "7",
          targetPlanCode: "BASIC",
          requestedSeatCount: "3",
        }),
      }),
    );
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
      },
    );

    await service.startBasicCheckout({
      workspaceUid: "ws_abc",
      userId: 7,
      seatCount: 2,
      locale: "en",
      idempotencyKey: "idem_2",
    });

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        externalCustomerId: "workspace-checkout:pending_1",
        seats: 2,
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
      },
    );

    await expect(
      service.startBasicCheckout({
        workspaceUid: "ws_abc",
        userId: 7,
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
      service.startBasicCheckout({
        workspaceUid: "ws_abc",
        userId: 7,
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
