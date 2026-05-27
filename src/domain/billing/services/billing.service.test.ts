import { ConflictError, ForbiddenError } from "@/lib/server/errors";
import { describe, expect, it, vi } from "vitest";
import { BillingService } from "./billing.service";

describe("BillingService", () => {
  it("billing state가 없으면 workspace planCode와 NONE 상태를 반환한다", async () => {
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          uid: "ws_1",
          name: "Dowin",
          planCode: "FREE",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_standard",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn().mockResolvedValue(null),
        appendCheckoutEvent: vi.fn().mockResolvedValue(null),
      } as never,
    );

    await expect(service.getMyBilling(7)).resolves.toEqual({
      workspaceId: "ws_1",
      workspaceName: "Dowin",
      planCode: "FREE",
      billingStatus: "NONE",
      entitlementSource: null,
      provider: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      billingOwnerUserId: null,
      recentRefundCount: 0,
      recentRevokedCount: 0,
      requiresManualReview: false,
      canManageBilling: true,
    });
  });

  it("admin이 아니면 checkout을 시작할 수 없다", async () => {
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "FREE",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "MEMBER",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn(),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn(),
        appendCheckoutEvent: vi.fn(),
      } as never,
    );

    await expect(service.prepareCheckout(7, "k1", "ko")).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("admin이어도 Polar 연동 전에는 billing not ready를 반환한다", async () => {
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "FREE",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn(),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn(),
        appendCheckoutEvent: vi.fn(),
      } as never,
    );

    await expect(service.prepareCheckout(7, "k1", "ko")).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_NOT_READY",
      }),
    );
  });

  it("admin이면 Polar checkout url을 생성한다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
    });
    const findCheckoutSessionCreatedEvent = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        payloadJson: JSON.stringify({
          checkoutUrl: "https://polar.sh/checkout",
        }),
      });
    const appendCheckoutEvent = vi.fn().mockResolvedValue(null);
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_standard",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent,
        appendCheckoutEvent,
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
      },
    );

    await expect(service.prepareCheckout(7, "k1", "ko")).resolves.toEqual({
      checkoutUrl: "https://polar.sh/checkout",
    });
    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod_standard",
        locale: "ko",
      }),
    );
    expect(appendCheckoutEvent).toHaveBeenCalledTimes(2);
  });

  it("같은 멱등 키의 checkout session 로그가 있으면 기존 url을 재사용한다", async () => {
    const createCheckoutSession = vi.fn();
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_standard",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn().mockResolvedValue({
          payloadJson: JSON.stringify({
            checkoutUrl: "https://polar.sh/existing",
          }),
        }),
        appendCheckoutEvent: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
      },
    );

    await expect(service.prepareCheckout(7, "k1", "ko")).resolves.toEqual({
      checkoutUrl: "https://polar.sh/existing",
    });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("workspace planCode가 STANDARD여도 billing projection이 EXPIRED면 checkout을 다시 시작할 수 있다", async () => {
    const createCheckoutSession = vi.fn().mockResolvedValue({
      checkoutUrl: "https://polar.sh/checkout",
    });
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "STANDARD",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          billingStatus: "EXPIRED",
        }),
        findActiveProviderProduct: vi.fn().mockResolvedValue({
          providerProductId: "prod_standard",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn().mockResolvedValue(null),
        appendCheckoutEvent: vi.fn().mockResolvedValue(null),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession,
        createCustomerSession: vi.fn(),
      },
    );

    await expect(service.prepareCheckout(7, "k2", "ko")).resolves.toEqual({
      checkoutUrl: "https://polar.sh/checkout",
    });
    expect(createCheckoutSession).toHaveBeenCalled();
  });

  it("manual grant 상태에서는 portal을 열 수 없다", async () => {
    const createCustomerSession = vi.fn();
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "STANDARD",
          billingCustomerExternalRef: null,
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "MANUAL_GRANT",
          customerKey: null,
        }),
        getRecentBillingRiskSummary: vi.fn(),
        findCheckoutSessionCreatedEvent: vi.fn(),
        appendCheckoutEvent: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
      },
    );

    await expect(service.getPortalUrl(7)).rejects.toEqual(
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
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "STANDARD",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "POLAR",
          customerKey: "cus_123",
        }),
        getRecentBillingRiskSummary: vi.fn(),
        findCheckoutSessionCreatedEvent: vi.fn(),
        appendCheckoutEvent: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
      },
    );

    await expect(service.getPortalUrl(7)).resolves.toBe(
      "https://polar.sh/portal",
    );
    expect(createCustomerSession).toHaveBeenCalledWith({
      customerId: "cus_123",
    });
  });

  it("활성 Polar product 매핑이 없으면 checkout을 시작할 수 없다", async () => {
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        findActiveProviderProduct: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn().mockResolvedValue(null),
        appendCheckoutEvent: vi.fn().mockResolvedValue(null),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
      },
    );

    await expect(service.prepareCheckout(7, "k1", "ko")).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_NOT_READY",
      }),
    );
  });

  it("최근 환불/취소 이력이 누적되면 checkout을 막는다", async () => {
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "FREE",
          billingCustomerExternalRef: null,
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 1,
          recentRevokedCount: 1,
        }),
        findCheckoutSessionCreatedEvent: vi.fn().mockResolvedValue(null),
        appendCheckoutEvent: vi.fn().mockResolvedValue(null),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession: vi.fn(),
      },
    );

    await expect(service.prepareCheckout(7, "k1", "ko")).rejects.toEqual(
      expect.objectContaining<Partial<ConflictError>>({
        code: "BILLING_REVIEW_REQUIRED",
      }),
    );
  });

  it("admin이면 Polar portal url을 반환한다", async () => {
    const createCustomerSession = vi.fn().mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal",
    });
    const service = new BillingService(
      {
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "STANDARD",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue({
          entitlementSource: "POLAR",
          customerKey: "cus_123",
        }),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn(),
        appendCheckoutEvent: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
      },
    );

    await expect(service.getPortalUrl(7)).resolves.toBe(
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
        findUserWorkspace: vi.fn().mockResolvedValue({
          id: 1,
          name: "Dowin",
          planCode: "STANDARD",
          billingCustomerExternalRef: "workspace:1",
        }),
        findMembershipByUserId: vi.fn().mockResolvedValue({
          role: "ADMIN",
        }),
      } as never,
      {
        findWorkspaceBillingState: vi.fn().mockResolvedValue(null),
        getRecentBillingRiskSummary: vi.fn().mockResolvedValue({
          recentRefundCount: 0,
          recentRevokedCount: 0,
        }),
        findCheckoutSessionCreatedEvent: vi.fn(),
        appendCheckoutEvent: vi.fn(),
      } as never,
      {
        environment: "sandbox",
        createCheckoutSession: vi.fn(),
        createCustomerSession,
      },
    );

    await expect(service.getPortalUrl(7)).resolves.toBe(
      "https://polar.sh/portal",
    );
    expect(createCustomerSession).toHaveBeenCalledWith({
      externalCustomerId: "workspace:1",
    });
  });
});
